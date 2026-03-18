"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

interface Step {
  selector: string;
  i18nKey: string;
  route: string; // which route pattern this step should appear on
}

const STEPS: Step[] = [
  { selector: "[data-onboarding='explore-cta']", i18nKey: "step1", route: "/" },
  { selector: "[data-onboarding='skill-tree']", i18nKey: "step2", route: "/tree" },
  { selector: "[data-onboarding='skill-tabs']", i18nKey: "step3", route: "/skill/" },
  { selector: "[data-onboarding='start-learning']", i18nKey: "step4", route: "/skill/" },
];

const STORAGE_KEY = "onboarding-completed";

export function SpotlightGuide() {
  const t = useTranslations("onboarding");
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check if we should show guide
  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay to let the page render
      const timer = setTimeout(() => setActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Find and highlight the target element
  const updateTarget = useCallback(() => {
    if (!active) return;
    const step = STEPS[currentStep];
    if (!step) return;

    const el = document.querySelector(step.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [active, currentStep]);

  useEffect(() => {
    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget);
    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget);
    };
  }, [updateTarget]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setActive(false);
  };

  if (!active) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const top = targetRect.bottom + 16;
    const left = Math.max(16, Math.min(targetRect.left, window.innerWidth - 320));
    return { top, left, maxWidth: 300 };
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Highlight border */}
      {targetRect && (
        <div
          className="absolute rounded-xl border-2 border-purple-400 shadow-[0_0_24px_rgba(168,85,247,0.4)] transition-all duration-300 pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute z-10 rounded-xl border border-border bg-popover p-4 shadow-2xl"
        style={getTooltipStyle()}
      >
        <p className="text-sm text-foreground leading-relaxed">
          {t(step.i18nKey)}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} {t("stepOf")} {STEPS.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={finish}
              className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
            >
              {t("skip")}
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs text-white hover:bg-purple-700 transition-colors"
            >
              {isLast ? t("finish") : t("next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
