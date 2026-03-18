"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TutorResponse {
  tutorKey: string;
  tutorName: string;
  tutorEmoji: string;
  content: string;
}

const TUTOR_COLORS: Record<string, string> = {
  aria: "border-pink-500/30 bg-pink-500/5",
  marcus: "border-blue-500/30 bg-blue-500/5",
  lin: "border-cyan-500/30 bg-cyan-500/5",
  euler: "border-amber-500/30 bg-amber-500/5",
  feynman: "border-orange-500/30 bg-orange-500/5",
  curie: "border-green-500/30 bg-green-500/5",
};

export function ComparisonCard({
  responses,
  onClose,
}: {
  responses: TutorResponse[];
  onClose?: () => void;
}) {
  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[95%] w-full">
        {/* Close bar */}
        {onClose && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400/70">
              Tutor Comparison
            </span>
            <button
              onClick={onClose}
              className="rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-2">
          {responses.map((resp) => (
            <div
              key={resp.tutorKey}
              className={`flex-1 rounded-2xl border px-4 py-3 min-w-0 ${
                TUTOR_COLORS[resp.tutorKey] || "border-border/50 bg-card"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-amber-400/80">
                <span>{resp.tutorEmoji}</span>
                <span>{resp.tutorName}</span>
              </div>
              <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0 prose-headings:my-2 prose-code:text-purple-500 dark:prose-code:text-purple-400">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {resp.content || "..."}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
