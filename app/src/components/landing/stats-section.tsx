"use client";

import { useTranslations } from "next-intl";

const stats = [
  { value: "33", key: "statSkills", gradient: "from-purple-400 to-violet-400" },
  { value: "7", key: "statPhases", gradient: "from-blue-400 to-cyan-400" },
  { value: "800+", key: "statDisciplines", gradient: "from-emerald-400 to-teal-400" },
  { value: "100%", key: "statOpenSource", gradient: "from-orange-400 to-amber-400" },
];

export function StatsSection() {
  const t = useTranslations("landing");

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.key}
            className="group rounded-xl border border-border/30 bg-card/50 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:bg-card/80"
          >
            <p className={`text-4xl font-extrabold bg-gradient-to-br ${s.gradient} bg-clip-text text-transparent`}>
              {s.value}
            </p>
            <p className="mt-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t(s.key)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
