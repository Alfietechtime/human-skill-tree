"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function StartLearningButton({ slug }: { slug: string }) {
  const t = useTranslations("skill");

  return (
    <Link href={`/chat/${slug}`} data-onboarding="start-learning">
      <Button size="lg" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white">
        {t("startLearning")}
      </Button>
    </Link>
  );
}
