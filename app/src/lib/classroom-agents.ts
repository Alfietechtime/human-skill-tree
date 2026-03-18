/**
 * Classroom Mode — multi-agent role definitions.
 * Teacher + Assistant + 2 AI Students simulate an interactive classroom.
 */

export interface ClassroomAgent {
  role: "teacher" | "assistant" | "studentA" | "studentB";
  tutorKey?: string;
  name: string;
  emoji: string;
  personality: string;
  systemPrompt: string;
  /** Whether this agent uses the user's selected model (teaching) or a cheap model (generation) */
  modelCategory: "teaching" | "generation";
  /** Color for UI differentiation */
  color: string;
}

/** Build classroom agents from the active tutor and skill */
export function buildClassroomAgents(
  teacherTutorKey: string,
  teacherName: string,
  teacherEmoji: string,
  assistantTutorKey: string,
  assistantName: string,
  assistantEmoji: string,
): ClassroomAgent[] {
  return [
    {
      role: "teacher",
      tutorKey: teacherTutorKey,
      name: teacherName,
      emoji: teacherEmoji,
      personality: "Lead instructor who explains concepts clearly",
      systemPrompt: `You are the LEAD TEACHER in a classroom. Explain concepts clearly and engage with student questions. Address the human learner directly. Keep responses focused and under 200 words.`,
      modelCategory: "teaching",
      color: "text-amber-400",
    },
    {
      role: "assistant",
      tutorKey: assistantTutorKey,
      name: assistantName,
      emoji: assistantEmoji,
      personality: "Teaching assistant who provides additional perspective",
      systemPrompt: `You are the TEACHING ASSISTANT. Add complementary perspectives, examples, or clarifications to what the teacher said. Be brief (under 100 words). Don't repeat what the teacher already said.`,
      modelCategory: "teaching",
      color: "text-blue-400",
    },
    {
      role: "studentA",
      name: "Mia",
      emoji: "🙋",
      personality: "Curious and asks lots of questions",
      systemPrompt: `You are MIA, a curious AI student in a classroom. You love asking "why" and "how" questions. You sometimes get confused and need clarification. Keep your responses short (1-2 sentences). You are NOT the teacher — you are learning alongside the human student.`,
      modelCategory: "generation",
      color: "text-green-400",
    },
    {
      role: "studentB",
      name: "Alex",
      emoji: "🤓",
      personality: "Studious and sometimes challenges ideas",
      systemPrompt: `You are ALEX, a studious AI student. You like to fact-check, add nuances, or play devil's advocate. You sometimes connect topics to other fields. Keep responses short (1-2 sentences). You are NOT the teacher — you are learning alongside the human student.`,
      modelCategory: "generation",
      color: "text-orange-400",
    },
  ];
}

/** Determine which agents should speak this turn based on conversation flow */
export function selectSpeakers(
  turnIndex: number,
  lastSpeakerRole: string,
  userJustSpoke: boolean,
): string[] {
  // If user just spoke, teacher always responds
  if (userJustSpoke) {
    // 70% chance a student also chimes in
    const speakers = ["teacher"];
    if (Math.random() < 0.7) {
      speakers.push(Math.random() < 0.5 ? "studentA" : "studentB");
    }
    // 30% chance assistant adds something
    if (Math.random() < 0.3) {
      speakers.push("assistant");
    }
    return speakers;
  }

  // After teacher speaks, sometimes students react
  if (lastSpeakerRole === "teacher") {
    if (Math.random() < 0.5) {
      return [Math.random() < 0.5 ? "studentA" : "studentB"];
    }
    return [];
  }

  // After a student speaks, teacher may respond
  if (lastSpeakerRole === "studentA" || lastSpeakerRole === "studentB") {
    if (Math.random() < 0.6) {
      return ["teacher"];
    }
    return [];
  }

  return [];
}
