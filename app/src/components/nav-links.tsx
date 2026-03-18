"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { HelpButton } from "./help-button";
import { LoginButton } from "./auth/login-button";

export function NavLinks() {
  const t = useTranslations("nav");

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href="/tree"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("skillTree")}
      </Link>
      <Link
        href="/leaderboard"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("leaderboard")}
      </Link>
      <a
        href="https://github.com/24kchengYe/human-skill-tree-app"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("github")}
      </a>
      <div className="h-4 w-px bg-border" />
      <ThemeToggle />
      <LanguageSwitcher />
      <HelpButton />
      <div className="h-4 w-px bg-border" />
      <LoginButton />
    </div>
  );
}
