"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "./auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

export function ProfileSetupDialog() {
  const { user, loading } = useAuth();
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("profile");

  useEffect(() => {
    if (loading || !user) return;

    // Check if user has set a custom username
    const checkProfile = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        // If username is just the email prefix or empty, prompt setup
        const emailPrefix = user.email?.split("@")[0] || "";
        const oauthName =
          user.user_metadata?.user_name ||
          user.user_metadata?.full_name ||
          "";
        const currentUsername = data?.username || "";

        if (
          !currentUsername ||
          currentUsername === emailPrefix ||
          currentUsername === oauthName
        ) {
          // Check if user already dismissed this dialog
          const dismissed = localStorage.getItem("profile-setup-dismissed");
          if (!dismissed) {
            setUsername(currentUsername || oauthName || emailPrefix);
            setShow(true);
          }
        }
      } catch {
        // Ignore
      }
    };

    checkProfile();
  }, [user, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !username.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username: username.trim() })
        .eq("id", user.id);

      if (updateError) throw updateError;
      setShow(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("profile-setup-dismissed", "1");
    setShow(false);
  };

  if (!show) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleSkip()}
    >
      <div className="relative mx-4 w-full max-w-sm rounded-xl border border-border bg-popover p-6 shadow-2xl">
        <h2 className="mb-1 text-center text-lg font-semibold">
          {t("welcomeTitle")}
        </h2>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          {t("welcomeDesc")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {t("usernameLabel")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("usernamePlaceholder")}
              maxLength={30}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !username.trim()}
            className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? t("saving") : t("save")}
          </button>
        </form>

        <button
          onClick={handleSkip}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {t("skipForNow")}
        </button>
      </div>
    </div>,
    document.body
  );
}
