"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { PHASES } from "@/lib/constants";
import { Skill } from "@/types/skill";
import { SkillProgressBar } from "@/components/skill-progress-bar";

export function SkillHeader({ skill }: { skill: Skill }) {
  const t = useTranslations("tree");
  const phase = PHASES[skill.phase] || PHASES[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
          style={{
            background: `${phase.color}15`,
            border: `1px solid ${phase.color}30`,
          }}
        >
          {phase.emoji}
        </span>
        <Badge
          variant="outline"
          className="text-xs"
          style={{ borderColor: phase.borderColor, color: phase.color }}
        >
          {t(`phase${skill.phase}`)}
        </Badge>
      </div>
      <h1 className="text-3xl font-bold text-foreground">{skill.title}</h1>
      <p className="text-muted-foreground leading-relaxed">{skill.description}</p>
      <SkillProgressBar slug={skill.slug} />
    </div>
  );
}
