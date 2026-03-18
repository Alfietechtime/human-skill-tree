"use client";

import { useTranslations } from "next-intl";

const featureKeys = [
  { key: "Socratic", accent: "text-purple-400 bg-purple-500/10 group-hover:bg-purple-500/20", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
  { key: "Evidence", accent: "text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /><circle cx="12" cy="12" r="10" /></svg> },
  { key: "Personalized", accent: "text-pink-400 bg-pink-500/10 group-hover:bg-pink-500/20", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg> },
  { key: "Lifecycle", accent: "text-green-400 bg-green-500/10 group-hover:bg-green-500/20", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg> },
  { key: "Agnostic", accent: "text-orange-400 bg-orange-500/10 group-hover:bg-orange-500/20", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg> },
  { key: "OpenSource", accent: "text-teal-400 bg-teal-500/10 group-hover:bg-teal-500/20", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" /></svg> },
];

export function FeaturesSection() {
  const t = useTranslations("landing");

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
        {t("whyTitle")}
      </h2>
      <p className="mb-10 text-center text-sm text-muted-foreground">
        {t("whySubtitle")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureKeys.map((f) => (
          <div
            key={f.key}
            className="group rounded-xl border border-border/30 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:bg-card/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/[0.03]"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${f.accent}`}>
              {f.icon}
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              {t(`feature${f.key}`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(`feature${f.key}Desc`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
