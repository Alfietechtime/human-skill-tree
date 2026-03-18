"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getDueReviews, reviewKnowledgePoint, earnXP, XP_REWARDS, type KnowledgePoint } from "@/lib/learning-tracker";
import { getAllSkills } from "@/lib/skills";
import { useLocale } from "next-intl";

interface DueItem {
  slug: string;
  skillTitle: string;
  kp: KnowledgePoint;
}

export function ReviewReminder() {
  const t = useTranslations("review");
  const locale = useLocale();
  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const reviews = getDueReviews();
    if (reviews.length === 0) return;

    const skills = getAllSkills(locale);
    const items = reviews.map((r) => ({
      slug: r.slug,
      skillTitle: skills.find((s) => s.slug === r.slug)?.title || r.slug,
      kp: r.kp,
    }));
    setDueItems(items);
  }, [locale]);

  if (dismissed || dueItems.length === 0) return null;

  const current = dueItems[currentIndex];
  if (!current) return null;

  const handleReview = (remembered: boolean) => {
    reviewKnowledgePoint(current.slug, current.kp.id, remembered);
    earnXP(XP_REWARDS.review, "review");
    setShowAnswer(false);
    if (currentIndex < dueItems.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setDismissed(true);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-400">
            {dueItems.length} {t("dueCount")}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("later")}
        </button>
      </div>

      <div className="rounded-lg bg-card border border-border p-3">
        <p className="text-[10px] text-muted-foreground mb-1">
          {current.skillTitle} · {currentIndex + 1}/{dueItems.length}
        </p>
        <p className="text-sm text-foreground font-medium">{current.kp.content}</p>

        {!showAnswer ? (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowAnswer(true)}
              className="flex-1 rounded-lg bg-purple-600 py-1.5 text-xs text-white hover:bg-purple-700 transition-colors"
            >
              {t("showDetails")}
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">{t("remembered")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleReview(false)}
                className="flex-1 rounded-lg border border-border py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
              >
                {t("forgot")}
              </button>
              <button
                onClick={() => handleReview(true)}
                className="flex-1 rounded-lg bg-green-600 py-1.5 text-xs text-white hover:bg-green-700 transition-colors"
              >
                {t("gotIt")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 text-center">
        <Link
          href={`/chat/${current.slug}`}
          className="text-[10px] text-purple-400 hover:text-purple-300"
        >
          {t("goToSkill")}
        </Link>
      </div>
    </div>
  );
}
