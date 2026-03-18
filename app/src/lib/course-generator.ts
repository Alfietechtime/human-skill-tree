/**
 * Course Generator — transforms document outlines into learning materials.
 */

import type { Slide } from "./slide-generator";
import type { ExerciseData } from "@/components/chat/exercise-card";

export interface CourseOutline {
  title: string;
  summary: string;
  outline: CourseSection[];
  suggestedQuizzes: ExerciseData[];
  suggestedKPs: string[];
}

export interface CourseSection {
  section: string;
  keyTopics: string[];
  estimatedMinutes: number;
}

/**
 * Convert a course outline into a set of slides.
 */
export function outlineToSlides(outline: CourseOutline): Slide[] {
  const slides: Slide[] = [];

  // Title slide
  slides.push({
    id: `slide-title-${Date.now()}`,
    title: outline.title,
    content: outline.summary,
    speakerNotes: "Course overview",
    layout: "title",
  });

  // Section slides
  for (const section of outline.outline) {
    slides.push({
      id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: section.section,
      content: section.keyTopics.map((t) => `- ${t}`).join("\n"),
      speakerNotes: `Estimated time: ${section.estimatedMinutes} minutes`,
      layout: "content",
    });
  }

  // Quiz slide if available
  if (outline.suggestedQuizzes.length > 0) {
    const quiz = outline.suggestedQuizzes[0];
    slides.push({
      id: `slide-quiz-${Date.now()}`,
      title: "Quick Check",
      content: `**${quiz.question}**\n\n${quiz.options?.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n") || ""}`,
      speakerNotes: `Answer: ${quiz.answer}`,
      layout: "quiz",
    });
  }

  // Summary slide
  slides.push({
    id: `slide-summary-${Date.now()}`,
    title: "Key Takeaways",
    content: outline.suggestedKPs.map((kp) => `- ${kp}`).join("\n"),
    speakerNotes: "Review and consolidate",
    layout: "content",
  });

  return slides;
}
