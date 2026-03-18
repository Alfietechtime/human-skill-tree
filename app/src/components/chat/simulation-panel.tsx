"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

export function SimulationPanel({
  html,
  topic,
  onClose,
}: {
  html: string;
  topic: string;
  onClose: () => void;
}) {
  const t = useTranslations("simulation");
  const [fullscreen, setFullscreen] = useState(false);

  const iframeSrcDoc = html;

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-2">
            <span>🧪</span>
            <span className="text-sm font-medium text-foreground">{topic}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFullscreen(false)} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
              {t("exitFullscreen")}
            </button>
            <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
        <iframe
          srcDoc={iframeSrcDoc}
          sandbox="allow-scripts"
          className="flex-1 w-full border-0"
          title={topic}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-96 shrink-0 flex-col border-l border-border bg-card/50">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span>🧪</span>
          <span className="text-xs font-semibold text-foreground truncate">{topic}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setFullscreen(true)} className="rounded p-1 text-muted-foreground hover:bg-accent" title={t("fullscreen")}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
          </button>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>
      <iframe
        srcDoc={iframeSrcDoc}
        sandbox="allow-scripts"
        className="flex-1 w-full border-0 rounded-b-lg"
        title={topic}
      />
    </div>
  );
}

/** Button to generate a simulation from chat */
export function GenerateSimulationButton({
  skillSlug,
  topic,
  model,
  onGenerated,
}: {
  skillSlug: string;
  topic?: string;
  model: string;
  onGenerated: (html: string, topic: string) => void;
}) {
  const t = useTranslations("simulation");
  const [loading, setLoading] = useState(false);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillSlug, topic, userModel: model }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.html) {
        onGenerated(data.html, data.topic || topic || "Simulation");
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [skillSlug, topic, model, onGenerated]);

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className={`inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${loading ? "animate-pulse" : ""}`}
    >
      <span>🧪</span>
      {loading ? t("generating") : t("generate")}
    </button>
  );
}
