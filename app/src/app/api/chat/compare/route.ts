import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getSkillBySlug } from "@/lib/skills";
import {
  getTutorByKey,
  buildTutorPrompt,
  buildSocraticPrompt,
} from "@/lib/tutors";

/**
 * Auto-detect proxy (reuse same logic as main route)
 */
function detectProxyUrl(): string | null {
  const envProxy =
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy ||
    process.env.all_proxy;
  if (envProxy) return envProxy;

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
          return server;
        }
      }
    } catch {
      // continue without proxy
    }
  }
  return null;
}

function createProxyFetch(): typeof globalThis.fetch | undefined {
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
    return undefined;
  }
}

const proxyFetch = createProxyFetch();

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  ...(proxyFetch ? { fetch: proxyFetch } : {}),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { question, tutorKeys, skillSlug, model } = body as {
    question: string;
    tutorKeys: string[];
    skillSlug: string;
    model?: string;
  };

  if (!question || !tutorKeys?.length || !skillSlug) {
    return new Response("Missing required fields", { status: 400 });
  }

  const skill = getSkillBySlug(skillSlug);
  if (!skill) {
    return new Response("Skill not found", { status: 404 });
  }

  const modelId = model || process.env.OPENAI_MODEL || "deepseek/deepseek-chat-v3-0324";

  const promises = tutorKeys.map(async (key) => {
    const tutor = getTutorByKey(key);
    if (!tutor) return null;

    const systemParts = [
      buildTutorPrompt(tutor),
      "",
      buildSocraticPrompt(),
      "",
      `You are teaching the skill: "${skill.title}".`,
      "",
      "## Instructions",
      skill.instructions,
      "",
      "Respond in the same language the user uses.",
      "Use Markdown formatting. Keep response concise (under 300 words).",
      "Do NOT include any hidden HTML comment tags (no <!--KP:-->, <!--TAUGHT:-->, etc).",
    ];

    const result = await generateText({
      model: openai.chat(modelId),
      system: systemParts.join("\n"),
      prompt: question,
    });

    return {
      tutorKey: tutor.key,
      tutorName: tutor.name,
      tutorEmoji: tutor.emoji,
      content: result.text,
    };
  });

  const results = await Promise.all(promises);
  const responses = results.filter(Boolean);

  return Response.json({ responses });
}
