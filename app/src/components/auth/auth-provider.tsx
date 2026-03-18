"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  downloadFromCloud,
  startSync,
  stopSync,
  uploadToCloud,
  clearLocalUserData,
} from "@/lib/supabase/sync";
import type { User, Session } from "@supabase/supabase-js";

type PlanInfo = {
  plan: string;
  dailyLimit: number;
  todayUsed: number;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  planInfo: PlanInfo | null;
  refreshPlan: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  planInfo: null,
  refreshPlan: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  const PLAN_LIMITS: Record<string, number> = {
    free: 10,
    basic: 100,
    pro: Infinity,
    admin: Infinity,
  };

  const fetchPlanInfo = async (userId: string, userEmail: string) => {
    try {
      const supabase = createClient();
      const isAdminUser = ADMIN_EMAILS.includes(userEmail.toLowerCase());

      if (isAdminUser) {
        setPlanInfo({ plan: "admin", dailyLimit: Infinity, todayUsed: 0 });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, plan_expires_at")
        .eq("id", userId)
        .single();

      let plan = profile?.plan || "free";
      if (
        plan !== "free" &&
        plan !== "admin" &&
        profile?.plan_expires_at &&
        new Date(profile.plan_expires_at) < new Date()
      ) {
        plan = "free";
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action", "message")
        .gte("created_at", today.toISOString());

      setPlanInfo({
        plan,
        dailyLimit: PLAN_LIMITS[plan] ?? 10,
        todayUsed: count ?? 0,
      });
    } catch {
      // Ignore errors
    }
  };

  const refreshPlan = async () => {
    if (user?.email) {
      await fetchPlanInfo(user.id, user.email);
    }
  };

  useEffect(() => {
    // Skip if Supabase is not configured
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Get initial session with timeout protection
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(timeout);
        setSession(session);
        setUser(session?.user ?? null);

        // If user is logged in, sync data and fetch plan
        if (session?.user) {
          await downloadFromCloud(session.user.id).catch(() => {});
          startSync(session.user.id);
          fetchPlanInfo(session.user.id, session.user.email || "");
        }

        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session?.user) {
        // Download cloud data and start syncing
        await downloadFromCloud(session.user.id);
        startSync(session.user.id);
        fetchPlanInfo(session.user.id, session.user.email || "");
      } else if (event === "SIGNED_OUT") {
        setPlanInfo(null);
        stopSync();
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodically refresh plan info (catches webhook updates after payment)
  // Also refresh when tab becomes visible (user returns from payment page)
  useEffect(() => {
    if (!user?.email) return;

    const doRefresh = () => fetchPlanInfo(user.id, user.email || "");

    // Refresh every 60 seconds
    const interval = setInterval(doRefresh, 60_000);

    // Refresh when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        doRefresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.id, user?.email]);

  const isAdmin =
    !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const signOut = async () => {
    // Clear state immediately so UI updates
    setUser(null);
    setSession(null);
    stopSync();
    clearLocalUserData();

    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      try {
        if (user) {
          await Promise.race([
            uploadToCloud(user.id),
            new Promise((r) => setTimeout(r, 3000)),
          ]);
        }
        const supabase = createClient();
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((r) => setTimeout(r, 3000)),
        ]);
      } catch {
        // Ignore errors, user is already logged out locally
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, planInfo, refreshPlan, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
