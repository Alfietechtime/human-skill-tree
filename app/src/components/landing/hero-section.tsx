"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-20 pb-12 text-center overflow-hidden">
      {/* Ambient glow background */}
      <div className="pointer-events-none absolute top-[-20%] left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-purple-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-pink-500/8 blur-[100px]" />
      <div className="pointer-events-none absolute top-[10%] right-[20%] h-[300px] w-[300px] rounded-full bg-orange-500/8 blur-[100px]" />

      {/* Badge */}
      <div className="relative mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-600 dark:text-purple-300 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
        </span>
        {t("badge")}
      </div>

      <h1 className="relative max-w-4xl text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">
        {t("heroTitle")}{" "}
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent animate-[gradient_6s_ease_infinite] bg-[length:200%_auto]">
          {t("heroHighlight")}
        </span>
      </h1>
      <p className="relative mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        {t("heroSubtitle")}
      </p>
      <div className="relative mt-10 flex gap-4">
        <Link href="/tree" data-onboarding="explore-cta">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:scale-105 text-base px-8 py-6"
          >
            <svg className="h-5 w-5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22" />
              <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
              <path d="M8.56 13a8 8 0 0 0-2.3 3.5" />
              <path d="M15.44 13a8 8 0 0 1 2.3 3.5" />
            </svg>
            {t("exploreCTA")}
          </Button>
        </Link>
        <a
          href="https://github.com/24kchengYe/human-skill-tree-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            size="lg"
            variant="outline"
            className="border-border text-muted-foreground hover:bg-accent hover:border-border transition-all hover:scale-105"
          >
            GitHub
          </Button>
        </a>
      </div>
    </section>
  );
}
