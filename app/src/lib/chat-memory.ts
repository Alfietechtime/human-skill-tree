/**
 * Chat Memory — stores conversation sessions and learning notes in localStorage.
 * Organized by skill slug. Each skill can have multiple chat sessions.
 */

export interface MemoryEntry {
  timestamp: string;
  content: string;
  source: "auto" | "user";
}

export interface ChatMessage {
  role: string;
  text: string;
}

export interface ChatSession {
  id: string;
  /** First user message as title */
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  /** Which tutor was active during this session */
  tutorKey?: string;
}

export interface SkillMemory {
  slug: string;
  entries: MemoryEntry[];
  sessions: ChatSession[];
  updatedAt: string;
}

const STORAGE_KEY = "chat-memory";

function getAll(): Record<string, SkillMemory> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    // Migration: convert old format (lastMessages) to new format (sessions)
    for (const key of Object.keys(data)) {
      const mem = data[key];
      if (!mem.sessions) {
        mem.sessions = [];
        if (mem.lastMessages && mem.lastMessages.length > 0) {
          const firstUserMsg = mem.lastMessages.find((m: ChatMessage) => m.role === "user");
          mem.sessions.push({
            id: generateId(),
            title: firstUserMsg?.text?.slice(0, 50) || "Conversation",
            messages: mem.lastMessages,
            createdAt: mem.updatedAt || new Date().toISOString(),
            updatedAt: mem.updatedAt || new Date().toISOString(),
          });
        }
        delete mem.lastMessages;
      }
    }
    return data;
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, SkillMemory>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function ensureSkill(all: Record<string, SkillMemory>, slug: string): SkillMemory {
  if (!all[slug]) {
    all[slug] = { slug, entries: [], sessions: [], updatedAt: new Date().toISOString() };
  }
  return all[slug];
}

// ── Notes ──

export function getSkillMemory(slug: string): SkillMemory {
  const all = getAll();
  return all[slug] || { slug, entries: [], sessions: [], updatedAt: new Date().toISOString() };
}

export function addMemoryEntry(slug: string, content: string, source: "auto" | "user" = "auto") {
  const all = getAll();
  const mem = ensureSkill(all, slug);
  mem.entries.push({ timestamp: new Date().toISOString(), content, source });
  mem.updatedAt = new Date().toISOString();
  saveAll(all);
  return mem;
}

export function deleteMemoryEntry(slug: string, index: number) {
  const all = getAll();
  if (!all[slug]) return;
  all[slug].entries.splice(index, 1);
  all[slug].updatedAt = new Date().toISOString();
  saveAll(all);
}

// ── Sessions ──

/** Save or update a chat session. Creates new if sessionId not found. */
export function saveSession(
  slug: string,
  sessionId: string | null,
  messages: ChatMessage[],
  tutorKey?: string
): string {
  if (messages.length === 0) return sessionId || "";
  const all = getAll();
  const mem = ensureSkill(all, slug);

  const firstUserMsg = messages.find((m) => m.role === "user");
  const title = firstUserMsg?.text?.slice(0, 50) || "Conversation";
  const now = new Date().toISOString();

  // Keep last 200 messages per session
  const trimmedMessages = messages.slice(-200);

  if (sessionId) {
    const existing = mem.sessions.find((s) => s.id === sessionId);
    if (existing) {
      existing.messages = trimmedMessages;
      existing.title = title;
      existing.updatedAt = now;
      if (tutorKey) existing.tutorKey = tutorKey;
      mem.updatedAt = now;
      saveAll(all);
      return sessionId;
    }
  }

  // Create new session
  const newId = generateId();
  mem.sessions.unshift({
    id: newId,
    title,
    messages: trimmedMessages,
    createdAt: now,
    updatedAt: now,
    ...(tutorKey ? { tutorKey } : {}),
  });

  // Keep max 20 sessions per skill
  if (mem.sessions.length > 20) {
    mem.sessions = mem.sessions.slice(0, 20);
  }

  mem.updatedAt = now;
  saveAll(all);
  return newId;
}

export function getSession(slug: string, sessionId: string): ChatSession | null {
  const mem = getSkillMemory(slug);
  return mem.sessions.find((s) => s.id === sessionId) || null;
}

export function getSessions(slug: string): ChatSession[] {
  return getSkillMemory(slug).sessions;
}

export function deleteSession(slug: string, sessionId: string) {
  const all = getAll();
  if (!all[slug]) return;
  all[slug].sessions = all[slug].sessions.filter((s) => s.id !== sessionId);
  all[slug].updatedAt = new Date().toISOString();
  saveAll(all);
}

export function clearSkillMemory(slug: string) {
  const all = getAll();
  delete all[slug];
  saveAll(all);
}

// ── Legacy compat ──

export function saveLastMessages(slug: string, messages: ChatMessage[]) {
  // No-op — now handled by saveSession
}

// ── Export ──

/** Export notes for a skill as Markdown */
export function exportNotesMarkdown(slug: string): string {
  const mem = getSkillMemory(slug);
  if (mem.entries.length === 0) return `# Notes — ${slug}\n\nNo notes yet.`;
  const lines = [`# Notes — ${slug}\n`];
  for (const entry of mem.entries) {
    const date = new Date(entry.timestamp).toLocaleDateString();
    const src = entry.source === "user" ? "manual" : "auto";
    lines.push(`- **[${src}]** ${entry.content} _(${date})_`);
  }
  return lines.join("\n");
}

/** Download notes as .md file */
export function downloadNotesMarkdown(slug: string) {
  const md = exportNotesMarkdown(slug);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `notes-${slug}-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export a single session as Markdown */
export function exportSessionMarkdown(session: ChatSession): string {
  const date = new Date(session.createdAt).toLocaleDateString();
  const lines = [
    `# ${session.title}`,
    ``,
    `> Date: ${date}${session.tutorKey ? ` | Tutor: ${session.tutorKey}` : ""}`,
    `> Messages: ${session.messages.length}`,
    ``,
    `---`,
    ``,
  ];
  for (const msg of session.messages) {
    const role = msg.role === "user" ? "**You**" : "**AI Tutor**";
    const text = msg.text.replace(/<!--[\s\S]*?-->/g, "").trim();
    lines.push(`### ${role}`);
    lines.push(``);
    lines.push(text);
    lines.push(``);
  }
  return lines.join("\n");
}

/** Export all sessions for a skill as Markdown */
export function exportAllSessionsMarkdown(slug: string): string {
  const sessions = getSessions(slug);
  if (sessions.length === 0) return `# ${slug}\n\nNo sessions.`;
  return sessions.map((s) => exportSessionMarkdown(s)).join("\n\n---\n\n");
}

/** Download a session as .md file */
export function downloadSessionMarkdown(session: ChatSession) {
  const md = exportSessionMarkdown(session);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date(session.createdAt).toISOString().slice(0, 10);
  a.download = `chat-${session.title.slice(0, 30).replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_")}-${dateStr}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download all sessions for a skill as .md file */
export function downloadAllSessionsMarkdown(slug: string) {
  const md = exportAllSessionsMarkdown(slug);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `all-chats-${slug}-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Utils ──

export function extractKeyPoint(text: string): string | null {
  if (!text || text.length < 20) return null;
  const clean = text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n+/g, " ")
    .trim();
  const match = clean.match(/^(.{20,150}?[。.!！?？])/);
  if (match) return match[1];
  return clean.slice(0, 120) + (clean.length > 120 ? "..." : "");
}
