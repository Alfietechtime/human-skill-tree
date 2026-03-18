"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentAvatarBar } from "./agent-avatar-bar";

interface ClassroomMessage {
  role: string;
  name: string;
  emoji: string;
  content: string;
}

const ROLE_COLORS: Record<string, string> = {
  teacher: "border-amber-500/30 bg-amber-500/5",
  assistant: "border-blue-500/30 bg-blue-500/5",
  studentA: "border-green-500/30 bg-green-500/5",
  studentB: "border-orange-500/30 bg-orange-500/5",
  user: "border-purple-500/30 bg-purple-600/10",
};

const ROLE_NAME_COLORS: Record<string, string> = {
  teacher: "text-amber-400",
  assistant: "text-blue-400",
  studentA: "text-green-400",
  studentB: "text-orange-400",
  user: "text-purple-400",
};

export function ClassroomMode({
  skillSlug,
  teacherName,
  teacherEmoji,
  teacherTutorKey,
  assistantName,
  assistantEmoji,
  assistantTutorKey,
  model,
  onExit,
}: {
  skillSlug: string;
  teacherName: string;
  teacherEmoji: string;
  teacherTutorKey: string;
  assistantName?: string;
  assistantEmoji?: string;
  assistantTutorKey?: string;
  model: string;
  onExit: () => void;
}) {
  const t = useTranslations("classroom");
  const [messages, setMessages] = useState<ClassroomMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const agents = [
    { role: "teacher", name: teacherName, emoji: teacherEmoji, status: "idle" as const },
    ...(assistantName ? [{ role: "assistant", name: assistantName, emoji: assistantEmoji || "🧑‍🏫", status: "idle" as const }] : []),
    { role: "studentA", name: "Mia", emoji: "🙋", status: "idle" as const },
    { role: "studentB", name: "Alex", emoji: "🤓", status: "idle" as const },
  ];

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: ClassroomMessage = { role: "user", name: t("you"), emoji: "🙋‍♂️", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillSlug,
          userMessage: input.trim(),
          history: messages.slice(-10),
          teacherTutorKey,
          assistantTutorKey,
          userModel: model,
        }),
      });

      if (!res.ok) throw new Error("Classroom API failed");
      const data = await res.json();

      if (data.messages?.length) {
        // Add messages one by one with a small delay for effect
        for (let i = 0; i < data.messages.length; i++) {
          await new Promise((r) => setTimeout(r, 300));
          setMessages((prev) => [...prev, data.messages[i]]);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [input, loading, messages, skillSlug, teacherTutorKey, assistantTutorKey, model, t]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Agent avatar bar */}
      <AgentAvatarBar agents={agents.map((a) => ({ ...a, status: loading && a.role !== "user" ? "thinking" : "idle" }))} />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg mb-1">{teacherEmoji}</p>
              <p className="text-sm text-muted-foreground">{t("emptyState")}</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`rounded-2xl border px-4 py-3 ${ROLE_COLORS[msg.role] || "border-border/50 bg-card"}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">{msg.emoji}</span>
                <span className={`text-xs font-medium ${ROLE_NAME_COLORS[msg.role] || "text-foreground"}`}>
                  {msg.name}
                </span>
              </div>
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs py-2">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.3s]" />
              </span>
              {t("thinking")}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="mx-auto max-w-2xl flex items-center gap-2">
          <button onClick={onExit} className="shrink-0 rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-accent" title={t("exitClassroom")}>
            ← {t("exit")}
          </button>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex flex-1 items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              className="flex-1 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="shrink-0 rounded-xl bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-40"
            >
              {t("send")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
