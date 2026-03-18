/**
 * Model Router — automatically routes tasks to appropriate models.
 * Users only pick one model (for Teaching). Generation and Code tasks
 * are auto-routed to cost-effective models based on the user's plan.
 */

export type TaskCategory = "teaching" | "generation" | "code";

const PLAN_DEFAULTS: Record<string, { generation: string; code: string }> = {
  free:  { generation: "deepseek/deepseek-v3.2", code: "deepseek/deepseek-v3.2" },
  basic: { generation: "qwen/qwen3.5-plus-02-15", code: "openai/gpt-5.2-chat" },
  pro:   { generation: "openai/gpt-5.2-chat", code: "openai/gpt-5.3-codex" },
  admin: { generation: "openai/gpt-5.2-chat", code: "openai/gpt-5.3-codex" },
};

/**
 * Resolve the model to use for a given task category.
 * - "teaching": uses the user's selected model
 * - "generation": uses a cheap/fast model (slides, whiteboard, quiz, social)
 * - "code": uses a code-capable model (HTML5 simulations)
 *
 * Users can override generation/code models via localStorage settings.
 */
export function resolveModel(
  category: TaskCategory,
  userModel: string,
  plan: string = "free",
  overrides?: { generation?: string; code?: string }
): string {
  if (category === "teaching") {
    return userModel;
  }

  // Check user overrides first
  if (overrides?.[category]) {
    return overrides[category]!;
  }

  // Use plan defaults
  const planDefaults = PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.free;
  return planDefaults[category];
}

/**
 * Get the default model for a task category based on plan.
 */
export function getDefaultModelForCategory(
  category: TaskCategory,
  plan: string = "free"
): string {
  if (category === "teaching") {
    return "deepseek/deepseek-v3.2";
  }
  const planDefaults = PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.free;
  return planDefaults[category];
}

// localStorage keys for user overrides
const GENERATION_MODEL_KEY = "model-override-generation";
const CODE_MODEL_KEY = "model-override-code";

export function getSavedModelOverrides(): { generation?: string; code?: string } {
  if (typeof window === "undefined") return {};
  const generation = localStorage.getItem(GENERATION_MODEL_KEY) || undefined;
  const code = localStorage.getItem(CODE_MODEL_KEY) || undefined;
  return { generation, code };
}

export function saveModelOverride(category: "generation" | "code", modelId: string) {
  if (typeof window === "undefined") return;
  const key = category === "generation" ? GENERATION_MODEL_KEY : CODE_MODEL_KEY;
  if (modelId) {
    localStorage.setItem(key, modelId);
  } else {
    localStorage.removeItem(key);
  }
}
