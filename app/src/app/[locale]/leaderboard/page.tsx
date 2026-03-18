"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";

type LeaderboardEntry = {
  id: string;
  username: string;
  avatar_url: string;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const t = useTranslations("leaderboard");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const supabase = createClient();
        const result = await Promise.race([
          supabase.from("leaderboard").select("*").limit(100),
          new Promise<{ data: null }>((r) =>
            setTimeout(() => r({ data: null }), 5000)
          ),
        ]);
        setEntries(((result as { data: LeaderboardEntry[] | null }).data) ?? []);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/tree"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t("backToTree")}
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          <p className="text-lg">{t("empty")}</p>
          <p className="mt-1 text-sm">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const isMe = user?.id === entry.id;
            const rankEmoji =
              index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;

            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  isMe
                    ? "border-purple-500/40 bg-purple-500/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {/* Rank */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold text-muted-foreground">
                  {rankEmoji || `#${index + 1}`}
                </div>

                {/* Avatar */}
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt={entry.username}
                    className="h-9 w-9 shrink-0 rounded-full"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-medium text-purple-400">
                    {(entry.username || "?")[0].toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {entry.username || "Anonymous"}
                    </span>
                    {isMe && (
                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
                        {t("you")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Lv.{entry.level} · {t("streak")} {entry.current_streak}{t("days")}
                  </div>
                </div>

                {/* XP */}
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold text-purple-400">
                    {entry.xp.toLocaleString()} XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
