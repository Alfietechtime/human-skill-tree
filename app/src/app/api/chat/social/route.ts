import { generateText } from "ai";
import { openai } from "@/lib/openai-client";
import { resolveModel } from "@/lib/model-router";

interface TutorInfo {
  key: string;
  name: string;
  emoji: string;
  personality: string;
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    skillSlug,
    tutorTeam,
    sessionSummary,
    storyBackground,
  }: {
    skillSlug: string;
    tutorTeam: TutorInfo[];
    sessionSummary: string;
    storyBackground?: string;
  } = body;

  if (!skillSlug || !tutorTeam || tutorTeam.length === 0 || !sessionSummary) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Use a cheap/fast model via model router
  const socialModel = resolveModel("generation", "deepseek/deepseek-v3.2", "free");

  const tutorDescriptions = tutorTeam
    .map((t) => `- ${t.name} (${t.emoji}): ${t.personality.slice(0, 80)}`)
    .join("\n");

  const prompt = `You are generating social content for an AI tutoring app. The student just had a learning session.

## Context
- Skill: ${skillSlug}
- Session summary: ${sessionSummary}
${storyBackground ? `- Story setting: ${storyBackground}` : ""}

## Tutor Team
${tutorDescriptions}

## Task
Generate TWO things in JSON format:

1. **groupChat**: A short group chat (3-5 messages) between the tutors discussing the student's performance. Each tutor should speak in their unique personality. The student is NOT in the chat — they're "overhearing" it. Make it feel natural, warm, and sometimes funny. Tutors should reference specific things from the session summary.

2. **diary**: A single diary entry written in first person from the student's perspective. Warm, reflective tone. Include an appropriate mood emoji. 2-3 sentences.

Respond ONLY with valid JSON, no markdown code blocks:
{
  "groupChat": [
    { "tutorKey": "aria", "content": "message text" },
    { "tutorKey": "marcus", "content": "message text" }
  ],
  "diary": {
    "content": "Today I learned...",
    "mood": "😊"
  }
}

Use the same language as the session summary. If the summary is in Chinese, write in Chinese.`;

  try {
    const result = await generateText({
      model: openai.chat(socialModel),
      prompt,
      maxOutputTokens: 800,
    });

    // Parse the JSON response
    const text = result.text.trim();
    // Try to extract JSON from possible markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "Invalid response format" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const now = new Date().toISOString();

    // Enrich group chat messages with tutor info
    const tutorMap = new Map(tutorTeam.map((t) => [t.key, t]));
    const groupChat = (parsed.groupChat || []).map((msg: { tutorKey: string; content: string }) => {
      const tutor = tutorMap.get(msg.tutorKey) || tutorTeam[0];
      return {
        tutorKey: msg.tutorKey,
        tutorName: tutor.name,
        tutorEmoji: tutor.emoji,
        content: msg.content,
        timestamp: now,
      };
    });

    const diary = {
      content: parsed.diary?.content || "",
      mood: parsed.diary?.mood || "📝",
      skillSlug,
      timestamp: now,
    };

    return Response.json({ groupChat, diary });
  } catch (error) {
    console.error("[Social API Error]", error);
    return Response.json({ error: "Failed to generate social content" }, { status: 500 });
  }
}
