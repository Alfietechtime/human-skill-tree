"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "./auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { PricingModal } from "@/components/pricing-modal";

export function LoginButton() {
  const { user, loading, isAdmin, planInfo, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("auth");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide login button if Supabase is not configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    );
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowLoginModal(true)}
          className="rounded-lg bg-purple-500/15 px-3 py-1.5 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/25"
        >
          {t("login")}
        </button>
        {showLoginModal &&
          createPortal(
            <LoginModal onClose={() => setShowLoginModal(false)} />,
            document.body
          )}
      </>
    );
  }

  const avatar = user.user_metadata?.avatar_url;
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.user_name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted"
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-7 w-7 rounded-full"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-xs font-medium text-purple-400">
            {name[0].toUpperCase()}
          </div>
        )}
        <span className="hidden text-sm sm:inline">{name}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg">
          <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
            <div>{user.email}</div>
            <div className="mt-1 flex items-center gap-1.5">
              {isAdmin ? (
                <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
                  Admin · Unlimited
                </span>
              ) : planInfo ? (
                <>
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                    {planInfo.plan === "free" ? "Free" : planInfo.plan === "basic" ? "Basic" : "Pro"}
                  </span>
                  <span className="text-[10px]">
                    {planInfo.dailyLimit === Infinity
                      ? "∞"
                      : `${planInfo.todayUsed}/${planInfo.dailyLimit}`}{" "}
                    {t("todayUsage")}
                  </span>
                </>
              ) : null}
            </div>
          </div>
          {!isAdmin && (
            <button
              onClick={() => {
                setShowPricing(true);
                setShowMenu(false);
              }}
              className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-purple-400 transition-colors hover:bg-purple-500/10"
            >
              ⚡ {t("upgrade")}
            </button>
          )}
          <button
            onClick={() => {
              signOut();
              setShowMenu(false);
            }}
            className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t("logout")}
          </button>
        </div>
      )}
      {showPricing && (
        <PricingModal onClose={() => setShowPricing(false)} />
      )}
    </div>
  );
}

type ModalView = "login" | "signup" | "forgot" | "resetSent" | "signupSent";

function LoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState<ModalView>("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslations("auth");
  const supabase = createClient();

  const handleOAuth = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${window.location.pathname}`,
      },
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (view === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });
        if (error) throw error;
        setView("signupSent");
      } else if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/&type=recovery`,
        });
        if (error) throw error;
        setView("resetSent");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
      setMessage(t("resendSuccess"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setSubmitting(false);
    }
  };

  const switchView = (v: ModalView) => {
    setView(v);
    setError("");
    setMessage("");
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ margin: 0, padding: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative mx-4 w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-popover p-6 shadow-2xl" style={{ marginTop: 0 }}>
        <h2 className="mb-4 text-center text-lg font-semibold">
          {view === "forgot" || view === "resetSent"
            ? t("resetPassword")
            : view === "signup" || view === "signupSent"
              ? t("signUp")
              : t("login")}
        </h2>

        {/* Signup sent confirmation screen */}
        {view === "signupSent" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-3xl">
              📧
            </div>
            <p className="text-sm text-foreground">{t("checkEmail")}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {message && <p className="text-xs text-green-400">{message}</p>}
            <button
              onClick={handleResendConfirmation}
              disabled={submitting}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {t("resendEmail")}
            </button>
            <button
              onClick={() => switchView("login")}
              className="text-xs text-purple-400 hover:underline"
            >
              {t("login")}
            </button>
          </div>
        )}

        {/* Reset password sent confirmation screen */}
        {view === "resetSent" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-3xl">
              📧
            </div>
            <p className="text-sm text-foreground">{t("resetEmailSent")}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            <button
              onClick={() => switchView("login")}
              className="text-xs text-purple-400 hover:underline"
            >
              {t("login")}
            </button>
          </div>
        )}

        {/* Main forms: login / signup / forgot */}
        {(view === "login" || view === "signup" || view === "forgot") && (
          <>
            {/* OAuth buttons (only for login/signup) */}
            {view !== "forgot" && (
              <>
                <div className="space-y-2">
                  <button
                    onClick={() => handleOAuth("google")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t("continueWithGoogle")}
                  </button>
                  <button
                    onClick={() => handleOAuth("github")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    {t("continueWithGitHub")}
                  </button>
                </div>
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{t("or")}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25"
              />
              {view !== "forgot" && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25"
                />
              )}
              {error && <p className="text-xs text-red-400">{error}</p>}
              {message && <p className="text-xs text-green-400">{message}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
              >
                {submitting
                  ? t("submitting")
                  : view === "signup"
                    ? t("signUp")
                    : view === "forgot"
                      ? t("resetPassword")
                      : t("loginWithEmail")}
              </button>
            </form>

            {/* Forgot password link (login view only) */}
            {view === "login" && (
              <p className="mt-2 text-center">
                <button
                  onClick={() => switchView("forgot")}
                  className="text-xs text-muted-foreground hover:text-purple-400 hover:underline"
                >
                  {t("forgotPassword")}
                </button>
              </p>
            )}

            {/* Toggle sign up / login */}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {view === "forgot" ? (
                <button
                  onClick={() => switchView("login")}
                  className="text-purple-400 hover:underline"
                >
                  {t("login")}
                </button>
              ) : view === "signup" ? (
                <>
                  {t("haveAccount")}{" "}
                  <button
                    onClick={() => switchView("login")}
                    className="text-purple-400 hover:underline"
                  >
                    {t("login")}
                  </button>
                </>
              ) : (
                <>
                  {t("noAccount")}{" "}
                  <button
                    onClick={() => switchView("signup")}
                    className="text-purple-400 hover:underline"
                  >
                    {t("signUp")}
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {/* Close */}
        <button
          onClick={onClose}
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
