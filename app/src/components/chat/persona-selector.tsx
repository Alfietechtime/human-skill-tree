"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { PERSONAS, getPersonaByKey } from "@/lib/personas";

export function PersonaSelector({
  skillSlug,
  value,
  onChange,
}: {
  skillSlug: string;
  value: string;
  onChange: (key: string, customPrompt?: string) => void;
}) {
  const t = useTranslations("persona");
  const [open, setOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Load saved persona from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`persona-${skillSlug}`);
    const savedCustom = localStorage.getItem(`persona-custom-${skillSlug}`);
    if (saved) {
      onChange(saved, savedCustom || undefined);
      if (saved === "custom") setCustomText(savedCustom || "");
    }
  }, [skillSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCustomInput(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (key: string) => {
    if (key === "custom") {
      setShowCustomInput(true);
      return;
    }
    localStorage.setItem(`persona-${skillSlug}`, key);
    onChange(key);
    setOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (!customText.trim()) return;
    localStorage.setItem(`persona-${skillSlug}`, "custom");
    localStorage.setItem(`persona-custom-${skillSlug}`, customText);
    onChange("custom", customText);
    setOpen(false);
    setShowCustomInput(false);
  };

  const selected = getPersonaByKey(value);
  const label = value === "custom"
    ? t("custom")
    : selected
      ? `${selected.emoji} ${selected.label}`
      : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        {label || t("selectRole")}
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-xl">
          {showCustomInput ? (
            <div className="p-2 space-y-2">
              <p className="text-xs font-medium text-foreground">{t("customPromptLabel")}</p>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={t("customPlaceholder")}
                className="w-full rounded-lg border border-border bg-secondary p-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="flex-1 rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                >
                  {t("back")}
                </button>
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customText.trim()}
                  className="flex-1 rounded-lg bg-purple-600 px-2 py-1.5 text-xs text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {t("apply")}
                </button>
              </div>
            </div>
          ) : (
            <>
              {PERSONAS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handleSelect(p.key)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-accent ${
                    value === p.key ? "bg-accent text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <span className="text-base">{p.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {p.description}
                    </p>
                  </div>
                </button>
              ))}
              <div className="my-1 h-px bg-border" />
              <button
                onClick={() => handleSelect("custom")}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-accent ${
                  value === "custom" ? "bg-accent text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="text-base">✏️</span>
                <div>
                  <p className="font-medium text-foreground">{t("custom")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("customDesc")}</p>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
