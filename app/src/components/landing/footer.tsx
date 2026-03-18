"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("landing");

  return (
    <footer className="border-t border-border/50 py-8 text-center">
      <p className="text-sm text-muted-foreground">
        {t("footerBuiltWith")} &bull;{" "}
        <a
          href="https://www.gnu.org/licenses/agpl-3.0.en.html"
          className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("footerLicense")}
        </a>{" "}
        &bull;{" "}
        <a
          href="https://github.com/24kchengYe/human-skill-tree-app"
          className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </p>
    </footer>
  );
}
