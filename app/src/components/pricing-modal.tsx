"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "./auth/auth-provider";
import { useTranslations } from "next-intl";

const AFDIAN_URL = process.env.NEXT_PUBLIC_AFDIAN_URL ?? "";
const LS_BASIC_CHECKOUT =
  process.env.NEXT_PUBLIC_LS_BASIC_CHECKOUT ?? "";
const LS_PRO_CHECKOUT =
  process.env.NEXT_PUBLIC_LS_PRO_CHECKOUT ?? "";

interface PricingModalProps {
  onClose: () => void;
}

function PricingModalContent({ onClose }: PricingModalProps) {
  const { user } = useAuth();
  const t = useTranslations("pricing");
  const [tab, setTab] = useState<"cn" | "intl">("cn");

  const userEmail = user?.email || "";

  // LemonSqueezy checkout URLs with prefilled email
  const lsBasicUrl = LS_BASIC_CHECKOUT
    ? `${LS_BASIC_CHECKOUT}?checkout[email]=${encodeURIComponent(userEmail)}`
    : "";
  const lsProUrl = LS_PRO_CHECKOUT
    ? `${LS_PRO_CHECKOUT}?checkout[email]=${encodeURIComponent(userEmail)}`
    : "";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-popover p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-1 text-center text-lg font-semibold">
          {t("title")}
        </h2>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          {t("subtitle")}
        </p>

        {/* Region tabs */}
        <div className="mb-4 flex rounded-lg border border-border p-0.5">
          <button
            onClick={() => setTab("cn")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "cn"
                ? "bg-purple-500/15 text-purple-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("domestic")}
          </button>
          <button
            onClick={() => setTab("intl")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "intl"
                ? "bg-purple-500/15 text-purple-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("international")}
          </button>
        </div>

        {/* Pricing cards */}
        <div className="space-y-3">
          {/* Free Plan */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">Free</h3>
              <span className="text-lg font-bold">
                ¥0
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>✓ {t("freeMsg")}</li>
              <li>✓ {t("freeModel")}</li>
            </ul>
          </div>

          {/* Basic Plan */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">Basic</h3>
              <span className="text-lg font-bold">
                ¥29.9
                <span className="text-sm font-normal text-muted-foreground">
                  /{t("month")}
                </span>
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>✓ {t("basicMsg")}</li>
              <li>✓ {t("basicModel")}</li>
              <li>✓ {t("allTutors")}</li>
            </ul>
            {tab === "cn" ? (
              <a
                href={AFDIAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block w-full rounded-lg border border-purple-500/30 px-4 py-2 text-center text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/10"
              >
                {t("buyAfdian")}
              </a>
            ) : (
              <a
                href={lsBasicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block w-full rounded-lg border border-purple-500/30 px-4 py-2 text-center text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/10"
              >
                {t("buyCard")}
              </a>
            )}
          </div>

          {/* Pro Plan */}
          <div className="rounded-lg border-2 border-purple-500/40 p-4">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Pro</h3>
                <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
                  {t("popular")}
                </span>
              </div>
              <span className="text-lg font-bold">
                ¥99.9
                <span className="text-sm font-normal text-muted-foreground">
                  /{t("month")}
                </span>
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>✓ {t("proMsg")}</li>
              <li>✓ {t("proModel")}</li>
              <li>✓ {t("allTutors")}</li>
              <li>✓ {t("priority")}</li>
            </ul>
            {tab === "cn" ? (
              <a
                href={AFDIAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block w-full rounded-lg bg-purple-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-purple-700"
              >
                {t("buyAfdian")}
              </a>
            ) : (
              <a
                href={lsProUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block w-full rounded-lg bg-purple-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-purple-700"
              >
                {t("buyCard")}
              </a>
            )}
          </div>
        </div>

        {/* Note about afdian email */}
        {tab === "cn" && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t("afdianNote", { email: userEmail })}
          </p>
        )}

        {/* Current plan info */}
        <div className="mt-4 rounded-lg bg-muted/50 p-3 text-center text-xs text-muted-foreground">
          {t("currentPlan")}
        </div>
      </div>
    </div>
  );
}

export function PricingModal({ onClose }: PricingModalProps) {
  return createPortal(
    <PricingModalContent onClose={onClose} />,
    document.body
  );
}

export function UpgradeButton() {
  const [showPricing, setShowPricing] = useState(false);
  const t = useTranslations("pricing");

  return (
    <>
      <button
        onClick={() => setShowPricing(true)}
        className="rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1.5 text-sm font-medium text-purple-400 transition-all hover:from-purple-500/30 hover:to-pink-500/30"
      >
        {t("upgrade")}
      </button>
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </>
  );
}
