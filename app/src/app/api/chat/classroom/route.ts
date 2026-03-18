/**
 * Classroom Mode API — multi-agent conversation endpoint.
 * Orchestrates Teacher + Assistant + AI Students in a classroom setting.
 * Returns SSE stream with multiple agent responses per turn.
 */

import { generateText } from "ai";
import { openai } from "@/lib/openai-client";
import { resolveModel } from "@/lib/model-router";
import { getSkillBySlug } from "@/lib/skills";
import { getTutorByKey, buildTutorPrompt } from "@/lib/tutors";

interface ClassroomMessage {
  role: string; // "teacher" | "assistant" | "studentA" | "studentB" | "user"
  name: string;
  emoji: string;
  content: string;
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    skillSlug,
    userMessage,
    history = [],
    teacherTutorKey,
    assistantTutorKey,
    userModel,
    plan = "free",
  }: {
    skillSlug: string;
    userMessage: string;
    history: ClassroomMessage[];
    teacherTutorKey: string;
    assistantTutorKey?: string;
    userModel: string;
    plan?: string;
  } = body;

  const skill = getSkillBySlug(skillSlug);
  if (!skill) {
    return new Response("Skill not found", { status: 404 });
  }

  const teacher = getTutorByKey(teacherTutorKey);
  const assistant = assistantTutorKey ? getTutorByKey(assistantTutorKey) : null;

  const teachingModel = resolveModel("teaching", userModel, plan);
  const genModel = resolveModel("generation", userModel, plan);

  // Build conversation context
  const contextStr = history
    .slice(-10)
    .map((m) => `${m.emoji} ${m.name}: ${m.content}`)
    .join("\n");

  const skillContext = `Skill: "${skill.title}"\n${skill.methodology.slice(0, 500)}`;

  // Determine which agents should speak
  const agentResponses: ClassroomMessage[] = [];

  // Teacher always responds to user input
  try {
    const teacherPrompt = teacher ? buildTutorPrompt(teacher) : "";
    const teacherResult = await generateText({
      model: openai.chat(teachingModel),
      system: `${teacherPrompt}\n\nYou are the LEAD TEACHER in a classroom discussion about: ${skillContext}\n\nKeep responses focused (under 200 words). Address the student directly. Use the same language as the student.`,
      prompt: `Previous discussion:\n${contextStr}\n\nStudent says: ${userMessage}\n\nRespond as the teacher:`,
      maxOutputTokens: 500,
    });

    agentResponses.push({
      role: "teacher",
      name: teacher?.name || "Teacher",
      emoji: teacher?.emoji || "👨‍🏫",
      content: teacherResult.text.trim(),
    });
  } catch (error) {
    console.error("[Classroom Teacher Error]", error);
  }

  // Student A might chime in (60% chance)
  if (Math.random() < 0.6) {
    try {
      const studentAResult = await generateText({
        model: openai.chat(genModel),
        system: `You are MIA 🙋, a curious student in a classroom. You ask "why" and "how" questions or share your own confusion. Keep it to 1-2 sentences. Use the same language as the conversation.`,
        prompt: `Topic: ${skill.title}\nTeacher just said: ${agentResponses[0]?.content || ""}\n\nReact briefly as a curious student:`,
        maxOutputTokens: 150,
      });

      agentResponses.push({
        role: "studentA",
        name: "Mia",
        emoji: "🙋",
        content: studentAResult.text.trim(),
      });
    } catch {
      // Non-critical
    }
  }

  // Assistant might add perspective (40% chance, only if exists)
  if (assistant && Math.random() < 0.4) {
    try {
      const assistantResult = await generateText({
        model: openai.chat(teachingModel),
        system: `You are ${assistant.name}, a teaching assistant. Add a complementary perspective or example in 1-2 sentences. Don't repeat what the teacher said. Use the same language as the conversation.`,
        prompt: `Teacher (${teacher?.name}) said: ${agentResponses[0]?.content || ""}\nStudent asked: ${userMessage}\n\nAdd your perspective:`,
        maxOutputTokens: 200,
      });

      agentResponses.push({
        role: "assistant",
        name: assistant.name,
        emoji: assistant.emoji,
        content: assistantResult.text.trim(),
      });
    } catch {
      // Non-critical
    }
  }

  // Student B might challenge or add nuance (30% chance)
  if (Math.random() < 0.3) {
    try {
      const studentBResult = await generateText({
        model: openai.chat(genModel),
        system: `You are ALEX 🤓, a studious student who likes to fact-check or add nuances. Keep it to 1-2 sentences. Use the same language as the conversation.`,
        prompt: `Topic: ${skill.title}\nDiscussion so far: ${agentResponses.map((r) => `${r.name}: ${r.content}`).join("\n")}\n\nAdd a brief observation or question:`,
        maxOutputTokens: 150,
      });

      agentResponses.push({
        role: "studentB",
        name: "Alex",
        emoji: "🤓",
        content: studentBResult.text.trim(),
      });
    } catch {
      // Non-critical
    }
  }

  return Response.json({ messages: agentResponses });
}
