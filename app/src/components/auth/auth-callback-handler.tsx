"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";

/**
 * Handles auth callback query params:
 * - ?auth=confirmed → show email confirmed toast
 * - ?auth=recovery → show password reset modal
 */
export function AuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("auth");
  const authType = searchParams.get("auth");
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authType) return;

    if (authType === "confirmed") {
      showToast({ message: t("emailConfirmed"), emoji: "✅", duration: 6000 });
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      router.replace(url.pathname + url.search, { scroll: false });
    } else if (authType === "recovery") {
      setShowResetModal(true);
    }
  }, [authType, t, router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setMessage(t("passwordUpdated"));
      // Clean up URL and close modal after delay
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      router.replace(url.pathname + url.search, { scroll: false });
      setTimeout(() => setShowResetModal(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSubmitting(false);
    }
  };

  if (!showResetModal) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowResetModal(false);
          const url = new URL(window.location.href);
          url.searchParams.delete("auth");
          router.replace(url.pathname + url.search, { scroll: false });
        }
      }}
    >
      <div className="relative mx-4 w-full max-w-sm rounded-xl border border-border bg-popover p-6 shadow-2xl">
        <h2 className="mb-4 text-center text-lg font-semibold">
          {t("resetPassword")}
        </h2>
        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("newPassword")}
            required
            minLength={6}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          {message && <p className="text-xs text-green-400">{message}</p>}
          <button
            type="submit"
            disabled={submitting || !!message}
            className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? t("submitting") : t("updatePassword")}
          </button>
        </form>
        <button
          onClick={() => {
            setShowResetModal(false);
            const url = new URL(window.location.href);
            url.searchParams.delete("auth");
            router.replace(url.pathname + url.search, { scroll: false });
          }}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
