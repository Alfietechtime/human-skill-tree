"use client";

import { useTranslations } from "next-intl";

export type TeachingStage =
  | "questioning"
  | "exploring"
  | "hinting"
  | "understanding"
  | "summarizing";

const STAGES: { key: TeachingStage; emoji: string }[] = [
  { key: "questioning", emoji: "🎯" },
  { key: "exploring", emoji: "🔍" },
  { key: "hinting", emoji: "💡" },
  { key: "understanding", emoji: "✨" },
  { key: "summarizing", emoji: "📝" },
];

export function TeachingProgress({
  stage,
  mood,
  tutorEmoji,
}: {
  stage: TeachingStage | null;
  mood: string | null;
  tutorEmoji?: string;
}) {
  const t = useTranslations("teaching");
  if (!stage) return null;

  const currentIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/30 bg-card/40">
      {/* Tutor mood */}
      {mood && tutorEmoji && (
        <div className="flex items-center gap-1 text-sm mr-2 shrink-0" title={t("mood")}>
          <span className="text-base">{tutorEmoji}</span>
          <span className="text-base">{mood}</span>
        </div>
      )}

      {/* Stage progress */}
      <div className="flex items-center gap-0.5 flex-1 min-w-0">
        {STAGES.map((s, i) => {
          const isActive = i === currentIndex;
          const isPast = i < currentIndex;
          return (
            <div key={s.key} className="flex items-center gap-0.5">
              {i > 0 && (
                <div
                  className={`h-px w-3 sm:w-5 transition-colors ${
                    isPast ? "bg-purple-400" : "bg-border"
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-purple-500/20 text-purple-400 font-medium ring-1 ring-purple-500/30"
                    : isPast
                      ? "text-purple-400/60"
                      : "text-muted-foreground/40"
                }`}
                title={t(s.key)}
              >
                <span>{s.emoji}</span>
                <span className="hidden sm:inline">{t(s.key)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
