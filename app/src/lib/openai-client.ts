/**
 * Shared OpenAI client factory with proxy auto-detection.
 * All API routes should use this instead of duplicating proxy logic.
 */

import { createOpenAI } from "@ai-sdk/openai";

/**
 * Auto-detect proxy: env vars → Windows system proxy (registry).
 * No manual config needed — automatically picks up system/Clash/V2Ray proxy.
 */
export function detectProxyUrl(): string | null {
  // 1. Check environment variables
  const envProxy =
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy ||
    process.env.all_proxy;
  if (envProxy) return envProxy;

  // 2. On Windows, read system proxy from registry
  if (process.platform === "win32") {
    try {
      const { execSync } = require("child_process");
      const regOutput = execSync(
        'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable',
        { encoding: "utf-8", timeout: 3000 }
      );
      const enableMatch = regOutput.match(/ProxyEnable\s+REG_DWORD\s+0x(\d+)/);
      if (enableMatch && parseInt(enableMatch[1], 16) === 1) {
        const serverOutput = execSync(
          'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer',
          { encoding: "utf-8", timeout: 3000 }
        );
        const serverMatch = serverOutput.match(/ProxyServer\s+REG_SZ\s+(.+)/);
        if (serverMatch) {
          let server = serverMatch[1].trim();
          if (server.includes("=")) {
            const parts = server.split(";");
            const httpsPart = parts.find((p: string) => p.startsWith("https="));
            const httpPart = parts.find((p: string) => p.startsWith("http="));
            server = (httpsPart || httpPart || parts[0]).split("=")[1];
          }
          if (!server.startsWith("http")) server = `http://${server}`;
          console.log(`[Proxy] Auto-detected system proxy: ${server}`);
          return server;
        }
      }
    } catch {
      // Registry read failed, continue without proxy
    }
  }

  return null;
}

export function createProxyFetch(): typeof globalThis.fetch | undefined {
  const proxyUrl = detectProxyUrl();
  if (!proxyUrl) return undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ProxyAgent } = require("undici");
    const dispatcher = new ProxyAgent(proxyUrl);
    return ((url: string | URL | Request, init?: RequestInit) => {
      return globalThis.fetch(url, { ...init, dispatcher } as RequestInit);
    }) as typeof globalThis.fetch;
  } catch {
    console.warn("[Proxy] undici not available, proxy ignored");
    return undefined;
  }
}

// Singleton proxy fetch — created once at module load
const proxyFetch = createProxyFetch();

/**
 * Create a shared OpenAI-compatible client (via OpenRouter).
 * Uses the same proxy detection as the main chat route.
 */
export function getOpenAIClient() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    ...(proxyFetch ? { fetch: proxyFetch } : {}),
  });
}

// Default singleton instance
export const openai = getOpenAIClient();
