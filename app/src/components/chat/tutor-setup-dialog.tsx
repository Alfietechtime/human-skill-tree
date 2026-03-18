"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PRESET_TUTORS, type TutorCharacter, setActiveTutorKey, setTutorMode } from "@/lib/tutors";
import { STORY_BACKGROUNDS, type StoryBackground, setStoryConfig } from "@/lib/story-backgrounds";

export function TutorSetupDialog({
  skillSlug,
  onComplete,
  onSkip,
}: {
  skillSlug: string;
  onComplete: (tutorKey: string) => void;
  onSkip: () => void;
}) {
  const t = useTranslations("tutor");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTutor, setSelectedTutor] = useState<string>("");
  const [selectedStory, setSelectedStory] = useState<string>("");

  const handleFinish = () => {
    if (!selectedTutor) return;
    setTutorMode(true);
    setActiveTutorKey(skillSlug, selectedTutor);
    if (selectedStory) {
      setStoryConfig({ preset: selectedStory });
    }
    onComplete(selectedTutor);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onSkip} />
      <div className="relative w-[420px] max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-8 bg-amber-500" : s < step ? "w-4 bg-amber-500/50" : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Choose Tutor */}
        {step === 1 && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-1">{t("setupStep1Title")}</h2>
            <p className="text-xs text-muted-foreground mb-4">{t("setupStep1Desc")}</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_TUTORS.map((tutor) => (
                <button
                  key={tutor.key}
                  onClick={() => setSelectedTutor(tutor.key)}
                  className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                    selectedTutor === tutor.key
                      ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <span className="text-xl">{tutor.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{tutor.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                      {tutor.teachingStyle.slice(0, 60)}...
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-5">
              <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground">
                {t("setupSkip")}
              </button>
              <button
                onClick={() => selectedTutor && setStep(2)}
                disabled={!selectedTutor}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {t("setupNext")}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Story Background (optional) */}
        {step === 2 && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-1">{t("setupStep2Title")}</h2>
            <p className="text-xs text-muted-foreground mb-4">{t("setupStep2Desc")}</p>
            <div className="space-y-2">
              {/* No story option */}
              <button
                onClick={() => setSelectedStory("")}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  selectedStory === ""
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span className="text-lg">🎓</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{t("noStory")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("noStoryDesc")}</p>
                </div>
              </button>
              {STORY_BACKGROUNDS.map((story) => (
                <button
                  key={story.key}
                  onClick={() => setSelectedStory(story.key)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    selectedStory === story.key
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <span className="text-lg">{story.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{story.name}</p>
                    <p className="text-[10px] text-muted-foreground">{story.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-5">
              <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-foreground">
                ← {t("setupBack")}
              </button>
              <button
                onClick={() => setStep(3)}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-medium text-white hover:bg-amber-600"
              >
                {t("setupNext")}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (() => {
          const tutor = PRESET_TUTORS.find((t) => t.key === selectedTutor);
          const story = STORY_BACKGROUNDS.find((s) => s.key === selectedStory);
          return (
            <div>
              <h2 className="text-base font-bold text-foreground mb-1">{t("setupStep3Title")}</h2>
              <p className="text-xs text-muted-foreground mb-4">{t("setupStep3Desc")}</p>

              {tutor && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{tutor.emoji}</span>
                    <span className="text-sm font-bold text-foreground">{tutor.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tutor.personality}</p>
                </div>
              )}

              {story && (
                <div className="rounded-xl border border-border bg-card p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span>{story.emoji}</span>
                    <span className="text-xs font-medium text-foreground">{story.name}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-5">
                <button onClick={() => setStep(2)} className="text-xs text-muted-foreground hover:text-foreground">
                  ← {t("setupBack")}
                </button>
                <button
                  onClick={handleFinish}
                  className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-medium text-white hover:bg-amber-600"
                >
                  {t("setupStart")} ✨
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
