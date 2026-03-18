/**
 * Slide Generation API — generates a set of slides for a skill topic.
 * Uses the Generation model for cost efficiency.
 */

import { generateText } from "ai";
import { openai } from "@/lib/openai-client";
import { resolveModel } from "@/lib/model-router";
import { getSkillBySlug } from "@/lib/skills";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    skillSlug,
    topic,
    conversationSummary,
    slideCount = 8,
    userModel,
    plan = "free",
  }: {
    skillSlug: string;
    topic?: string;
    conversationSummary?: string;
    slideCount?: number;
    userModel?: string;
    plan?: string;
  } = body;

  const skill = getSkillBySlug(skillSlug);
  if (!skill) {
    return new Response("Skill not found", { status: 404 });
  }

  const model = resolveModel("generation", userModel || "deepseek/deepseek-v3.2", plan);

  const prompt = `Generate a set of ${Math.min(slideCount, 12)} educational slides about "${topic || skill.title}".

${conversationSummary ? `Context from learning session:\n${conversationSummary.slice(0, 1000)}` : ""}

Skill methodology: ${skill.methodology.slice(0, 500)}

Respond ONLY with valid JSON (no markdown code blocks):
{
  "title": "Slide set title",
  "slides": [
    {
      "title": "Slide title",
      "content": "Markdown content for the slide body",
      "speakerNotes": "Teacher notes for this slide",
      "layout": "title|content|twoColumn|quiz"
    }
  ]
}

Rules:
- First slide should be a "title" layout with the topic overview
- Use "content" layout for most slides
- Use "twoColumn" for comparisons
- Include 1 "quiz" slide near the end with a question
- Content should be concise — bullet points, not paragraphs
- Use the same language as the topic/context. If Chinese, write in Chinese.
- Include code examples or formulas where relevant`;

  try {
    const result = await generateText({
      model: openai.chat(model),
      prompt,
      maxOutputTokens: 3000,
    });

    const text = result.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "Invalid response format" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Add IDs to slides
    const slides = (parsed.slides || []).map((s: Record<string, string>, i: number) => ({
      id: `slide-${Date.now()}-${i}`,
      title: s.title || `Slide ${i + 1}`,
      content: s.content || "",
      speakerNotes: s.speakerNotes || "",
      layout: s.layout || "content",
      elements: s.elements || undefined,
    }));

    return Response.json({
      title: parsed.title || skill.title,
      slides,
    });
  } catch (error) {
    console.error("[Slides Error]", error);
    return Response.json({ error: "Slide generation failed" }, { status: 500 });
  }
}
