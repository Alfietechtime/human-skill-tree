/**
 * Social Content — stores group chat messages and diary entries.
 * Generated after learning sessions to create an immersive social experience.
 */

export interface GroupChatMessage {
  tutorKey: string;
  tutorName: string;
  tutorEmoji: string;
  content: string;
  timestamp: string;
}

export interface DiaryEntry {
  content: string;
  mood: string;
  skillSlug: string;
  timestamp: string;
}

const GROUP_CHAT_KEY = "group-chat";
const DIARY_KEY = "diary-entries";
const LAST_SOCIAL_GEN_KEY = "last-social-gen";

// ── Group Chat ──

function getAllGroupChats(): Record<string, GroupChatMessage[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GROUP_CHAT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllGroupChats(data: Record<string, GroupChatMessage[]>) {
  localStorage.setItem(GROUP_CHAT_KEY, JSON.stringify(data));
}

export function getGroupChat(skillSlug: string): GroupChatMessage[] {
  const all = getAllGroupChats();
  return all[skillSlug] || [];
}

export function addGroupChatMessages(skillSlug: string, messages: GroupChatMessage[]) {
  const all = getAllGroupChats();
  if (!all[skillSlug]) all[skillSlug] = [];
  all[skillSlug].push(...messages);
  // Keep last 100 messages per skill
  if (all[skillSlug].length > 100) {
    all[skillSlug] = all[skillSlug].slice(-100);
  }
  saveAllGroupChats(all);
}

export function getGroupChatUnreadCount(skillSlug: string): number {
  const lastRead = localStorage.getItem(`group-chat-read-${skillSlug}`);
  const messages = getGroupChat(skillSlug);
  if (!lastRead) return messages.length;
  return messages.filter((m) => m.timestamp > lastRead).length;
}

export function markGroupChatRead(skillSlug: string) {
  localStorage.setItem(`group-chat-read-${skillSlug}`, new Date().toISOString());
}

// ── Diary ──

function getAllDiary(): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DIARY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllDiary(data: DiaryEntry[]) {
  localStorage.setItem(DIARY_KEY, JSON.stringify(data));
}

export function getDiaryEntries(skillSlug?: string): DiaryEntry[] {
  const all = getAllDiary();
  if (!skillSlug) return all;
  return all.filter((e) => e.skillSlug === skillSlug);
}

export function addDiaryEntry(entry: DiaryEntry) {
  const all = getAllDiary();
  all.push(entry);
  // Keep last 50 entries
  if (all.length > 50) {
    saveAllDiary(all.slice(-50));
  } else {
    saveAllDiary(all);
  }
}

// ── Generation Throttle ──

/** Returns true if enough time has passed since last generation for this skill */
export function canGenerateSocial(skillSlug: string): boolean {
  if (typeof window === "undefined") return false;
  const lastGen = localStorage.getItem(`${LAST_SOCIAL_GEN_KEY}-${skillSlug}`);
  if (!lastGen) return true;
  const elapsed = Date.now() - new Date(lastGen).getTime();
  return elapsed > 10 * 60 * 1000; // 10 minutes minimum gap
}

export function markSocialGenerated(skillSlug: string) {
  localStorage.setItem(`${LAST_SOCIAL_GEN_KEY}-${skillSlug}`, new Date().toISOString());
}

// ── Export group chat as markdown ──

export function exportGroupChatMarkdown(skillSlug: string): string {
  const messages = getGroupChat(skillSlug);
  if (messages.length === 0) return `# Group Chat — ${skillSlug}\n\nNo messages yet.`;

  const lines = [`# Group Chat — ${skillSlug}\n`];
  let lastDate = "";
  for (const msg of messages) {
    const date = new Date(msg.timestamp).toLocaleDateString();
    if (date !== lastDate) {
      lines.push(`\n## ${date}\n`);
      lastDate = date;
    }
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    lines.push(`**${msg.tutorEmoji} ${msg.tutorName}** (${time})`);
    lines.push(msg.content);
    lines.push("");
  }
  return lines.join("\n");
}

// ── Export diary as markdown ──

export function exportDiaryMarkdown(): string {
  const entries = getAllDiary();
  if (entries.length === 0) return "# Learning Diary\n\nNo entries yet.";

  const lines = ["# Learning Diary\n"];
  for (const entry of entries) {
    const date = new Date(entry.timestamp).toLocaleDateString();
    lines.push(`## ${date} ${entry.mood}`);
    lines.push(`*Skill: ${entry.skillSlug}*\n`);
    lines.push(entry.content);
    lines.push("");
  }
  return lines.join("\n");
}
