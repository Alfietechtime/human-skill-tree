"use client";

import { useTranslations } from "next-intl";
import { PHASES } from "@/lib/constants";

export function PhaseLegend() {
  const t = useTranslations("tree");

  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-border/50 bg-card/80 p-3 backdrop-blur-md">
      <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {t("phases")}
      </p>
      <div className="space-y-1.5">
        {PHASES.map((phase) => (
          <div key={phase.id} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: phase.color }}
            />
            <span className="text-xs text-foreground/80">
              {phase.emoji} {t(`phase${phase.id}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
