"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getDiaryEntries, exportDiaryMarkdown, type DiaryEntry } from "@/lib/social-content";

export function DiaryPanel({ skillSlug }: { skillSlug: string }) {
  const t = useTranslations("social");
  const [showAll, setShowAll] = useState(false);

  const entries = showAll ? getDiaryEntries() : getDiaryEntries(skillSlug);

  const handleExport = () => {
    const md = exportDiaryMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learning-diary-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          📔
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          {t("diaryEmpty")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter toggle */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50">
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? t("diaryThisSkill") : t("diaryAllSkills")}
        </button>
        <button
          onClick={handleExport}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t("diaryExport")}
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {entries
          .slice()
          .reverse()
          .map((entry, i) => (
            <DiaryCard key={`${entry.timestamp}-${i}`} entry={entry} />
          ))}
      </div>
    </div>
  );
}

function DiaryCard({ entry }: { entry: DiaryEntry }) {
  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-lg border border-border/50 bg-card p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">{entry.mood}</span>
        <span className="text-[10px] font-medium text-foreground">{dateStr}</span>
        <span className="text-[9px] text-muted-foreground">{timeStr}</span>
      </div>
      <p className="text-[11px] text-foreground/90 leading-relaxed whitespace-pre-line">
        {entry.content}
      </p>
      <p className="text-[9px] text-muted-foreground mt-1.5 italic">
        {entry.skillSlug}
      </p>
    </div>
  );
}
