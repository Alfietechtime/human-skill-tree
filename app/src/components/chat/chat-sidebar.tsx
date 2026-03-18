"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  getSkillMemory,
  addMemoryEntry,
  deleteMemoryEntry,
  getSessions,
  deleteSession,
  downloadSessionMarkdown,
  downloadAllSessionsMarkdown,
  downloadNotesMarkdown,
  type SkillMemory,
  type ChatSession,
} from "@/lib/chat-memory";
import { getSkillProgress } from "@/lib/learning-tracker";
import { getAllSkills } from "@/lib/skills";
import { downloadBackup, importBackup } from "@/lib/data-backup";
import { getGroupChatUnreadCount } from "@/lib/social-content";
import { GroupChatPanel } from "./group-chat-panel";
import { DiaryPanel } from "./diary-panel";
import { JourneyPanel } from "./journey-panel";

export function ChatSidebar({
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
  const tSocial = useTranslations("social");
  const tJourney = useTranslations("journey");
  const locale = useLocale();
  const [tab, setTab] = useState<"history" | "notes" | "group" | "diary" | "journey">("history");
  const [memory, setMemory] = useState<SkillMemory | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [mastery, setMastery] = useState(0);
  const [kpCount, setKpCount] = useState(0);
  const [groupUnread, setGroupUnread] = useState(0);

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile drawer when loading a session
  const handleLoadSessionMobile = useCallback(
    (session: ChatSession) => {
      onLoadSession?.(session);
      if (isMobile) setMobileOpen(false);
    },
    [onLoadSession, isMobile]
  );

  const handleNewChatMobile = useCallback(() => {
    onNewChat?.();
    if (isMobile) setMobileOpen(false);
  }, [onNewChat, isMobile]);

  useEffect(() => {
    setMemory(getSkillMemory(slug));
    setSessions(getSessions(slug));
    const progress = getSkillProgress(slug);
    setMastery(progress.mastery);
    setKpCount(progress.knowledgePoints.length);
    setGroupUnread(getGroupChatUnreadCount(slug));
  }, [slug, refreshKey]);

  // Get skill title for session labels
  const skills = getAllSkills(locale);
  const skillTitle = skills.find((s) => s.slug === slug)?.title || slug;

  const entryCount = memory?.entries.length || 0;
  const sessionCount = sessions.length;

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

  // Mobile: floating toggle button + full-screen overlay
  if (isMobile) {
    return (
      <>
        {/* Floating toggle button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-20 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition-colors"
          title={t("title")}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {sessionCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">
              {sessionCount}
            </span>
          )}
        </button>

        {/* Full-screen overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="relative flex h-full w-80 max-w-[85vw] flex-col bg-card border-r border-border shadow-xl animate-in slide-in-from-left duration-200">
              {/* Close button */}
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <h3 className="text-xs font-semibold text-foreground truncate flex-1">{skillTitle}</h3>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              {/* Progress bar */}
              <div className="border-b border-border px-3 py-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{kpCount} {t("knowledgePoints")}</span>
                  <span className="font-medium text-foreground">{mastery}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${mastery >= 80 ? "bg-green-500" : mastery >= 50 ? "bg-blue-500" : mastery > 0 ? "bg-purple-500" : "bg-muted-foreground/30"}`} style={{ width: `${Math.max(mastery, 2)}%` }} />
                </div>
              </div>
              {/* Tabs */}
              <div className="flex border-b border-border">
                <button onClick={() => setTab("history")} className={`flex-1 px-2 py-2 text-[10px] font-medium transition-colors ${tab === "history" ? "border-b-2 border-purple-500 text-foreground" : "text-muted-foreground"}`}>
                  {t("history")}
                </button>
                <button onClick={() => setTab("notes")} className={`flex-1 px-2 py-2 text-[10px] font-medium transition-colors ${tab === "notes" ? "border-b-2 border-purple-500 text-foreground" : "text-muted-foreground"}`}>
                  {t("notes")}
                </button>
                <button onClick={() => { setTab("group"); setGroupUnread(0); }} className={`relative flex-1 px-2 py-2 text-[10px] font-medium transition-colors ${tab === "group" ? "border-b-2 border-amber-500 text-foreground" : "text-muted-foreground"}`}>
                  {tSocial("groupTab")}
                  {groupUnread > 0 && tab !== "group" && (
                    <span className="absolute top-1 right-0.5 flex h-3 min-w-[12px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[7px] text-white">{groupUnread}</span>
                  )}
                </button>
                <button onClick={() => setTab("diary")} className={`flex-1 px-2 py-2 text-[10px] font-medium transition-colors ${tab === "diary" ? "border-b-2 border-amber-500 text-foreground" : "text-muted-foreground"}`}>
                  {tSocial("diaryTab")}
                </button>
                <button onClick={() => setTab("journey")} className={`flex-1 px-2 py-2 text-[10px] font-medium transition-colors ${tab === "journey" ? "border-b-2 border-emerald-500 text-foreground" : "text-muted-foreground"}`}>
                  {tJourney("title")}
                </button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {tab === "journey" ? (
                  <JourneyPanel skillSlug={slug} />
                ) : tab === "group" ? (
                  <GroupChatPanel skillSlug={slug} />
                ) : tab === "diary" ? (
                  <DiaryPanel skillSlug={slug} />
                ) : tab === "history" ? (
                  <div className="p-2 space-y-0.5">
                    <div className="flex gap-1">
                      <button onClick={() => handleNewChatMobile()} className="flex flex-1 items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        {t("newChat")}
                      </button>
                      {sessionCount > 0 && (
                        <button
                          onClick={() => downloadAllSessionsMarkdown(slug)}
                          className="shrink-0 rounded-lg border border-dashed border-border px-2 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title={t("exportAllSessions")}
                        >
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {sessionCount === 0 ? (
                      <div className="py-6 text-center"><p className="text-[11px] text-muted-foreground">{t("noHistory")}</p></div>
                    ) : sessions.map((session) => (
                      <div key={session.id} className={`group flex items-start gap-2 rounded-lg px-2.5 py-2 cursor-pointer hover:bg-accent ${activeSessionId === session.id ? "bg-accent/60" : ""}`} onClick={() => handleLoadSessionMobile(session)}>
                        <svg className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-foreground truncate">{session.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{session.messages.length} {t("messages")} · {formatTime(session.updatedAt)}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadSessionMarkdown(session); }}
                          className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-blue-400"
                          title={t("exportSession")}
                        >
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2">
                    <button onClick={() => setAddingNote(true)} className="mb-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      {t("addNote")}
                    </button>
                    {entryCount === 0 ? (
                      <div className="py-6 text-center"><p className="text-[11px] text-muted-foreground">{t("empty")}</p></div>
                    ) : (
                      <div className="space-y-1.5">
                        {memory!.entries.map((entry, i) => (
                          <div key={`${entry.timestamp}-${i}`} className="rounded-lg border border-border/50 bg-card p-2">
                            <p className="text-[11px] text-foreground leading-relaxed">{entry.content}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className={`rounded px-1 py-0.5 text-[9px] ${entry.source === "user" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"}`}>
                                {entry.source === "user" ? t("manual") : t("auto")}
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
          </div>
        )}
      </>
    );
  }

  // Desktop collapsed state — just show a thin strip with toggle
  if (collapsed) {
    return (
      <div className="flex h-full w-10 shrink-0 flex-col items-center border-r border-border bg-card/50 py-3">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={t("title")}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        {sessionCount > 0 && (
          <span className="mt-2 rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[9px] text-purple-400">
            {sessionCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-card/30 overflow-hidden">
      {/* Header with skill name & progress */}
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-foreground truncate flex-1">
            {skillTitle}
          </h3>
          <button
            onClick={() => setCollapsed(true)}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">{kpCount} {t("knowledgePoints")}</span>
            <span className="font-medium text-foreground">{mastery}%</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                mastery >= 80 ? "bg-green-500" : mastery >= 50 ? "bg-blue-500" : mastery > 0 ? "bg-purple-500" : "bg-muted-foreground/30"
              }`}
              style={{ width: `${Math.max(mastery, 2)}%` }}
            />
          </div>
          {kpCount === 0 && (
            <p className="mt-1 text-[9px] text-muted-foreground/60">
              {t("progressHint")}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("history")}
          className={`flex-1 px-2 py-2 text-[10px] font-medium transition-colors ${
            tab === "history"
              ? "border-b-2 border-purple-500 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("history")}
        </button>
        <button
          onClick={() => setTab("notes")}
          className={`flex-1 px-2 py-2 text-[10px] font-medium transition-colors ${
            tab === "notes"
              ? "border-b-2 border-purple-500 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("notes")}
        </button>
        <button
          onClick={() => { setTab("group"); setGroupUnread(0); }}
          className={`relative flex-1 px-2 py-2 text-[10px] font-medium transition-colors ${
            tab === "group"
              ? "border-b-2 border-amber-500 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tSocial("groupTab")}
          {groupUnread > 0 && tab !== "group" && (
            <span className="absolute top-1 right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] text-white">
              {groupUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("diary")}
          className={`flex-1 px-2 py-2 text-[10px] font-medium transition-colors ${
            tab === "diary"
              ? "border-b-2 border-amber-500 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tSocial("diaryTab")}
        </button>
        <button
          onClick={() => setTab("journey")}
          className={`flex-1 px-2 py-2 text-[10px] font-medium transition-colors ${
            tab === "journey"
              ? "border-b-2 border-emerald-500 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tJourney("title")}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "journey" ? (
          <JourneyPanel skillSlug={slug} />
        ) : tab === "group" ? (
          <GroupChatPanel skillSlug={slug} />
        ) : tab === "diary" ? (
          <DiaryPanel skillSlug={slug} />
        ) : tab === "history" ? (
          <div className="p-2 space-y-0.5">
            <div className="flex gap-1">
              <button
                onClick={() => onNewChat?.()}
                className="flex flex-1 items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t("newChat")}
              </button>
              {sessionCount > 0 && (
                <button
                  onClick={() => downloadAllSessionsMarkdown(slug)}
                  className="shrink-0 rounded-lg border border-dashed border-border px-2 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title={t("exportAllSessions")}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              )}
            </div>

            {sessionCount === 0 ? (
              <div className="py-6 text-center">
                <p className="text-[11px] text-muted-foreground">{t("noHistory")}</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-start gap-2 rounded-lg px-2.5 py-2 transition-colors cursor-pointer hover:bg-accent ${
                    activeSessionId === session.id ? "bg-accent/60" : ""
                  }`}
                  onClick={() => onLoadSession?.(session)}
                >
                  <svg className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate">
                      {session.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {session.messages.length} {t("messages")} · {formatTime(session.updatedAt)}
                    </p>
                  </div>
                  <div className="shrink-0 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSessionMarkdown(session);
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:text-blue-400"
                      title={t("exportSession")}
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:text-red-400"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-2">
            {!addingNote && (
              <div className="flex gap-1 mb-1">
                <button
                  onClick={() => setAddingNote(true)}
                  className="flex flex-1 items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {t("addNote")}
                </button>
                {entryCount > 0 && (
                  <button
                    onClick={() => downloadNotesMarkdown(slug)}
                    className="shrink-0 rounded-lg border border-dashed border-border px-2 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    title={t("export")}
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {addingNote && (
              <div className="mb-2 rounded-lg border border-border p-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={t("notePlaceholder")}
                  className="w-full rounded-md border border-border bg-secondary p-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                  rows={3}
                  autoFocus
                />
                <div className="mt-1.5 flex justify-end gap-1.5">
                  <button onClick={() => { setAddingNote(false); setNoteText(""); }} className="rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent">
                    {t("cancel")}
                  </button>
                  <button onClick={handleAddNote} disabled={!noteText.trim()} className="rounded bg-purple-600 px-2 py-1 text-[10px] text-white hover:bg-purple-700 disabled:opacity-50">
                    {t("save")}
                  </button>
                </div>
              </div>
            )}

            {entryCount === 0 && !addingNote ? (
              <div className="py-6 text-center">
                <p className="text-[11px] text-muted-foreground">{t("empty")}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {memory!.entries.map((entry, i) => (
                  <div key={`${entry.timestamp}-${i}`} className="group rounded-lg border border-border/50 bg-card p-2">
                    <div className="flex items-start justify-between gap-1.5">
                      <p className="text-[11px] text-foreground leading-relaxed">{entry.content}</p>
                      <button
                        onClick={() => handleDeleteNote(i)}
                        className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                      >
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`rounded px-1 py-0.5 text-[9px] ${
                        entry.source === "user" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"
                      }`}>
                        {entry.source === "user" ? t("manual") : t("auto")}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
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

      {/* Export / Import footer */}
      <div className="shrink-0 border-t border-border px-3 py-2 flex items-center gap-2">
        <button
          onClick={() => downloadBackup()}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={t("export")}
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t("export")}
        </button>
        <button
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              const result = await importBackup(file);
              if (result.success) {
                alert(t("importSuccess"));
                window.location.reload();
              } else {
                alert(`${t("importError")}: ${result.error}`);
              }
            };
            input.click();
          }}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={t("import")}
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {t("import")}
        </button>
      </div>
    </div>
  );
}
