/**
 * Available AI models for the chat tutor.
 * All models go through OpenRouter.
 */

export type ModelTier = "fast" | "balanced" | "powerful" | "reasoning";
export type PlanLevel = "free" | "basic" | "pro";

export interface ModelOption {
  id: string;
  label: string;
  description: string;
  tier: ModelTier;
  minPlan: PlanLevel;
}

export const MODELS: ModelOption[] = [
  // ── Fast (cheap, quick response) — Free tier ──
  {
    id: "deepseek/deepseek-v3.2",
    label: "DeepSeek V3.2",
    description: "极速响应，中文出色",
    tier: "fast",
    minPlan: "free",
  },
  {
    id: "minimax/minimax-m2.5",
    label: "MiniMax M2.5",
    description: "快速多语言",
    tier: "fast",
    minPlan: "free",
  },
  {
    id: "google/gemini-3.1-flash-lite-preview",
    label: "Gemini 3.1 Flash Lite",
    description: "Google轻量快速",
    tier: "fast",
    minPlan: "free",
  },
  {
    id: "qwen/qwen3.5-flash-02-23",
    label: "Qwen 3.5 Flash",
    description: "阿里云快速模型",
    tier: "fast",
    minPlan: "free",
  },
  {
    id: "mistralai/ministral-14b-2512",
    label: "Ministral 3 14B",
    description: "Mistral轻量模型",
    tier: "fast",
    minPlan: "free",
  },

  // ── Balanced (good quality/cost ratio) — Basic tier ──
  {
    id: "anthropic/claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    description: "Anthropic均衡之选",
    tier: "balanced",
    minPlan: "basic",
  },
  {
    id: "google/gemini-3-flash-preview",
    label: "Gemini 3 Flash",
    description: "Google均衡模型",
    tier: "balanced",
    minPlan: "basic",
  },
  {
    id: "minimax/minimax-m2.1",
    label: "MiniMax M2.1",
    description: "性价比优秀",
    tier: "balanced",
    minPlan: "basic",
  },
  {
    id: "qwen/qwen3.5-plus-02-15",
    label: "Qwen 3.5 Plus",
    description: "阿里云增强版",
    tier: "balanced",
    minPlan: "basic",
  },
  {
    id: "openai/gpt-5.2-chat",
    label: "GPT-5.2 Chat",
    description: "OpenAI对话优化",
    tier: "balanced",
    minPlan: "basic",
  },

  // ── Powerful (highest quality) — Pro tier ──
  {
    id: "openai/gpt-5.4-pro",
    label: "GPT-5.4 Pro",
    description: "OpenAI最强旗舰",
    tier: "powerful",
    minPlan: "pro",
  },
  {
    id: "anthropic/claude-opus-4.6",
    label: "Claude Opus 4.6",
    description: "最强推理能力",
    tier: "powerful",
    minPlan: "pro",
  },
  {
    id: "google/gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro",
    description: "Google旗舰模型",
    tier: "powerful",
    minPlan: "pro",
  },
  {
    id: "openai/gpt-5.2-pro",
    label: "GPT-5.2 Pro",
    description: "OpenAI专业版",
    tier: "powerful",
    minPlan: "pro",
  },

  // ── Reasoning (deep thinking, slower) — Pro tier ──
  {
    id: "deepseek/deepseek-v3.2-speciale",
    label: "DeepSeek V3.2 Speciale",
    description: "深度推理专用",
    tier: "reasoning",
    minPlan: "pro",
  },
  {
    id: "qwen/qwen3-max-thinking",
    label: "Qwen3 Max Thinking",
    description: "阿里云深度思考",
    tier: "reasoning",
    minPlan: "pro",
  },
  {
    id: "openai/gpt-5.3-codex",
    label: "GPT-5.3 Codex",
    description: "代码与推理专精",
    tier: "reasoning",
    minPlan: "pro",
  },
  {
    id: "qwen/qwen3.5-397b-a17b",
    label: "Qwen 3.5 397B",
    description: "千亿参数巨型模型",
    tier: "reasoning",
    minPlan: "pro",
  },
];

export const DEFAULT_MODEL = "deepseek/deepseek-v3.2";

/** Task category labels for model router UI */
export type TaskCategoryLabel = "teaching" | "generation" | "code";
export const TASK_CATEGORIES: Array<{ key: TaskCategoryLabel; label: string }> = [
  { key: "teaching", label: "Teaching (user-selected)" },
  { key: "generation", label: "Generation (auto)" },
  { key: "code", label: "Code (auto)" },
];

const STORAGE_KEY = "selected-model";

export function getSavedModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_MODEL;
}

export function saveModel(modelId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, modelId);
}

export function getModelById(id: string): ModelOption | undefined {
  return MODELS.find((m) => m.id === id);
}

/** Check if a user's plan can access a model */
export function canAccessModel(modelMinPlan: PlanLevel, userPlan: string): boolean {
  if (userPlan === "admin" || userPlan === "pro") return true;
  if (userPlan === "basic") return modelMinPlan === "free" || modelMinPlan === "basic";
  return modelMinPlan === "free";
}

/** Get all model IDs accessible by a plan */
export function getAccessibleModelIds(plan: string): string[] | null {
  if (plan === "admin" || plan === "pro") return null; // null = all
  return MODELS.filter((m) => canAccessModel(m.minPlan, plan)).map((m) => m.id);
}
