"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MODELS, getSavedModel, saveModel, getModelById, canAccessModel, DEFAULT_MODEL, type ModelOption } from "@/lib/models";
import { useAuth } from "@/components/auth/auth-provider";
import { PricingModal } from "@/components/pricing-modal";

const TIER_COLORS: Record<string, string> = {
  fast: "bg-green-500/15 text-green-400",
  balanced: "bg-blue-500/15 text-blue-400",
  powerful: "bg-amber-500/15 text-amber-400",
  reasoning: "bg-rose-500/15 text-rose-400",
};

const PLAN_LABELS: Record<string, string> = {
  basic: "Basic",
  pro: "Pro",
};

export function ModelSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (modelId: string) => void;
}) {
  const t = useTranslations("model");
  const { planInfo, user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Default to "free" until plan info is loaded; logged-in users get their actual plan
  // In dev mode, unlock all models for testing
  const isDev = process.env.NODE_ENV === "development";
  const userPlan = isDev ? "admin" : (loading ? "free" : (planInfo?.plan ?? "free"));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // If the currently selected model is locked for this plan, auto-switch to default
  useEffect(() => {
    const currentModel = getModelById(value);
    if (currentModel && !canAccessModel(currentModel.minPlan, userPlan)) {
      onChange(DEFAULT_MODEL);
      saveModel(DEFAULT_MODEL);
    }
  }, [userPlan, value, onChange]);

  const current = getModelById(value);
  const displayLabel = current?.label || value.split("/").pop() || "Model";

  const handleSelect = (model: ModelOption) => {
    if (!canAccessModel(model.minPlan, userPlan)) {
      setOpen(false);
      setShowPricing(true);
      return;
    }
    onChange(model.id);
    saveModel(model.id);
    setOpen(false);
  };

  return (
    <>
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title={t("switchModel")}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22" />
          <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
          <path d="M8.56 13a8 8 0 0 0-2.3 3.5" />
          <path d="M15.44 13a8 8 0 0 1 2.3 3.5" />
        </svg>
        <span className="hidden sm:inline max-w-[100px] truncate">{displayLabel}</span>
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl border border-border bg-popover p-1.5 shadow-xl">
          <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("switchModel")}
          </div>

          {MODELS.map((model) => {
            const locked = !canAccessModel(model.minPlan, userPlan);

            return (
              <button
                key={model.id}
                onClick={() => handleSelect(model)}
                className={`flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  locked
                    ? "opacity-60 hover:opacity-80"
                    : "hover:bg-accent"
                } ${value === model.id ? "bg-accent/50" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      locked
                        ? "text-muted-foreground"
                        : value === model.id
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}>
                      {model.label}
                    </span>
                    <span className={`rounded px-1 py-0.5 text-[10px] ${TIER_COLORS[model.tier]}`}>
                      {t(model.tier)}
                    </span>
                    {locked && (
                      <span className="ml-auto flex items-center gap-1 rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] text-purple-400">
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        {PLAN_LABELS[model.minPlan] || model.minPlan}
                      </span>
                    )}
                    {!locked && value === model.id && (
                      <svg className="h-3 w-3 text-purple-400 ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {model.description}
                  </p>
                </div>
              </button>
            );
          })}

          <div className="mt-1 border-t border-border pt-1.5 px-2.5 pb-1">
            <p className="text-[10px] text-muted-foreground/60">
              {t("hint")}
            </p>
          </div>
        </div>
      )}
    </div>
    {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </>
  );
}
