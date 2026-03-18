"use client";

import { useState, useEffect, useRef } from "react";
import { getStreakData, xpToNextLevel, XP_REWARDS, type StreakData } from "@/lib/learning-tracker";
import { useTranslations } from "next-intl";

export function StreakBar({ refreshKey }: { refreshKey?: number }) {
  const [data, setData] = useState<StreakData | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("streak");

  useEffect(() => {
    setData(getStreakData());
  }, [refreshKey]);

  // Close panel on outside click
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPanel]);

  if (!data || (data.totalXP === 0 && data.currentStreak === 0)) return null;

  const { current, needed } = xpToNextLevel(data);
  const pct = Math.min((current / needed) * 100, 100);
  const todayXP = data.weeklyXP?.[new Date().toISOString().slice(0, 10)] || 0;
  const streakBonus = Math.min(data.currentStreak * XP_REWARDS.streakBonus, 50);

  return (
    <div className="relative" ref={panelRef}>
      {/* Main bar — clickable */}
      <button
        onClick={() => setShowPanel((v) => !v)}
        className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-1.5 text-xs hover:bg-accent/50 transition-colors cursor-pointer"
      >
        {/* Streak */}
        <div className="flex items-center gap-1">
          <span className={data.currentStreak > 0 ? "text-orange-400" : "text-muted-foreground"}>
            {data.currentStreak > 0 ? "\uD83D\uDD25" : "\u2744\uFE0F"}
          </span>
          <span className={`font-bold tabular-nums ${data.currentStreak > 0 ? "text-orange-400" : "text-muted-foreground"}`}>
            {data.currentStreak}
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* Level + XP */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-purple-400">Lv.{data.level}</span>
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-muted-foreground tabular-nums">{data.totalXP} XP</span>
        </div>
      </button>

      {/* Info panel */}
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-border bg-card shadow-xl p-4 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Level progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-purple-400 text-sm">Lv.{data.level}</span>
              <span className="text-muted-foreground">{current} / {needed} XP</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-1">
              {t("nextLevel", { xp: needed - current })}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-3" />

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">{data.currentStreak}</div>
              <div className="text-muted-foreground">{t("currentStreak")}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">{data.longestStreak}</div>
              <div className="text-muted-foreground">{t("longestStreak")}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">+{todayXP}</div>
              <div className="text-muted-foreground">{t("todayXP")}</div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-3" />

          {/* XP rules */}
          <div>
            <p className="font-semibold text-foreground mb-2">{t("howToEarn")}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("ruleMessage")}</span>
                <span className="font-mono font-bold text-blue-400">+{XP_REWARDS.message}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("ruleKP")}</span>
                <span className="font-mono font-bold text-emerald-400">+{XP_REWARDS.knowledgePoint}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("ruleReview")}</span>
                <span className="font-mono font-bold text-cyan-400">+{XP_REWARDS.review}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("ruleStreak")}</span>
                <span className="font-mono font-bold text-orange-400">+{streakBonus > 0 ? streakBonus : XP_REWARDS.streakBonus}</span>
              </div>
            </div>
            <p className="text-muted-foreground/70 mt-2 text-[10px]">
              {t("streakNote")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
