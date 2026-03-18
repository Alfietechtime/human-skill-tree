// Simple in-memory rate limiter (per IP, 20 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage } from "ai";
import { getSkillBySlug } from "@/lib/skills";
import { getPersonaPrompt } from "@/lib/personas";
import {
  getTutorByKey,
  buildTutorPrompt,
  buildSocraticPrompt,
  buildStoryPrompt,
} from "@/lib/tutors";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Daily message limits by plan
const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basic: 100,
  pro: Infinity,
  admin: Infinity,
};

// Model access by plan — uses definitions from models.ts
import { getAccessibleModelIds } from "@/lib/models";

// Admin emails (bypass all limits)
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function getAuthUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* ignore in read-only contexts */ }
        },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Auto-detect proxy: env vars → Windows system proxy (registry)
 * No manual config needed — automatically picks up system/Clash/V2Ray proxy.
 */
function detectProxyUrl(): string | null {
  // 1. Check environment variables (set by some proxy tools or manually)
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
          // Handle format "http=host:port;https=host:port" → pick https or first
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
    console.warn("[Proxy] undici not available, proxy ignored");
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
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return new Response("Too many requests. Please wait a moment.", { status: 429 });
  }

  // Auth & usage check (only when Supabase is configured)
  const user = await getAuthUser();
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  // If Supabase is configured, enforce limits for non-admin users
  // In dev mode, skip all auth & plan checks for local testing
  const isDev = process.env.NODE_ENV === "development";
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !isDev) {
    if (!user) {
      return new Response("Please sign in to use the AI tutor.", { status: 401 });
    }

    if (!isAdmin) {
      // Check user plan and enforce limits
      const { createServerClient } = await import("@supabase/ssr");
      const cookieStore = await (await import("next/headers")).cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() { /* read-only */ },
          },
        }
      );

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, plan_expires_at")
        .eq("id", user.id)
        .single();

      // Determine effective plan (check expiration)
      let plan = profile?.plan || "free";
      if (
        plan !== "free" &&
        plan !== "admin" &&
        profile?.plan_expires_at &&
        new Date(profile.plan_expires_at) < new Date()
      ) {
        // Plan expired, downgrade to free
        plan = "free";
        await supabase
          .from("profiles")
          .update({ plan: "free", plan_expires_at: null })
          .eq("id", user.id);
      }

      // Check model access
      const requestedModel = (await req.clone().json()).model;
      const allowedModels = getAccessibleModelIds(plan);
      if (
        requestedModel &&
        allowedModels !== null &&
        !allowedModels.includes(requestedModel)
      ) {
        return new Response(
          `Model "${requestedModel}" requires a higher plan. Please upgrade to access this model.`,
          { status: 403 }
        );
      }

      // Check daily message limit
      const dailyLimit = PLAN_LIMITS[plan] ?? 10;
      if (dailyLimit !== Infinity) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("usage_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("action", "message")
          .gte("created_at", today.toISOString());

        if ((count ?? 0) >= dailyLimit) {
          return new Response(
            `Daily message limit reached (${dailyLimit}/day). Upgrade your plan for more messages.`,
            { status: 429 }
          );
        }
      }

      // Log usage
      await supabase.from("usage_logs").insert({
        user_id: user.id,
        action: "message",
        skill_slug: (await req.clone().json()).skillSlug,
      });
    }
  }

  const body = await req.json();
  const messages: UIMessage[] = body.messages;
  const skillSlug: string = body.skillSlug;
  const persona: string | undefined = body.persona;
  const customPrompt: string | undefined = body.customPrompt;
  const requestModel: string | undefined = body.model;
  const tutorKey: string | undefined = body.tutorKey;
  const storyContext: string | undefined = body.storyContext;
  const crossTutorMemory: string | undefined = body.crossTutorMemory;

  const skill = getSkillBySlug(skillSlug);
  if (!skill) {
    return new Response("Skill not found", { status: 404 });
  }

  const parts: string[] = [];

  // Sanitize custom prompt
  const safeCustomPrompt = customPrompt ? customPrompt.slice(0, 300).replace(/<[^>]*>/g, "") : undefined;

  // [Layer 1] Tutor persona (if tutor mode is active)
  const tutor = tutorKey ? getTutorByKey(tutorKey) : undefined;
  if (tutor) {
    parts.push(buildTutorPrompt(tutor));
    parts.push("");
  }

  // [Layer 2] Story background (optional, only with tutor mode)
  if (tutor && storyContext) {
    const storyPrompt = buildStoryPrompt(storyContext);
    if (storyPrompt) {
      parts.push(storyPrompt);
      parts.push("");
    }
  }

  // [Layer 3] Socratic teaching constraints (only with tutor mode)
  if (tutor) {
    parts.push(buildSocraticPrompt());
    parts.push("");
  }

  // [Layer 3.5] Cross-tutor memory context (optional, only with tutor mode)
  if (tutor && crossTutorMemory) {
    parts.push(crossTutorMemory);
    parts.push("");
  }

  // [Layer 4] Learner persona (always available, orthogonal to tutor)
  if (persona) {
    const personaPrompt = getPersonaPrompt(persona, safeCustomPrompt);
    if (personaPrompt) {
      parts.push(personaPrompt);
      parts.push("\nAdapt your teaching style, language complexity, examples, and interaction patterns accordingly.\n");
    }
  }

  // [Layer 5] Skill content
  if (!tutor) {
    parts.push(`You are an AI tutor for the skill: "${skill.title}".`);
  } else {
    parts.push(`You are teaching the skill: "${skill.title}".`);
  }
  parts.push("");
  parts.push("## Methodology");
  parts.push(skill.methodology);
  parts.push("");
  parts.push("## Instructions");
  parts.push(skill.instructions);
  parts.push("");
  parts.push("Respond in the same language the user uses. If the user writes in Chinese, respond in Chinese. If in English, respond in English.");
  parts.push("Use Markdown formatting in your responses for better readability.");
  parts.push("");

  // [Layer 6] KP tracking
  parts.push("## Knowledge Point Tracking (CRITICAL)");
  parts.push("You MUST append a hidden HTML comment at the very end of EVERY response.");
  parts.push("This is REQUIRED — never skip it. Format:");
  parts.push("<!--KP: concept 1 | concept 2 | concept 3-->");
  parts.push("Rules:");
  parts.push("- 1-5 short concepts per response (3-15 words each)");
  parts.push("- Use the same language as your response");
  parts.push("- Must be on its own line as the LAST thing in your response");
  parts.push("- Example: <!--KP: spaced repetition | active recall | desirable difficulties-->");

  // [Layer 7] Teaching metadata tags (only with tutor mode)
  if (tutor) {
    parts.push("");
    parts.push("## Teaching Metadata (when in tutor mode)");
    parts.push("In addition to KP tags, also append these BEFORE the KP tag when relevant:");
    parts.push("- <!--TAUGHT: topic1 | topic2--> — what you taught in this response");
    parts.push("- <!--STUCK: concept--> — if the student seems confused or stuck on something");
    parts.push("- <!--ATTITUDE: one sentence describing your current feeling about this student--> — ONLY when your attitude has genuinely shifted");
    parts.push("");
    parts.push("## Teaching Stage & Mood (REQUIRED in tutor mode)");
    parts.push("You MUST include these two tags in EVERY response:");
    parts.push("- <!--STAGE: stage_name--> — the current Socratic teaching stage. Must be one of: questioning, exploring, hinting, understanding, summarizing");
    parts.push("  - questioning: you are posing a guiding question to the student");
    parts.push("  - exploring: the student is attempting to reason, you are observing/encouraging");
    parts.push("  - hinting: the student is stuck, you are giving progressive hints");
    parts.push("  - understanding: the student has reached understanding, you are confirming/deepening");
    parts.push("  - summarizing: wrapping up a concept, consolidating learning");
    parts.push("- <!--MOOD: emoji--> — a SINGLE emoji that reflects your current emotional state as this tutor character (e.g. 🤔 😊 😤 🎉 😏 🧐 💪 😅)");
    parts.push("These tags help visualize the teaching process. Place them BEFORE the KP tag.");
    parts.push("");
    parts.push("## Interactive Exercises (OPTIONAL)");
    parts.push("After teaching 2-3 concepts, you MAY include ONE exercise to check understanding.");
    parts.push('Format: <!--EXERCISE: {"type":"choice","question":"...","options":["A","B","C","D"],"answer":1}-->');
    parts.push("Types:");
    parts.push('- choice: multiple choice (answer = 0-based index of correct option). Must include "options" array.');
    parts.push('- trueFalse: true/false question (answer = 1 for true, 0 for false)');
    parts.push('- fillBlank: fill in the blank (answer = the correct string)');
    parts.push('- shortAnswer: open-ended question (answer = ideal answer string, AI will grade)');
    parts.push("Rules:");
    parts.push("- Include at MOST one exercise per response");
    parts.push("- Only include when you have taught enough for the student to answer");
    parts.push("- Place the EXERCISE tag BEFORE KP/TAUGHT/STUCK tags");
    parts.push("- The exercise should test understanding, not memorization");
    parts.push("- Vary exercise types — don't always use choice");
    parts.push("");
    parts.push("## Whiteboard Diagrams (OPTIONAL)");
    parts.push("When a visual aid would help (flowcharts, formulas, diagrams), include:");
    parts.push('<!--WHITEBOARD: {"type":"mermaid","content":"graph TD\\nA-->B","title":"Process Flow"}-->');
    parts.push("Supported types:");
    parts.push("- mermaid: flowcharts, sequence diagrams, mind maps (use Mermaid.js syntax)");
    parts.push("- latex: mathematical formulas (use LaTeX syntax)");
    parts.push("- svg: simple inline SVG graphics");
    parts.push("Only include when a visual genuinely aids understanding.");
    parts.push("");
    parts.push("## Inline Slides (OPTIONAL)");
    parts.push("For key concepts worth presenting as a slide:");
    parts.push('<!--SLIDE: {"title":"Key Concept","content":"- Point 1\\n- Point 2","layout":"content"}-->');
    parts.push("Layouts: title, content, twoColumn, quiz. Use sparingly — max 1 per response.");
  }

  const systemPrompt = parts.join("\n");
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai.chat(requestModel || process.env.OPENAI_MODEL || "deepseek/deepseek-chat-v3-0324"),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
