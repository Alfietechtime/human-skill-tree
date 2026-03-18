"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getAllSkills } from "@/lib/skills";
import { PHASES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export function SkillListView() {
  const t = useTranslations("tree");
  const locale = useLocale();
  const skills = getAllSkills(locale);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      {PHASES.map((phase) => {
        const phaseSkills = skills.filter((s) => s.phase === phase.id);
        if (phaseSkills.length === 0) return null;
        return (
          <div key={phase.id}>
            <h2 className="mb-3 text-lg font-semibold" style={{ color: phase.color }}>
              {phase.emoji} {t(`phase${phase.id}`)}
            </h2>
            <div className="space-y-2">
              {phaseSkills.map((skill) => (
                <Link
                  key={skill.slug}
                  href={`/skill/${skill.slug}`}
                  className="block rounded-lg border border-border/50 bg-card/50 p-3 transition-colors hover:bg-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{skill.title}</span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: phase.borderColor, color: phase.color }}
                    >
                      {t("phase")} {phase.id}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {skill.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
