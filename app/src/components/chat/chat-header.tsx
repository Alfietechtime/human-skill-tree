"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Skill } from "@/types/skill";
import { PHASES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export function ChatHeader({
  skill,
  children,
  workspaceOpen,
  onToggleWorkspace,
  classroomMode,
  onToggleClassroom,
  onUploadDoc,
  onGenerateSlides,
  onGenerateSimulation,
}: {
  skill: Skill;
  children?: React.ReactNode;
  workspaceOpen?: boolean;
  onToggleWorkspace?: () => void;
  classroomMode?: boolean;
  onToggleClassroom?: () => void;
  onUploadDoc?: () => void;
  onGenerateSlides?: () => void;
  onGenerateSimulation?: () => void;
}) {
  const t = useTranslations("nav");
  const tTree = useTranslations("tree");
  const phase = PHASES[skill.phase] || PHASES[0];

  return (
    <div className="relative z-20 border-b border-border bg-card/80 backdrop-blur-sm">
      {/* Row 1: Navigation + title */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5">
        <div className="flex items-center gap-3">
          <Link
            href={`/skill/${skill.slug}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr;
          </Link>
          <span className="text-lg">{phase.emoji}</span>
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              {skill.title}
            </h1>
            <Badge
              variant="outline"
              className="mt-0.5 text-[10px] py-0"
              style={{ borderColor: phase.borderColor, color: phase.color }}
            >
              {tTree(`phase${skill.phase}`)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onToggleClassroom && (
            <button
              onClick={onToggleClassroom}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                classroomMode
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              title="Classroom Mode"
            >
              👥
            </button>
          )}
          {onUploadDoc && (
            <button
              onClick={onUploadDoc}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Upload Document"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </button>
          )}
          {onGenerateSlides && (
            <button
              onClick={onGenerateSlides}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Generate Slides"
            >
              📊
            </button>
          )}
          {onGenerateSimulation && (
            <button
              onClick={onGenerateSimulation}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Interactive Simulation"
            >
              🧪
            </button>
          )}
          {onToggleWorkspace && (
            <button
              onClick={onToggleWorkspace}
              className={`rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${
                workspaceOpen ? "bg-accent text-foreground" : ""
              }`}
              title="Workspace"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
          )}
          <Link
            href="/tree"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("switchSkill")}
          </Link>
        </div>
      </div>

      {/* Row 2: Selectors toolbar */}
      {children && (
        <div className="flex items-center gap-2 px-4 pb-2.5">
          {children}
        </div>
      )}
    </div>
  );
}
