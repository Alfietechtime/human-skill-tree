"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PRESET_TUTORS } from "@/lib/tutors";

export function CompareTutorPicker({
  onConfirm,
  onCancel,
}: {
  onConfirm: (tutorKeys: string[]) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("compare");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else if (next.size < 3) {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-96 max-w-[90vw] rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <h3 className="text-sm font-bold text-foreground mb-1">{t("pickTitle")}</h3>
        <p className="text-[10px] text-muted-foreground mb-3">{t("pickDesc")}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {PRESET_TUTORS.map((tutor) => (
            <button
              key={tutor.key}
              onClick={() => toggle(tutor.key)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${
                selected.has(tutor.key)
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-border/50 hover:border-purple-500/30"
              }`}
            >
              <span className="text-lg">{tutor.emoji}</span>
              <div>
                <p className="text-xs font-medium text-foreground">{tutor.name}</p>
                <p className="text-[9px] text-muted-foreground truncate">{tutor.nameZh}</p>
              </div>
              {selected.has(tutor.key) && (
                <span className="ml-auto text-purple-400 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {selected.size}/3 {t("selected")}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
            >
              {t("cancel")}
            </button>
            <button
              onClick={() => onConfirm(Array.from(selected))}
              disabled={selected.size < 2}
              className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-40 transition-colors"
            >
              {t("confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
