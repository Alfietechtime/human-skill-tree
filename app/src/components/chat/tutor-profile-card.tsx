"use client";

import { type TutorCharacter } from "@/lib/tutors";
import { getTutorAttitudes, getTutorMemory } from "@/lib/tutor-memory";
import { getEventsByTutor } from "@/lib/learning-events";
import { useTranslations, useLocale } from "next-intl";

const EVENT_ICONS: Record<string, string> = {
  kp_learned: "\uD83E\uDDE0",
  stuck: "\u26A0\uFE0F",
  exercise_completed: "\u2705",
  milestone: "\u2B50",
  session_start: "\uD83D\uDE80",
  tutor_switch: "\uD83D\uDD04",
};

/** Get locale-aware field from tutor */
function localized(tutor: TutorCharacter, field: string, locale: string): string {
  const zhKey = `${field}Zh` as keyof TutorCharacter;
  const jaKey = `${field}Ja` as keyof TutorCharacter;
  if (locale === "zh" && tutor[zhKey]) return tutor[zhKey] as string;
  if (locale === "ja" && tutor[jaKey]) return tutor[jaKey] as string;
  return tutor[field as keyof TutorCharacter] as string;
}

function localizedArray(tutor: TutorCharacter, field: string, locale: string): string[] | undefined {
  const zhKey = `${field}Zh` as keyof TutorCharacter;
  const jaKey = `${field}Ja` as keyof TutorCharacter;
  if (locale === "zh" && tutor[zhKey]) return tutor[zhKey] as string[];
  if (locale === "ja" && tutor[jaKey]) return tutor[jaKey] as string[];
  return tutor[field as keyof TutorCharacter] as string[] | undefined;
}

export function TutorProfileCard({
  tutor,
  skillSlug,
  onClose,
}: {
  tutor: TutorCharacter;
  skillSlug: string;
  onClose: () => void;
}) {
  const t = useTranslations("tutor");
  const locale = useLocale();
  const memory = getTutorMemory(tutor.key, skillSlug);
  const attitudes = getTutorAttitudes(tutor.key);
  const latestAttitude = attitudes.length > 0 ? attitudes[attitudes.length - 1] : null;
  const recentEvents = getEventsByTutor(tutor.key, 10);

  const philosophy = localized(tutor, "philosophy", locale);
  const specialties = localizedArray(tutor, "specialties", locale);
  const personality = localized(tutor, "personality", locale);
  const teachingStyleText = localized(tutor, "teachingStyle", locale);

  // Stats
  const topicCount = memory.taughtTopics.length;
  const sessionCount = recentEvents.filter((e) => e.type === "session_start").length || 1;
  const recentAttitudes = attitudes.slice(-3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-96 max-w-[90vw] max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-2xl">
            {tutor.emoji}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{tutor.name}</h3>
            <p className="text-[10px] text-muted-foreground">
              {tutor.nameZh} · {tutor.nameJa}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-accent"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Teaching Philosophy */}
        {philosophy && (
          <div className="mb-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t("philosophy")}
            </h4>
            <p className="text-xs text-foreground/80 italic leading-relaxed">
              &ldquo;{philosophy}&rdquo;
            </p>
          </div>
        )}

        {/* Specialties */}
        {specialties && specialties.length > 0 && (
          <div className="mb-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t("specialties")}
            </h4>
            <div className="flex flex-wrap gap-1">
              {specialties.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Personality */}
        <div className="mb-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {t("personality")}
          </h4>
          <p className="text-xs text-foreground leading-relaxed">
            {personality}
          </p>
        </div>

        {/* Teaching Style */}
        <div className="mb-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {t("style")}
          </h4>
          <p className="text-xs text-foreground leading-relaxed">
            {teachingStyleText}
          </p>
        </div>

        {/* Current Attitude */}
        {latestAttitude && (
          <div className="mb-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t("attitude")}
            </h4>
            <p className="text-xs text-amber-400/80 italic">
              &ldquo;{latestAttitude.description}&rdquo;
            </p>
          </div>
        )}

        {/* Stats Panel */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-purple-500/10 px-2 py-1.5 text-center">
            <p className="text-sm font-bold text-purple-400">{topicCount}</p>
            <p className="text-[9px] text-muted-foreground">{t("statTopics")}</p>
          </div>
          <div className="rounded-lg bg-blue-500/10 px-2 py-1.5 text-center">
            <p className="text-sm font-bold text-blue-400">{sessionCount}</p>
            <p className="text-[9px] text-muted-foreground">{t("statSessions")}</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 px-2 py-1.5 text-center">
            <div className="flex items-center justify-center gap-0.5">
              {recentAttitudes.length > 0 ? (
                recentAttitudes.map((a, i) => (
                  <span key={i} className="text-xs" title={a.description}>
                    {a.description.includes("happy") || a.description.includes("proud") ? "😊" :
                     a.description.includes("concern") || a.description.includes("worry") ? "😟" :
                     a.description.includes("impress") || a.description.includes("excit") ? "🤩" : "🤔"}
                  </span>
                ))
              ) : (
                <span className="text-xs">—</span>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground">{t("statTrend")}</p>
          </div>
        </div>

        {/* Interaction History (Mini Timeline) */}
        {recentEvents.length > 0 && (
          <div className="mb-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t("recentActivity")}
            </h4>
            <div className="space-y-1">
              {recentEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="flex items-center gap-2 text-[10px]">
                  <span>{EVENT_ICONS[event.type] || "📌"}</span>
                  <span className="text-foreground/80 truncate flex-1">
                    {String(event.data.description || event.type)}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Taught Topics */}
        {memory.taughtTopics.length > 0 && (
          <div className="mb-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t("taughtTopics")}
            </h4>
            <div className="flex flex-wrap gap-1">
              {memory.taughtTopics.slice(-8).map((topic, i) => (
                <span
                  key={i}
                  className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stuck Points */}
        {memory.stuckPoints.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t("stuckPoints")}
            </h4>
            <div className="flex flex-wrap gap-1">
              {memory.stuckPoints.slice(-5).map((point, i) => (
                <span
                  key={i}
                  className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400"
                >
                  {point}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
