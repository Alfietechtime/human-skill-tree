"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getSkillProgress, type KnowledgePoint } from "@/lib/learning-tracker";

export function KpLiveMap({
  slug,
  refreshKey,
  onOpenWorkspace,
}: {
  slug: string;
  refreshKey: number;
  onOpenWorkspace?: () => void;
}) {
  const t = useTranslations("teaching");
  const [expanded, setExpanded] = useState(false);
  const progress = getSkillProgress(slug);
  const kps = progress.knowledgePoints;

  if (kps.length === 0) return null;

  const stageColor = (kp: KnowledgePoint) => {
    if (kp.stage >= 5) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (kp.stage >= 3) return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    if (kp.stage >= 1) return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  };

  const stageLabel = (kp: KnowledgePoint) => {
    if (kp.stage >= 5) return "✓";
    if (kp.stage >= 3) return "◆";
    if (kp.stage >= 1) return "○";
    return "•";
  };

  const visibleKps = expanded ? kps : kps.slice(-8);
  const hasMore = kps.length > 8 && !expanded;

  return (
    <div className="px-4 py-1.5 border-b border-border/30 bg-card/40">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">
          {t("kpMap")} · {kps.length}
        </span>
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground/40">
          <span className="flex items-center gap-0.5"><span className="text-amber-400">•</span> {t("kpNew")}</span>
          <span className="flex items-center gap-0.5"><span className="text-purple-400">○</span> {t("kpLearning")}</span>
          <span className="flex items-center gap-0.5"><span className="text-blue-400">◆</span> {t("kpReviewing")}</span>
          <span className="flex items-center gap-0.5"><span className="text-green-400">✓</span> {t("kpMastered")}</span>
          {onOpenWorkspace && (
            <button
              onClick={onOpenWorkspace}
              className="ml-1 text-purple-400 hover:text-purple-300 transition-colors"
              title="View Graph"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1" key={refreshKey}>
        {visibleKps.map((kp) => (
          <span
            key={kp.id}
            className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] transition-all ${stageColor(kp)}`}
            title={`Stage ${kp.stage}/5 · ${kp.taughtBy || "self"}`}
          >
            <span className="text-[8px]">{stageLabel(kp)}</span>
            {kp.content.length > 25 ? kp.content.slice(0, 22) + "…" : kp.content}
          </span>
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded(true)}
            className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground px-1"
          >
            +{kps.length - 8} more
          </button>
        )}
        {expanded && kps.length > 8 && (
          <button
            onClick={() => setExpanded(false)}
            className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground px-1"
          >
            {t("kpCollapse")}
          </button>
        )}
      </div>
    </div>
  );
}
