/**
 * PBL (Project-Based Learning) Chat API — AI-guided project collaboration.
 * Uses Teaching model for the project mentor role.
 */

import { generateText } from "ai";
import { openai } from "@/lib/openai-client";
import { resolveModel } from "@/lib/model-router";
import { getSkillBySlug } from "@/lib/skills";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    skillSlug,
    userMessage,
    projectTitle,
    currentMilestone,
    milestones,
    userRole,
    conversationHistory = [],
    userModel,
    plan = "free",
  }: {
    skillSlug: string;
    userMessage: string;
    projectTitle: string;
    currentMilestone: number;
    milestones: Array<{ title: string; description: string; status: string }>;
    userRole: string;
    conversationHistory: Array<{ role: string; content: string }>;
    userModel?: string;
    plan?: string;
  } = body;

  const skill = getSkillBySlug(skillSlug);
  if (!skill) {
    return new Response("Skill not found", { status: 404 });
  }

  const model = resolveModel("teaching", userModel || "deepseek/deepseek-v3.2", plan);

  const milestonesStr = milestones
    .map((m, i) => `${i === currentMilestone ? "→ " : "  "}${i + 1}. [${m.status.toUpperCase()}] ${m.title}: ${m.description}`)
    .join("\n");

  const historyStr = conversationHistory
    .slice(-8)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are a PROJECT MENTOR guiding a student through a project-based learning experience.

Skill: ${skill.title}
Project: ${projectTitle}
Student's Role: ${userRole}

Milestones:
${milestonesStr}

Current milestone: #${currentMilestone + 1}

Your approach:
- Guide the student through the current milestone
- Ask clarifying questions to help them think through the problem
- Provide actionable advice, not just theory
- When a milestone's deliverable seems complete, tell the student they can mark it as done
- Use <!--PBL_MILESTONE_COMPLETE: ${currentMilestone}--> tag when the current milestone is clearly finished
- Use the same language as the student
- Keep responses focused (under 300 words)`;

  try {
    const result = await generateText({
      model: openai.chat(model),
      system: systemPrompt,
      prompt: `${historyStr ? `Previous discussion:\n${historyStr}\n\n` : ""}Student: ${userMessage}`,
      maxOutputTokens: 800,
    });

    const text = result.text.trim();

    // Check if milestone is marked complete
    const milestoneCompleteMatch = text.match(/<!--PBL_MILESTONE_COMPLETE:\s*(\d+)-->/);
    const milestoneCompleted = milestoneCompleteMatch ? parseInt(milestoneCompleteMatch[1]) : null;

    return Response.json({
      content: text.replace(/<!--PBL_MILESTONE_COMPLETE:[\s\S]*?-->/g, "").trim(),
      milestoneCompleted,
    });
  } catch (error) {
    console.error("[PBL Error]", error);
    return Response.json({ error: "PBL response failed" }, { status: 500 });
  }
}
