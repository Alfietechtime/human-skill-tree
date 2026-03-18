import { Skill } from "@/types/skill";
import { zhTranslations } from "./zh";
import { jaTranslations } from "./ja";

type SkillTranslation = Omit<Skill, "slug" | "phase">;
type TranslationMap = Record<string, SkillTranslation>;

const translationsByLocale: Record<string, TranslationMap> = {
  zh: zhTranslations,
  ja: jaTranslations,
};

export function applyTranslations(
  skills: Skill[],
  locale: string
): Skill[] {
  if (locale === "en") return skills;

  const translations = translationsByLocale[locale];
  if (!translations) return skills;

  return skills.map((skill) => {
    const t = translations[skill.slug];
    if (!t) return skill;
    return { ...skill, ...t };
  });
}

export function applyTranslation(
  skill: Skill,
  locale: string
): Skill {
  if (locale === "en") return skill;

  const translations = translationsByLocale[locale];
  if (!translations) return skill;

  const t = translations[skill.slug];
  if (!t) return skill;
  return { ...skill, ...t };
}
