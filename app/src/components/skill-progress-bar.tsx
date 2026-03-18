"use client";

import { useEffect, useState } from "react";
import { getSkillProgress } from "@/lib/learning-tracker";

export function SkillProgressBar({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const [mastery, setMastery] = useState(0);
  const [kpCount, setKpCount] = useState(0);

  useEffect(() => {
    const progress = getSkillProgress(slug);
    setMastery(progress.mastery);
    setKpCount(progress.knowledgePoints.length);
  }, [slug]);

  if (kpCount === 0 && !compact) return null;

  const color =
    mastery >= 80
      ? "bg-green-500"
      : mastery >= 50
      ? "bg-blue-500"
      : mastery >= 20
      ? "bg-purple-500"
      : "bg-zinc-600";

  if (compact) {
    // Tiny progress indicator for skill tree nodes
    if (kpCount === 0) return null;
    return (
      <div className="mt-1 flex items-center gap-1">
        <div className="h-1 flex-1 rounded-full bg-muted">
          <div
            className={`h-1 rounded-full ${color} transition-all duration-500`}
            style={{ width: `${mastery}%` }}
          />
        </div>
        <span className="text-[8px] text-muted-foreground">{mastery}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {kpCount} knowledge points
        </span>
        <span className="font-medium text-foreground">{mastery}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${mastery}%` }}
        />
      </div>
    </div>
  );
}
