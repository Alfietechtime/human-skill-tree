/**
 * Document Parse API — extracts text from PDF/TXT uploads and generates course outlines.
 * Uses pdf-parse for PDF and Generation model for outline generation.
 */

import { generateText } from "ai";
import { openai } from "@/lib/openai-client";
import { resolveModel } from "@/lib/model-router";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const userModel = formData.get("userModel") as string | null;
  const plan = (formData.get("plan") as string) || "free";

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  // Extract text based on file type
  let textContent: string;
  const fileName = file.name.toLowerCase();

  try {
    if (fileName.endsWith(".pdf")) {
      // PDF parsing
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(buffer);
        textContent = data.text;
      } catch {
        return Response.json({ error: "PDF parsing failed. Make sure pdf-parse is installed." }, { status: 500 });
      }
    } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      textContent = await file.text();
    } else {
      return Response.json({ error: "Unsupported file type. Use PDF, TXT, or MD." }, { status: 400 });
    }
  } catch (error) {
    console.error("[Parse Error]", error);
    return Response.json({ error: "File reading failed" }, { status: 500 });
  }

  if (!textContent || textContent.trim().length < 50) {
    return Response.json({ error: "File content too short or empty" }, { status: 400 });
  }

  // Truncate for context window limits
  const truncated = textContent.slice(0, 8000);

  const model = resolveModel("generation", userModel || "deepseek/deepseek-v3.2", plan);

  try {
    const result = await generateText({
      model: openai.chat(model),
      prompt: `Analyze this document and generate a structured course outline.

Document (first ${truncated.length} chars):
---
${truncated}
---

Respond ONLY with valid JSON (no markdown):
{
  "title": "Course title derived from the document",
  "summary": "2-3 sentence summary of the document",
  "outline": [
    {
      "section": "Section title",
      "keyTopics": ["topic1", "topic2"],
      "estimatedMinutes": 10
    }
  ],
  "suggestedQuizzes": [
    {
      "question": "Quiz question",
      "type": "choice",
      "options": ["A", "B", "C", "D"],
      "answer": 0
    }
  ],
  "suggestedKPs": ["knowledge point 1", "knowledge point 2"]
}

Use the same language as the document content.`,
      maxOutputTokens: 2000,
    });

    const text = result.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "Failed to generate outline" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json({
      fileName: file.name,
      textLength: textContent.length,
      ...parsed,
    });
  } catch (error) {
    console.error("[Parse Outline Error]", error);
    return Response.json({ error: "Course generation failed" }, { status: 500 });
  }
}
