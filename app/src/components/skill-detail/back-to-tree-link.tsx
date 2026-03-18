"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function BackToTreeLink() {
  const t = useTranslations("skill");

  return (
    <Link
      href="/tree"
      className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {t("backToTree")}
    </Link>
  );
}
