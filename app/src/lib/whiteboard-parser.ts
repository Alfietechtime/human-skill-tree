/**
 * Whiteboard Parser — extracts whiteboard content from AI responses.
 * Supports Mermaid diagrams, LaTeX formulas, and SVG graphics.
 */

export type WhiteboardType = "mermaid" | "latex" | "svg";

export interface WhiteboardItem {
  id: string;
  type: WhiteboardType;
  content: string;
  title?: string;
  timestamp: string;
}

const WHITEBOARD_REGEX = /<!--WHITEBOARD:\s*(\{[\s\S]*?\})-->/g;

/**
 * Extract whiteboard items from an AI message text.
 */
export function parseWhiteboardTags(text: string): WhiteboardItem[] {
  const items: WhiteboardItem[] = [];
  let match;
  const regex = new RegExp(WHITEBOARD_REGEX.source, "g");

  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.type && parsed.content) {
        items.push({
          id: `wb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: parsed.type as WhiteboardType,
          content: parsed.content,
          title: parsed.title,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return items;
}

/**
 * Strip whiteboard tags from display text.
 */
export function stripWhiteboardTags(text: string): string {
  return text.replace(/<!--WHITEBOARD:[\s\S]*?-->/g, "").trim();
}

/**
 * Check if text contains any whiteboard content.
 */
export function hasWhiteboardContent(text: string): boolean {
  return /<!--WHITEBOARD:/.test(text);
}
