"use client";

import { useState } from "react";

export function CnTipBanner() {
  const [dismissed, setDismissed] = useState(false);

  // Cookie "geo-cn=1" is set by middleware when IP is from China
  const isCN = typeof document !== "undefined" && document.cookie.includes("geo-cn=1");

  if (!isCN || dismissed) return null;

  return (
    <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-4 py-2.5 text-sm text-muted-foreground border-b border-border/50">
      <svg className="h-4 w-4 shrink-0 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      <span>
        为获得最佳 AI 对话体验，建议配合
        <strong className="text-foreground">网络加速工具</strong>
        使用。
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
        aria-label="关闭提示"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
