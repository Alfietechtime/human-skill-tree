import { PhaseInfo } from "@/types/skill";

export const PHASES: PhaseInfo[] = [
  {
    id: 0,
    name: "Foundation",
    color: "#a78bfa",
    bgColor: "rgba(167, 139, 250, 0.15)",
    borderColor: "rgba(167, 139, 250, 0.5)",
    emoji: "🧠",
  },
  {
    id: 1,
    name: "K-12 Education",
    color: "#60a5fa",
    bgColor: "rgba(96, 165, 250, 0.15)",
    borderColor: "rgba(96, 165, 250, 0.5)",
    emoji: "📚",
  },
  {
    id: 2,
    name: "University",
    color: "#34d399",
    bgColor: "rgba(52, 211, 153, 0.15)",
    borderColor: "rgba(52, 211, 153, 0.5)",
    emoji: "🎓",
  },
  {
    id: 3,
    name: "Research",
    color: "#fbbf24",
    bgColor: "rgba(251, 191, 36, 0.15)",
    borderColor: "rgba(251, 191, 36, 0.5)",
    emoji: "🔬",
  },
  {
    id: 4,
    name: "Career",
    color: "#f97316",
    bgColor: "rgba(249, 115, 22, 0.15)",
    borderColor: "rgba(249, 115, 22, 0.5)",
    emoji: "💼",
  },
  {
    id: 5,
    name: "Soft Skills",
    color: "#ec4899",
    bgColor: "rgba(236, 72, 153, 0.15)",
    borderColor: "rgba(236, 72, 153, 0.5)",
    emoji: "🤝",
  },
  {
    id: 6,
    name: "Life Skills",
    color: "#14b8a6",
    bgColor: "rgba(20, 184, 166, 0.15)",
    borderColor: "rgba(20, 184, 166, 0.5)",
    emoji: "🌟",
  },
];

export const PHASE_NAMES: Record<number, string> = Object.fromEntries(
  PHASES.map((p) => [p.id, p.name])
);
