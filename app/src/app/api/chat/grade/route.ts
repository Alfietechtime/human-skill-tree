/**
 * Quiz Grading API — AI grades short answer responses.
 * Uses the Generation model (cheap/fast) for grading.
 */

import { generateText } from "ai";
import { openai } from "@/lib/openai-client";
import { resolveModel } from "@/lib/model-router";

export async function POST(req: Request) {
  const body = await req.json();
  const { question, expectedAnswer, studentAnswer, plan = "free", userModel }:
    {
      question: string;
      expectedAnswer?: string;
      studentAnswer: string;
      plan?: string;
      userModel?: string;
    } = body;

  if (!question || !studentAnswer) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const model = resolveModel("generation", userModel || "deepseek/deepseek-v3.2", plan);

  try {
    const result = await generateText({
      model: openai.chat(model),
      prompt: `You are a quiz grader. Grade the student's answer.

Question: ${question}
${expectedAnswer ? `Expected Answer: ${expectedAnswer}` : ""}
Student's Answer: ${studentAnswer}

Respond ONLY with valid JSON (no markdown):
{
  "correct": true/false,
  "score": 0-100,
  "feedback": "Brief feedback explaining why the answer is correct/incorrect"
}

Be lenient — accept answers that demonstrate understanding even if wording differs.
Use the same language as the question.`,
      maxOutputTokens: 300,
    });

    const text = result.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ correct: false, score: 0, feedback: "Unable to grade" });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json({
      correct: !!parsed.correct,
      score: parsed.score ?? (parsed.correct ? 100 : 0),
      feedback: parsed.feedback || "",
    });
  } catch (error) {
    console.error("[Grade Error]", error);
    return Response.json({ error: "Grading failed" }, { status: 500 });
  }
}
