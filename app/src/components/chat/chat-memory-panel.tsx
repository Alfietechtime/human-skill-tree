"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  getSkillMemory,
  addMemoryEntry,
  deleteMemoryEntry,
  getSessions,
  deleteSession,
  type SkillMemory,
  type ChatSession,
} from "@/lib/chat-memory";

export function ChatMemoryPanel({
  slug,
  refreshKey,
  onLoadSession,
  onNewChat,
  activeSessionId,
}: {
  slug: string;
  refreshKey: number;
  onLoadSession?: (session: ChatSession) => void;
  onNewChat?: () => void;
  activeSessionId?: string | null;
}) {
  const t = useTranslations("memory");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"history" | "notes">("history");
  const [memory, setMemory] = useState<SkillMemory | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    setMemory(getSkillMemory(slug));
    setSessions(getSessions(slug));
  }, [slug, refreshKey]);

  const entryCount = memory?.entries.length || 0;
  const sessionCount = sessions.length;
  const totalCount = entryCount + sessionCount;

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const updated = addMemoryEntry(slug, noteText.trim(), "user");
    setMemory(updated);
    setNoteText("");
    setAddingNote(false);
  };

  const handleDeleteNote = (index: number) => {
    deleteMemoryEntry(slug, index);
    setMemory(getSkillMemory(slug));
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(slug, sessionId);
    setSessions(getSessions(slug));
  };

  const handleLoadSession = (session: ChatSession) => {
    onLoadSession?.(session);
    setOpen(false);
  };

  const handleNewChat = () => {
    onNewChat?.();
    setOpen(false);
  };

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t("justNow");
    if (diffMin < 60) return `${diffMin}${t("minutesAgo")}`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}${t("hoursAgo")}`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}${t("daysAgo")}`;
    return d.toLocaleDateString();
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title={t("title")}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        {totalCount > 0 && (
          <span className="rounded-full bg-purple-500/20 px-1.5 text-[10px] text-purple-400">
            {totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-0 top-16 z-40 flex h-[calc(100vh-64px)] w-80 flex-col border-l border-border bg-background shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("history")}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                tab === "history"
                  ? "border-b-2 border-purple-500 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("history")} {sessionCount > 0 && `(${sessionCount})`}
            </button>
            <button
              onClick={() => setTab("notes")}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                tab === "notes"
                  ? "border-b-2 border-purple-500 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("notes")} {entryCount > 0 && `(${entryCount})`}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {tab === "history" ? (
              <div className="p-3 space-y-1">
                {/* New chat button */}
                <button
                  onClick={handleNewChat}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {t("newChat")}
                </button>

                {sessionCount === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-muted-foreground">{t("noHistory")}</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group flex items-start gap-2 rounded-lg px-3 py-2.5 transition-colors cursor-pointer hover:bg-accent ${
                        activeSessionId === session.id ? "bg-accent/60" : ""
                      }`}
                      onClick={() => handleLoadSession(session)}
                    >
                      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {session.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {session.messages.length} {t("messages")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(session.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-3">
                {/* Add note button */}
                {!addingNote && (
                  <button
                    onClick={() => setAddingNote(true)}
                    className="mb-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t("addNote")}
                  </button>
                )}

                {addingNote && (
                  <div className="mb-3 rounded-lg border border-border p-2.5">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder={t("notePlaceholder")}
                      className="w-full rounded-md border border-border bg-secondary p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                      rows={3}
                      autoFocus
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => { setAddingNote(false); setNoteText(""); }}
                        className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        onClick={handleAddNote}
                        disabled={!noteText.trim()}
                        className="rounded-md bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        {t("save")}
                      </button>
                    </div>
                  </div>
                )}

                {entryCount === 0 && !addingNote ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-muted-foreground">{t("empty")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {memory!.entries.map((entry, i) => (
                      <div
                        key={`${entry.timestamp}-${i}`}
                        className="group rounded-lg border border-border/50 bg-card p-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-foreground leading-relaxed">
                            {entry.content}
                          </p>
                          <button
                            onClick={() => handleDeleteNote(i)}
                            className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                          >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded px-1 py-0.5 text-[10px] ${
                            entry.source === "user"
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-purple-500/15 text-purple-400"
                          }`}>
                            {entry.source === "user" ? t("manual") : t("auto")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
