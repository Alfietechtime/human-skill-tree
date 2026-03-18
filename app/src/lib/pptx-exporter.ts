/**
 * PPTX Exporter — converts Slide[] to downloadable PowerPoint files.
 * Uses pptxgenjs library (client-side only).
 */

import type { Slide } from "./slide-generator";

/**
 * Export slides to PPTX and trigger download.
 * Must be called from client-side only.
 */
export async function exportToPPTX(
  slides: Slide[],
  title: string,
  theme: "dark" | "light" = "dark"
): Promise<void> {
  // Dynamic import — pptxgenjs is client-side only
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.author = "Human Skill Tree";
  pptx.title = title;
  pptx.subject = "AI-Generated Course Slides";

  const bgColor = theme === "dark" ? "1a1a2e" : "ffffff";
  const textColor = theme === "dark" ? "eeeeee" : "1a1a2e";
  const accentColor = theme === "dark" ? "a855f7" : "7c3aed";

  for (const slide of slides) {
    const pptSlide = pptx.addSlide();
    pptSlide.background = { color: bgColor };

    if (slide.layout === "title") {
      // Title slide
      pptSlide.addText(slide.title, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 1.5,
        fontSize: 36,
        bold: true,
        color: accentColor,
        align: "center",
      });
      pptSlide.addText(slide.content, {
        x: 1,
        y: 3.5,
        w: 8,
        h: 1.5,
        fontSize: 18,
        color: textColor,
        align: "center",
      });
    } else if (slide.layout === "twoColumn") {
      // Two column layout
      pptSlide.addText(slide.title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: accentColor,
      });

      const parts = slide.content.split("\n\n");
      const leftContent = parts[0] || "";
      const rightContent = parts[1] || "";

      pptSlide.addText(leftContent, {
        x: 0.5,
        y: 1.3,
        w: 4.2,
        h: 3.5,
        fontSize: 14,
        color: textColor,
        valign: "top",
      });
      pptSlide.addText(rightContent, {
        x: 5.3,
        y: 1.3,
        w: 4.2,
        h: 3.5,
        fontSize: 14,
        color: textColor,
        valign: "top",
      });
    } else {
      // Content / Quiz layout
      pptSlide.addText(slide.title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: accentColor,
      });
      pptSlide.addText(slide.content, {
        x: 0.5,
        y: 1.3,
        w: 9,
        h: 3.8,
        fontSize: 16,
        color: textColor,
        valign: "top",
        paraSpaceAfter: 6,
      });
    }

    // Speaker notes
    if (slide.speakerNotes) {
      pptSlide.addNotes(slide.speakerNotes);
    }
  }

  // Generate and download
  const fileName = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_").slice(0, 50)}.pptx`;
  await pptx.writeFile({ fileName });
}
