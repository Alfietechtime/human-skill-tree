"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { SkillTreeCanvas } from "@/components/skill-tree/skill-tree-canvas";
import { SkillListView } from "@/components/skill-tree/skill-list-view";
import { ReviewReminder } from "@/components/review-reminder";
import { StreakBar } from "@/components/ui/streak-bar";
import { getAllSkills } from "@/lib/skills";
import { PHASES } from "@/lib/constants";
import { useRouter } from "@/i18n/navigation";

export default function TreePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("tree");
  const locale = useLocale();
  const router = useRouter();

  const skills = getAllSkills(locale);
  const filteredSkills = searchQuery
    ? skills.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-background">
        <div className="p-4 space-y-3">
          <StreakBar />
          <ReviewReminder />
        </div>
        {/* Mobile search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {filteredSkills.map((skill) => (
                  <button
                    key={skill.slug}
                    onClick={() => router.push(`/skill/${skill.slug}`)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <span>{PHASES[skill.phase]?.emoji}</span>
                    <span>{skill.title}</span>
                  </button>
                ))}
                {filteredSkills.length === 0 && (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No skills found</p>
                )}
              </div>
            </div>
          )}
        </div>
        <SkillListView />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-64px)]">
      <SkillTreeCanvas />
      <div className="absolute top-4 left-4 z-10">
        <StreakBar />
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
        <ReviewReminder />
      </div>
      {/* Search */}
      <div className="absolute top-4 right-4 z-10">
        {searchOpen ? (
          <div className="w-72 rounded-xl border border-border bg-card shadow-lg">
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-t-xl border-b border-border bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              onKeyDown={(e) => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }}}
            />
            <div className="max-h-60 overflow-y-auto">
              {filteredSkills.map((skill) => (
                <button
                  key={skill.slug}
                  onClick={() => router.push(`/skill/${skill.slug}`)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <span>{PHASES[skill.phase]?.emoji}</span>
                  <span>{skill.title}</span>
                </button>
              ))}
              {filteredSkills.length === 0 && searchQuery && (
                <p className="px-4 py-3 text-sm text-muted-foreground">No skills found</p>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="rounded-lg border border-border bg-card/80 backdrop-blur-sm p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
