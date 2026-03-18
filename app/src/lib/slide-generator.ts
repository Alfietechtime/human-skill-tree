/**
 * Slide Generator — data structures and utilities for real-time slide generation.
 */

export type SlideLayout = "title" | "content" | "twoColumn" | "image" | "quiz";

export interface SlideElement {
  type: "chart" | "formula" | "image" | "code";
  content: string;
}

export interface Slide {
  id: string;
  title: string;
  content: string; // markdown
  speakerNotes: string;
  layout: SlideLayout;
  elements?: SlideElement[];
}

export interface SlideSet {
  id: string;
  skillSlug: string;
  title: string;
  slides: Slide[];
  createdAt: string;
}

const SLIDE_TAG_REGEX = /<!--SLIDE:\s*(\{[\s\S]*?\})-->/g;

/**
 * Extract slide data from AI message text (inline slide generation).
 */
export function parseSlideTags(text: string): Slide[] {
  const slides: Slide[] = [];
  let match;
  const regex = new RegExp(SLIDE_TAG_REGEX.source, "g");

  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.title) {
        slides.push({
          id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: parsed.title,
          content: parsed.content || "",
          speakerNotes: parsed.speakerNotes || "",
          layout: parsed.layout || "content",
          elements: parsed.elements,
        });
      }
    } catch {
      // Invalid JSON
    }
  }

  return slides;
}

/**
 * Strip slide tags from display text.
 */
export function stripSlideTags(text: string): string {
  return text.replace(/<!--SLIDE:[\s\S]*?-->/g, "").trim();
}

/**
 * Check if text has inline slides.
 */
export function hasSlideContent(text: string): boolean {
  return /<!--SLIDE:/.test(text);
}

// localStorage persistence for slide sets
const STORAGE_KEY = "slide-sets";

export function getSlideSets(skillSlug: string): SlideSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: SlideSet[] = raw ? JSON.parse(raw) : [];
    return all.filter((s) => s.skillSlug === skillSlug);
  } catch {
    return [];
  }
}

export function saveSlideSet(slideSet: SlideSet) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: SlideSet[] = raw ? JSON.parse(raw) : [];
    all.unshift(slideSet);
    // Keep max 20 slide sets
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 20)));
  } catch {
    // Storage full
  }
}
