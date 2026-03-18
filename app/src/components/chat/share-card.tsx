"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { getSkillProgress } from "@/lib/learning-tracker";
import { getStreakData } from "@/lib/learning-tracker";
import { getTutorByKey } from "@/lib/tutors";

export function ShareCard({
  skillSlug,
  skillTitle,
  tutorKey,
  onClose,
}: {
  skillSlug: string;
  skillTitle: string;
  tutorKey?: string;
  onClose: () => void;
}) {
  const t = useTranslations("share");
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const progress = getSkillProgress(skillSlug);
  const streak = getStreakData();
  const tutor = tutorKey ? getTutorByKey(tutorKey) : undefined;
  const kpCount = progress.knowledgePoints.length;
  const mastery = progress.mastery;
  const rounds = progress.totalRounds;

  const handleCopyText = useCallback(() => {
    const text = [
      `${t("title")}`,
      ``,
      `${t("skill")}: ${skillTitle}`,
      `${t("mastery")}: ${mastery}%`,
      `${t("knowledgePoints")}: ${kpCount}`,
      `${t("rounds")}: ${rounds}`,
      streak.currentStreak > 0 ? `${t("streak")}: ${streak.currentStreak} ${t("days")}` : "",
      tutor ? `${t("tutoredBy")}: ${tutor.emoji} ${tutor.name}` : "",
      ``,
      `${t("cta")}`,
      `https://github.com/24kchengYe/human-skill-tree`,
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [t, skillTitle, mastery, kpCount, rounds, streak, tutor]);

  const masteryColor = mastery >= 80 ? "text-green-400" : mastery >= 50 ? "text-blue-400" : mastery > 0 ? "text-purple-400" : "text-muted-foreground";
  const masteryBg = mastery >= 80 ? "from-green-500/20 to-green-600/10" : mastery >= 50 ? "from-blue-500/20 to-blue-600/10" : "from-purple-500/20 to-purple-600/10";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-in zoom-in-95 fade-in duration-200">
        {/* The card */}
        <div
          ref={cardRef}
          className={`rounded-2xl border border-border bg-gradient-to-br ${masteryBg} bg-card p-6 shadow-2xl`}
        >
          {/* Header */}
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">{tutor?.emoji || "\uD83C\uDF33"}</div>
            <h3 className="text-lg font-bold text-foreground">{skillTitle}</h3>
            {tutor && (
              <p className="text-xs text-amber-400 mt-0.5">{t("tutoredBy")} {tutor.name}</p>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center rounded-xl bg-background/40 p-3">
              <div className={`text-2xl font-bold ${masteryColor}`}>{mastery}%</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{t("mastery")}</div>
            </div>
            <div className="text-center rounded-xl bg-background/40 p-3">
              <div className="text-2xl font-bold text-foreground">{kpCount}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{t("kps")}</div>
            </div>
            <div className="text-center rounded-xl bg-background/40 p-3">
              <div className="text-2xl font-bold text-foreground">{rounds}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{t("rounds")}</div>
            </div>
          </div>

          {/* Streak & Level */}
          {(streak.currentStreak > 0 || streak.level > 1) && (
            <div className="flex justify-center gap-4 mb-4 text-sm">
              {streak.currentStreak > 0 && (
                <span className="text-orange-400">{"\uD83D\uDD25"} {streak.currentStreak} {t("days")}</span>
              )}
              {streak.level > 1 && (
                <span className="text-purple-400">Lv.{streak.level} · {streak.totalXP} XP</span>
              )}
            </div>
          )}

          {/* Top knowledge points */}
          {kpCount > 0 && (
            <div className="mb-4">
              <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">{t("learned")}</p>
              <div className="flex flex-wrap gap-1">
                {progress.knowledgePoints.slice(0, 6).map((kp) => (
                  <span key={kp.id} className="rounded-full bg-background/50 px-2 py-0.5 text-[10px] text-foreground border border-border/50">
                    {kp.content.slice(0, 20)}{kp.content.length > 20 ? "..." : ""}
                  </span>
                ))}
                {kpCount > 6 && (
                  <span className="rounded-full bg-background/50 px-2 py-0.5 text-[10px] text-muted-foreground">+{kpCount - 6}</span>
                )}
              </div>
            </div>
          )}

          {/* Branding */}
          <div className="text-center border-t border-border/30 pt-3">
            <p className="text-[10px] text-muted-foreground">{t("cta")}</p>
            <p className="text-[9px] text-muted-foreground/60 mt-0.5">github.com/24kchengYe/human-skill-tree</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleCopyText}
            className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
          >
            {copied ? t("copied") : t("copyText")}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
