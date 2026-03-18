"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useState, useRef, useEffect } from "react";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  zh: "中",
  ja: "日",
};

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as "en" | "zh" | "ja" });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {LOCALE_LABELS[locale] || "EN"}
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-28 rounded-lg border border-border bg-popover p-1 shadow-lg">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-accent ${
                locale === loc ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              <span className="font-mono">{LOCALE_LABELS[loc]}</span>
              <span>{LOCALE_NAMES[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
