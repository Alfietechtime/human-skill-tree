"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Slide } from "@/lib/slide-generator";

export function ExportButton({
  slides,
  title,
}: {
  slides: Slide[];
  title: string;
}) {
  const t = useTranslations("slides");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { exportToPPTX } = await import("@/lib/pptx-exporter");
      await exportToPPTX(slides, title, "dark");
    } catch (e) {
      console.error("[PPTX Export Error]", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || slides.length === 0}
      className={`inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${exporting ? "animate-pulse" : ""}`}
    >
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {exporting ? t("exporting") : t("exportPPTX")}
    </button>
  );
}
