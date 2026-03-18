"use client";

import { useTranslations } from "next-intl";
import { getLearningEvents, type LearningEvent } from "@/lib/learning-events";

const EVENT_CONFIG: Record<LearningEvent["type"], { color: string; icon: string }> = {
  kp_learned: { color: "border-green-500 bg-green-500/10", icon: "\uD83E\uDDE0" },
  stuck: { color: "border-orange-500 bg-orange-500/10", icon: "\u26A0\uFE0F" },
  tutor_switch: { color: "border-purple-500 bg-purple-500/10", icon: "\uD83D\uDD04" },
  exercise_completed: { color: "border-blue-500 bg-blue-500/10", icon: "\u2705" },
  milestone: { color: "border-amber-500 bg-amber-500/10", icon: "\u2B50" },
  session_start: { color: "border-gray-500 bg-gray-500/10", icon: "\uD83D\uDE80" },
};

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

export function JourneyPanel({ skillSlug }: { skillSlug: string }) {
  const t = useTranslations("journey");
  const events = getLearningEvents(skillSlug, 50);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-3">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium px-1 mb-2">
        {t("title")} · {events.length}
      </p>
      {events.map((event) => {
        const config = EVENT_CONFIG[event.type];
        return (
          <div
            key={event.id}
            className={`flex items-start gap-2 rounded-lg border-l-2 px-2.5 py-2 ${config.color}`}
          >
            <span className="text-sm shrink-0 mt-0.5">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-foreground leading-relaxed">
                {event.data.description as string || t(`type_${event.type}`)}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-muted-foreground">
                  {formatEventTime(event.timestamp)}
                </span>
                {event.data.tutorKey ? (
                  <span className="text-[9px] text-muted-foreground">
                    · {String(event.data.tutorEmoji || "")} {String(event.data.tutorName || "")}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
