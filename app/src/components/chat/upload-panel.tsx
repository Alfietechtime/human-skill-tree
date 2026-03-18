"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

interface CourseOutlineSection {
  section: string;
  keyTopics: string[];
  estimatedMinutes: number;
}

interface ParseResult {
  fileName: string;
  title: string;
  summary: string;
  outline: CourseOutlineSection[];
  suggestedKPs: string[];
}

export function UploadPanel({
  model,
  onCourseGenerated,
  onClose,
}: {
  model: string;
  onCourseGenerated: (result: ParseResult) => void;
  onClose: () => void;
}) {
  const t = useTranslations("upload");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userModel", model);

    try {
      setProgress(30);
      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      setProgress(70);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Parse failed");
      }

      const data = await res.json();
      setProgress(100);
      setResult(data);
      onCourseGenerated(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }, [model, onCourseGenerated]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {!result ? (
          <>
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                dragging ? "border-purple-500 bg-purple-500/10" : "border-border hover:border-purple-500/50"
              }`}
            >
              <svg className="h-8 w-8 text-muted-foreground mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm text-foreground mb-1">{t("dropHere")}</p>
              <p className="text-xs text-muted-foreground">{t("supportedFormats")}</p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {/* Progress */}
            {loading && (
              <div className="mt-4">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-2 rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">{t("parsing")}</p>
              </div>
            )}

            {error && (
              <p className="mt-3 text-xs text-red-400 text-center">{error}</p>
            )}
          </>
        ) : (
          /* Result preview */
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-foreground">{result.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("outline")}</p>
              {result.outline.map((section, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <span className="text-[10px] text-muted-foreground mt-0.5">{i + 1}.</span>
                  <div>
                    <p className="text-xs text-foreground">{section.section}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {section.keyTopics.join(" · ")} · ~{section.estimatedMinutes}min
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {result.suggestedKPs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("keyPoints")}</p>
                <div className="flex flex-wrap gap-1">
                  {result.suggestedKPs.map((kp, i) => (
                    <span key={i} className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] text-purple-400">
                      {kp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2 text-xs text-muted-foreground hover:bg-accent">
                {t("close")}
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-purple-600 py-2 text-xs text-white hover:bg-purple-700"
              >
                {t("generateSlides")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
