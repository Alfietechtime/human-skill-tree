/**
 * Learning Events — shared event bus for timeline, exercises, and analytics.
 * Stores up to 500 events in localStorage with FIFO eviction.
 */

export interface LearningEvent {
  id: string;
  type: "kp_learned" | "stuck" | "tutor_switch" | "exercise_completed" | "milestone" | "session_start";
  timestamp: string;
  skillSlug: string;
  data: Record<string, unknown>;
}

const STORAGE_KEY = "learning-events";
const MAX_EVENTS = 500;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getAll(): LearningEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(events: LearningEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function addLearningEvent(
  type: LearningEvent["type"],
  skillSlug: string,
  data: Record<string, unknown> = {}
): LearningEvent {
  const events = getAll();
  const event: LearningEvent = {
    id: generateId(),
    type,
    timestamp: new Date().toISOString(),
    skillSlug,
    data,
  };
  events.push(event);
  // FIFO eviction
  while (events.length > MAX_EVENTS) {
    events.shift();
  }
  saveAll(events);
  return event;
}

export function getLearningEvents(skillSlug?: string, limit?: number): LearningEvent[] {
  let events = getAll();
  if (skillSlug) {
    events = events.filter((e) => e.skillSlug === skillSlug);
  }
  // Return newest first
  events.reverse();
  if (limit) {
    events = events.slice(0, limit);
  }
  return events;
}

export function getEventsByType(type: LearningEvent["type"], skillSlug?: string): LearningEvent[] {
  let events = getAll();
  events = events.filter((e) => e.type === type);
  if (skillSlug) {
    events = events.filter((e) => e.skillSlug === skillSlug);
  }
  return events.reverse();
}

export function getEventsByTutor(tutorKey: string, limit?: number): LearningEvent[] {
  let events = getAll().filter((e) => e.data.tutorKey === tutorKey);
  events.reverse();
  if (limit) events = events.slice(0, limit);
  return events;
}
