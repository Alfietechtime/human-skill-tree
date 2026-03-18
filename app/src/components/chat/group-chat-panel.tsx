"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { getGroupChat, markGroupChatRead, exportGroupChatMarkdown, type GroupChatMessage } from "@/lib/social-content";

// Subtle background tint per tutor for visual differentiation
const TUTOR_COLORS: Record<string, string> = {
  aria: "bg-pink-500/5 border-pink-500/10",
  marcus: "bg-slate-500/5 border-slate-500/10",
  lin: "bg-cyan-500/5 border-cyan-500/10",
  euler: "bg-indigo-500/5 border-indigo-500/10",
  feynman: "bg-orange-500/5 border-orange-500/10",
  curie: "bg-emerald-500/5 border-emerald-500/10",
};

export function GroupChatPanel({ skillSlug }: { skillSlug: string }) {
  const t = useTranslations("social");
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(getGroupChat(skillSlug));
    markGroupChatRead(skillSlug);
  }, [skillSlug]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleExport = () => {
    const md = exportGroupChatMarkdown(skillSlug);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `group-chat-${skillSlug}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          💬
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          {t("groupEmpty")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Export bar */}
      <div className="flex items-center justify-end px-2 py-1.5 border-b border-border/50">
        <button
          onClick={handleExport}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t("diaryExport")}
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1.5">
      {messages.map((msg, i) => {
        const colorClass = TUTOR_COLORS[msg.tutorKey] || "bg-card border-border/50";
        return (
          <div
            key={`${msg.timestamp}-${i}`}
            className={`rounded-lg border p-2.5 ${colorClass}`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{msg.tutorEmoji}</span>
              <span className="text-[11px] font-semibold text-foreground">
                {msg.tutorName}
              </span>
              <span className="text-[9px] text-muted-foreground ml-auto">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-[11px] text-foreground/90 leading-relaxed">
              {msg.content}
            </p>
          </div>
        );
      })}
      </div>
    </div>
  );
}
