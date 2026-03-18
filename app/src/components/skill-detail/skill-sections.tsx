"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { Skill } from "@/types/skill";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SECTIONS: { key: keyof Skill; i18nKey: string }[] = [
  { key: "methodology", i18nKey: "methodology" },
  { key: "instructions", i18nKey: "instructions" },
  { key: "triggers", i18nKey: "triggers" },
  { key: "examples", i18nKey: "examples" },
  { key: "references", i18nKey: "references" },
];

export function SkillSections({ skill }: { skill: Skill }) {
  const t = useTranslations("skill");
  const available = SECTIONS.filter((s) => skill[s.key]);

  if (available.length === 0) return null;

  return (
    <Tabs defaultValue={available[0].key} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto bg-card border border-border" data-onboarding="skill-tabs">
        {available.map((s) => (
          <TabsTrigger
            key={s.key}
            value={s.key}
            className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-accent"
          >
            {t(s.i18nKey)}
          </TabsTrigger>
        ))}
      </TabsList>
      {available.map((s) => (
        <TabsContent key={s.key} value={s.key} className="mt-4">
          <div className="prose dark:prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-code:text-purple-500 dark:prose-code:text-purple-400 prose-a:text-blue-500 dark:prose-a:text-blue-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {skill[s.key] as string}
            </ReactMarkdown>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
