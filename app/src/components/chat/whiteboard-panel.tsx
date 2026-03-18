"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { WhiteboardItem } from "@/lib/whiteboard-parser";

export function WhiteboardPanel({
  items,
  onClose,
}: {
  items: WhiteboardItem[];
  onClose: () => void;
}) {
  const t = useTranslations("whiteboard");
  const [currentIndex, setCurrentIndex] = useState(items.length - 1);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentIndex(items.length - 1);
  }, [items.length]);

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎨</span>
          <span className="text-xs font-semibold text-foreground">{t("title")}</span>
          <span className="text-[10px] text-muted-foreground">
            {currentIndex + 1}/{items.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <button
            onClick={() => setScale((s) => Math.min(2, s + 0.25))}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      {items.length > 1 && (
        <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent disabled:opacity-30"
          >
            ← {t("prev")}
          </button>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(items.length - 1, i + 1))}
            disabled={currentIndex === items.length - 1}
            className="rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent disabled:opacity-30"
          >
            {t("next")} →
          </button>
        </div>
      )}

      {/* Content */}
      <div ref={containerRef} className="flex-1 overflow-auto p-3">
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {currentItem.title && (
            <p className="mb-2 text-xs font-medium text-foreground">{currentItem.title}</p>
          )}

          {currentItem.type === "mermaid" && (
            <MermaidRenderer content={currentItem.content} />
          )}

          {currentItem.type === "latex" && (
            <LatexRenderer content={currentItem.content} />
          )}

          {currentItem.type === "svg" && (
            <div
              className="whiteboard-svg"
              dangerouslySetInnerHTML={{ __html: currentItem.content }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Mermaid diagram renderer (lazy-loads mermaid library) */
function MermaidRenderer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#a855f7",
            primaryTextColor: "#eee",
            lineColor: "#666",
          },
        });
        if (cancelled || !containerRef.current) return;
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, content);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [content]);

  if (error) {
    return <pre className="text-[10px] text-red-400 whitespace-pre-wrap">{error}</pre>;
  }

  return <div ref={containerRef} className="mermaid-container" />;
}

/** LaTeX formula renderer (lazy-loads katex) */
function LatexRenderer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const katex = (await import("katex")).default;
        // @ts-expect-error - CSS import for katex styling
        await import("katex/dist/katex.min.css").catch(() => {});
        if (cancelled || !containerRef.current) return;
        katex.render(content, containerRef.current, {
          throwOnError: false,
          displayMode: true,
        });
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [content]);

  if (error) {
    return <pre className="text-[10px] text-red-400 whitespace-pre-wrap">{error}</pre>;
  }

  return <div ref={containerRef} className="katex-container text-foreground" />;
}
