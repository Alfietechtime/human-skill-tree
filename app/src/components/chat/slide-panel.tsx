"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Slide } from "@/lib/slide-generator";

export function SlidePanel({
  slides,
  title,
  onClose,
  onExport,
}: {
  slides: Slide[];
  title: string;
  onClose: () => void;
  onExport?: () => void;
}) {
  const t = useTranslations("slides");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (slides.length === 0) return null;

  const slide = slides[currentIndex];

  const SlideContent = () => (
    <div className={`flex flex-col ${slide.layout === "title" ? "items-center justify-center text-center" : ""} h-full p-6`}>
      <h2 className={`font-bold text-purple-400 mb-4 ${slide.layout === "title" ? "text-2xl" : "text-lg"}`}>
        {slide.title}
      </h2>

      {slide.layout === "twoColumn" ? (
        <div className="grid grid-cols-2 gap-4 flex-1">
          {slide.content.split("\n\n").map((col, i) => (
            <div key={i} className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{col}</ReactMarkdown>
            </div>
          ))}
        </div>
      ) : (
        <div className="prose dark:prose-invert prose-sm max-w-none flex-1">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide.content}</ReactMarkdown>
        </div>
      )}
    </div>
  );

  // Fullscreen mode
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{currentIndex + 1} / {slides.length}</span>
            <button onClick={() => setFullscreen(false)} className="rounded p-1 text-muted-foreground hover:bg-accent">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-4xl aspect-[16/9] rounded-2xl border border-border bg-card overflow-hidden">
            <SlideContent />
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 border-t border-border py-3">
          <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-accent disabled:opacity-30">← {t("prev")}</button>
          <button onClick={() => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))} disabled={currentIndex === slides.length - 1} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-accent disabled:opacity-30">{t("next")} →</button>
        </div>
      </div>
    );
  }

  // Panel mode
  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <span className="text-xs font-semibold text-foreground truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {onExport && (
            <button onClick={onExport} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground" title={t("export")}>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            </button>
          )}
          <button onClick={() => setFullscreen(true)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground" title={t("fullscreen")}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
          </button>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>

      {/* Slide preview */}
      <div className="flex-1 overflow-auto p-3">
        <div className="rounded-xl border border-border bg-card aspect-[16/9] overflow-hidden mb-3">
          <SlideContent />
        </div>

        {/* Speaker notes */}
        {slide.speakerNotes && (
          <div className="rounded-lg border border-border/50 bg-secondary/50 p-2 mb-3">
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{t("speakerNotes")}</p>
            <p className="text-[11px] text-foreground">{slide.speakerNotes}</p>
          </div>
        )}

        {/* Slide thumbnails */}
        <div className="grid grid-cols-3 gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-lg border p-1.5 text-left text-[8px] transition-all ${
                i === currentIndex
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-border/50 hover:border-purple-500/30"
              }`}
            >
              <p className="font-medium text-foreground truncate">{s.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent disabled:opacity-30"
        >
          ← {t("prev")}
        </button>
        <span className="text-[10px] text-muted-foreground">{currentIndex + 1} / {slides.length}</span>
        <button
          onClick={() => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))}
          disabled={currentIndex === slides.length - 1}
          className="rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent disabled:opacity-30"
        >
          {t("next")} →
        </button>
      </div>
    </div>
  );
}
