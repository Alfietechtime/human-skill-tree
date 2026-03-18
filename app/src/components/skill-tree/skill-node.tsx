"use client";

import { memo, useState, useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { getSkillBySlug } from "@/lib/skills";
import { PHASES } from "@/lib/constants";
import { SkillProgressBar } from "@/components/skill-progress-bar";
import { getSkillProgress } from "@/lib/learning-tracker";

function SkillNodeComponent({ data }: NodeProps) {
  const router = useRouter();
  const locale = useLocale();
  const slug = data.slug as string;
  const skill = getSkillBySlug(slug, locale);
  const [totalRounds, setTotalRounds] = useState(0);
  const [mastery, setMastery] = useState(0);

  useEffect(() => {
    const progress = getSkillProgress(slug);
    setTotalRounds(progress.totalRounds);
    setMastery(progress.mastery);
  }, [slug]);

  if (!skill) return null;

  const phase = PHASES[skill.phase] || PHASES[0];

  return (
    <div
      className="relative group cursor-pointer rounded-xl border px-4 py-3 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
      style={{
        background: `linear-gradient(135deg, ${phase.bgColor}, rgba(10,10,15,0.8))`,
        borderColor: phase.borderColor,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.05)`,
        minWidth: 180,
        maxWidth: 200,
      }}
      onClick={() => router.push(`/skill/${slug}`)}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = `0 0 24px ${phase.color}30, 0 0 48px ${phase.color}15, inset 0 1px 0 0 rgba(255,255,255,0.1)`;
        el.style.borderColor = phase.color;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = `inset 0 1px 0 0 rgba(255,255,255,0.05)`;
        el.style.borderColor = phase.borderColor;
      }}
    >
      {totalRounds > 0 && (
        mastery > 0 ? (
          <div
            className="absolute -top-2 -right-3 min-w-[22px] rounded-full px-1 py-0.5 flex items-center justify-center text-[7px] font-bold text-white shadow-sm leading-none"
            style={{ backgroundColor: phase.color }}
          >
            {mastery}%
          </div>
        ) : (
          <div
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: phase.color }}
          >
            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )
      )}
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <div className="text-center">
        <div
          className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full text-xs"
          style={{
            background: `${phase.color}20`,
            border: `1px solid ${phase.color}40`,
          }}
        >
          {phase.emoji}
        </div>
        <p
          className="text-sm font-medium leading-tight"
          style={{ color: phase.color }}
        >
          {skill.title}
        </p>
        <SkillProgressBar slug={slug} compact />
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
    </div>
  );
}

export const SkillNode = memo(SkillNodeComponent);
