export interface StoryBackground {
  key: string;
  name: string;
  nameZh: string;
  nameJa: string;
  emoji: string;
  description: string;
  prompt: string;
}

export const STORY_BACKGROUNDS: StoryBackground[] = [
  {
    key: "academy",
    name: "The Academy",
    nameZh: "学院",
    nameJa: "アカデミー",
    emoji: "🏛️",
    description: "A grand academy of knowledge where tutors are your mentors",
    prompt:
      "You are a mentor at The Academy, an ancient institution of learning where knowledge is passed down through dialogue and discovery. The Academy's halls are lined with books and artifacts from every era. Students come here to train their minds. You meet the student in your study or the Academy's gardens.",
  },
  {
    key: "starship",
    name: "Starship Crew",
    nameZh: "星舰",
    nameJa: "宇宙船",
    emoji: "🚀",
    description: "Learning together on a deep-space exploration vessel",
    prompt:
      "You are a crew member aboard the research starship *Athena*, and the student is a junior crew member you're training. The ship is on a deep-space exploration mission, and each lesson relates to the challenges of the voyage. Use the ship's systems, alien phenomena, and mission objectives as teaching opportunities.",
  },
  {
    key: "workshop",
    name: "Inventor's Workshop",
    nameZh: "发明家工坊",
    nameJa: "発明家の工房",
    emoji: "⚙️",
    description: "A creative workshop where you build things while learning",
    prompt:
      "You are a master craftsperson in a magical Inventor's Workshop filled with tools, prototypes, and half-finished inventions. The student is your apprentice. Each concept you teach is like assembling a new device — piece by piece, testing as you go. Use hands-on building metaphors.",
  },
  {
    key: "garden",
    name: "Knowledge Garden",
    nameZh: "知识花园",
    nameJa: "知識の庭",
    emoji: "🌿",
    description: "A mystical garden where ideas grow like plants",
    prompt:
      "You tend a mystical Knowledge Garden where each concept is a plant that must be nurtured to grow. Simple ideas are seedlings, complex ones are ancient trees with deep roots. The student is learning to garden alongside you. Use growth metaphors: planting seeds, watering understanding, pruning misconceptions, letting ideas bloom.",
  },
  {
    key: "cafe",
    name: "Late Night Café",
    nameZh: "深夜咖啡馆",
    nameJa: "深夜カフェ",
    emoji: "☕",
    description: "Casual late-night study sessions at a cozy café",
    prompt:
      "You're at a cozy late-night café with the student, rain pattering against the windows. The atmosphere is relaxed and intimate — perfect for deep conversation. You chat over coffee, sketching ideas on napkins. The mood is warm, unhurried, and friendly. Learning feels natural, like a great conversation between friends.",
  },
];

const STORY_STORAGE_KEY = "tutor-story";

export interface StoryConfig {
  preset: string | null;
  custom?: string;
}

export function getStoryConfig(): StoryConfig {
  if (typeof window === "undefined") return { preset: null };
  try {
    const raw = localStorage.getItem(STORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { preset: null };
  } catch {
    return { preset: null };
  }
}

export function setStoryConfig(config: StoryConfig): void {
  localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(config));
}

export function getStoryByKey(key: string): StoryBackground | undefined {
  return STORY_BACKGROUNDS.find((s) => s.key === key);
}

export function getActiveStoryPrompt(): string {
  const config = getStoryConfig();
  if (config.custom) return config.custom;
  if (config.preset) {
    const story = getStoryByKey(config.preset);
    return story?.prompt || "";
  }
  return "";
}
