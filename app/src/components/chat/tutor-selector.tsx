"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  PRESET_TUTORS,
  type TutorCharacter,
  getActiveTutorKey,
  setActiveTutorKey,
  getTutorMode,
  setTutorMode,
} from "@/lib/tutors";
import {
  STORY_BACKGROUNDS,
  getStoryConfig,
  setStoryConfig,
} from "@/lib/story-backgrounds";

export function TutorSelector({
  skillSlug,
  value,
  onChange,
}: {
  skillSlug: string;
  value: string;
  onChange: (tutorKey: string) => void;
}) {
  const t = useTranslations("tutor");
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [activeStory, setActiveStory] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEnabled(getTutorMode());
    const saved = getActiveTutorKey(skillSlug);
    if (saved && getTutorMode()) {
      onChange(saved);
    }
    const storyConfig = getStoryConfig();
    setActiveStory(storyConfig.preset || "");
  }, [skillSlug, onChange]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selectedTutor = PRESET_TUTORS.find((t) => t.key === value);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    setTutorMode(next);
    if (!next) {
      onChange("");
      setActiveTutorKey(skillSlug, null);
    } else {
      // Auto-select first tutor if none selected
      const saved = getActiveTutorKey(skillSlug);
      if (saved) {
        onChange(saved);
      }
    }
  };

  const handleSelect = (tutor: TutorCharacter) => {
    onChange(tutor.key);
    setActiveTutorKey(skillSlug, tutor.key);
    if (!enabled) {
      setEnabled(true);
      setTutorMode(true);
    }
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
          enabled && selectedTutor
            ? "border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
            : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        <span>{enabled && selectedTutor ? selectedTutor.emoji : "🎭"}</span>
        <span>
          {enabled && selectedTutor ? selectedTutor.name : t("selectTutor")}
        </span>
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md">
          {/* Toggle switch */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-xs font-medium text-foreground">
              {t("tutorMode")}
            </span>
            <button
              onClick={handleToggle}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                enabled ? "bg-amber-500" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  enabled ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="border-t border-border/50 my-1" />

          {/* Category: Original */}
          <div className="px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("original")}
            </span>
          </div>
          {PRESET_TUTORS.filter((t) => t.category === "original").map(
            (tutor) => (
              <TutorOption
                key={tutor.key}
                tutor={tutor}
                selected={value === tutor.key}
                onClick={() => handleSelect(tutor)}
              />
            )
          )}

          {/* Category: Historical */}
          <div className="px-2 py-1 mt-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("historical")}
            </span>
          </div>
          {PRESET_TUTORS.filter((t) => t.category === "historical").map(
            (tutor) => (
              <TutorOption
                key={tutor.key}
                tutor={tutor}
                selected={value === tutor.key}
                onClick={() => handleSelect(tutor)}
              />
            )
          )}

          {/* Story Background */}
          {enabled && (
            <>
              <div className="border-t border-border/50 my-1.5" />
              <div className="px-2 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("setupStep2Title")}
                </span>
              </div>
              {/* No story option */}
              <button
                onClick={() => { setActiveStory(""); setStoryConfig({ preset: null }); }}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                  !activeStory ? "bg-amber-500/10 text-amber-400" : "text-foreground hover:bg-accent"
                }`}
              >
                <span>🎓</span>
                <span>{t("noStory")}</span>
                {!activeStory && <span className="ml-auto text-[10px] text-amber-400">✓</span>}
              </button>
              {STORY_BACKGROUNDS.map((story) => (
                <button
                  key={story.key}
                  onClick={() => { setActiveStory(story.key); setStoryConfig({ preset: story.key }); }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                    activeStory === story.key ? "bg-amber-500/10 text-amber-400" : "text-foreground hover:bg-accent"
                  }`}
                >
                  <span>{story.emoji}</span>
                  <span>{story.name}</span>
                  {activeStory === story.key && <span className="ml-auto text-[10px] text-amber-400">✓</span>}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TutorOption({
  tutor,
  selected,
  onClick,
}: {
  tutor: TutorCharacter;
  selected: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("tutor");

  // Map tutor keys to description translation keys
  const descMap: Record<string, string> = {
    aria: "ariaDesc",
    marcus: "marcusDesc",
    lin: "linDesc",
    euler: "eulerDesc",
    feynman: "feynmanDesc",
    curie: "curieDesc",
  };
  const descKey = descMap[tutor.key];

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
        selected
          ? "bg-amber-500/10 text-amber-400"
          : "text-foreground hover:bg-accent"
      }`}
    >
      <span className="text-base mt-0.5">{tutor.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium">{tutor.name}</span>
          {selected && (
            <span className="text-[10px] text-amber-400">✓</span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
          {descKey ? t(descKey as never) : tutor.teachingStyle.slice(0, 80)}
        </p>
      </div>
    </button>
  );
}
