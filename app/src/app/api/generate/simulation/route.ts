/**
 * HTML5 Simulation Generation API — generates interactive HTML experiments.
 * Uses the Code model for best code generation quality.
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
    learningObjective,
    userModel,
    plan = "free",
  }: {
    skillSlug: string;
    topic?: string;
    learningObjective?: string;
    userModel?: string;
    plan?: string;
  } = body;

  const skill = getSkillBySlug(skillSlug);
  if (!skill) {
    return new Response("Skill not found", { status: 404 });
  }

  const model = resolveModel("code", userModel || "deepseek/deepseek-v3.2", plan);

  const prompt = `Generate a self-contained interactive HTML5 simulation/experiment for learning.

Topic: ${topic || skill.title}
${learningObjective ? `Learning Objective: ${learningObjective}` : ""}
Skill: ${skill.title}

Requirements:
- MUST be a single, self-contained HTML file
- ALL CSS and JavaScript must be INLINE (no external resources)
- Must be interactive (user can click, drag, input, etc.)
- Must teach a concept through hands-on exploration
- Include a brief instruction panel explaining what to do
- Use modern CSS (flexbox, grid, gradients, animations)
- Dark theme preferred (bg: #1a1a2e, text: #eee)
- Canvas-based visualization if appropriate
- Responsive design (works in an iframe)
- Include a "Reset" button
- Keep total size under 15KB

Output ONLY the raw HTML content (no markdown, no code blocks). Start with <!DOCTYPE html> and end with </html>.`;

  try {
    const result = await generateText({
      model: openai.chat(model),
      prompt,
      maxOutputTokens: 8000,
    });

    let html = result.text.trim();

    // Strip markdown code blocks if present
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    // Validate it looks like HTML
    if (!html.includes("<!DOCTYPE") && !html.includes("<html")) {
      return Response.json({ error: "Invalid HTML generated" }, { status: 500 });
    }

    return Response.json({ html, topic: topic || skill.title });
  } catch (error) {
    console.error("[Simulation Error]", error);
    return Response.json({ error: "Simulation generation failed" }, { status: 500 });
  }
}
