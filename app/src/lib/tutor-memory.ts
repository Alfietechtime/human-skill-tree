/**
 * Tutor Memory — tracks cross-session teaching history, stuck points, and attitude evolution.
 * All data stored in localStorage for privacy.
 */

export interface TutorMemory {
  /** Topics this tutor has taught */
  taughtTopics: string[];
  /** Points where the student got stuck */
  stuckPoints: string[];
  /** Last updated timestamp */
  updatedAt: string;
}

export interface AttitudeEntry {
  /** Natural language description of the attitude shift */
  description: string;
  /** When this attitude was recorded */
  timestamp: string;
  /** Which skill context this was from */
  skillSlug: string;
}

const MEMORY_KEY = "tutor-memory";
const ATTITUDES_KEY = "tutor-attitudes";

// ── Tutor Memory (per tutor + skill) ──

function getAllMemory(): Record<string, TutorMemory> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllMemory(data: Record<string, TutorMemory>) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(data));
}

function memoryKey(tutorKey: string, skillSlug: string): string {
  return `${tutorKey}-${skillSlug}`;
}

export function getTutorMemory(tutorKey: string, skillSlug: string): TutorMemory {
  const all = getAllMemory();
  const key = memoryKey(tutorKey, skillSlug);
  return all[key] || { taughtTopics: [], stuckPoints: [], updatedAt: new Date().toISOString() };
}

export function addTaughtTopics(tutorKey: string, skillSlug: string, topics: string[]) {
  const all = getAllMemory();
  const key = memoryKey(tutorKey, skillSlug);
  if (!all[key]) {
    all[key] = { taughtTopics: [], stuckPoints: [], updatedAt: new Date().toISOString() };
  }
  for (const topic of topics) {
    const trimmed = topic.trim();
    if (trimmed && !all[key].taughtTopics.includes(trimmed)) {
      all[key].taughtTopics.push(trimmed);
    }
  }
  // Keep last 20 topics
  all[key].taughtTopics = all[key].taughtTopics.slice(-20);
  all[key].updatedAt = new Date().toISOString();
  saveAllMemory(all);
}

export function addStuckPoints(tutorKey: string, skillSlug: string, points: string[]) {
  const all = getAllMemory();
  const key = memoryKey(tutorKey, skillSlug);
  if (!all[key]) {
    all[key] = { taughtTopics: [], stuckPoints: [], updatedAt: new Date().toISOString() };
  }
  for (const point of points) {
    const trimmed = point.trim();
    if (trimmed && !all[key].stuckPoints.includes(trimmed)) {
      all[key].stuckPoints.push(trimmed);
    }
  }
  // Keep last 10 stuck points
  all[key].stuckPoints = all[key].stuckPoints.slice(-10);
  all[key].updatedAt = new Date().toISOString();
  saveAllMemory(all);
}

// ── Attitudes (per tutor, cross-skill) ──

function getAllAttitudes(): Record<string, AttitudeEntry[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ATTITUDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllAttitudes(data: Record<string, AttitudeEntry[]>) {
  localStorage.setItem(ATTITUDES_KEY, JSON.stringify(data));
}

export function getTutorAttitudes(tutorKey: string): AttitudeEntry[] {
  const all = getAllAttitudes();
  return all[tutorKey] || [];
}

export function addTutorAttitude(tutorKey: string, skillSlug: string, description: string) {
  const all = getAllAttitudes();
  if (!all[tutorKey]) all[tutorKey] = [];
  all[tutorKey].push({
    description: description.trim(),
    timestamp: new Date().toISOString(),
    skillSlug,
  });
  // Keep last 20 attitude entries
  all[tutorKey] = all[tutorKey].slice(-20);
  saveAllAttitudes(all);
}

export function getLatestAttitude(tutorKey: string): string | null {
  const attitudes = getTutorAttitudes(tutorKey);
  if (attitudes.length === 0) return null;
  return attitudes[attitudes.length - 1].description;
}

// ── Cross-Tutor Context Builder ──

/**
 * Build a cross-tutor memory summary for injection into the system prompt.
 * Keeps it under ~300 tokens by limiting to recent items.
 */
export function buildCrossTutorContext(
  currentTutorKey: string,
  skillSlug: string,
  allTutorKeys: string[]
): string {
  const lines: string[] = [];
  const otherTutors = allTutorKeys.filter((k) => k !== currentTutorKey);

  for (const tk of otherTutors) {
    const mem = getTutorMemory(tk, skillSlug);
    const attitude = getLatestAttitude(tk);

    if (mem.taughtTopics.length === 0 && !attitude) continue;

    const topics = mem.taughtTopics.slice(-5).join(", ");
    const stucks = mem.stuckPoints.slice(-3).join(", ");

    let line = `- ${tk}: taught [${topics}]`;
    if (stucks) line += `; student struggled with [${stucks}]`;
    if (attitude) line += `; impression: "${attitude}"`;
    lines.push(line);
  }

  // Also include current tutor's own memory for this skill
  const ownMem = getTutorMemory(currentTutorKey, skillSlug);
  if (ownMem.stuckPoints.length > 0) {
    lines.push(`- You previously noted the student struggled with: ${ownMem.stuckPoints.slice(-3).join(", ")}`);
  }

  if (lines.length === 0) return "";

  return `## Cross-Tutor Teaching Context
The following is what other tutors have observed about this student (use this to personalize your teaching):
${lines.join("\n")}

Reference this context naturally — e.g., "I heard you've been working on X with another tutor" — but don't force it.`;
}
