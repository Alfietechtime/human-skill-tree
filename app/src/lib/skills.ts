import { skills } from "./skills-data";
import { Skill } from "@/types/skill";
import { applyTranslations, applyTranslation } from "./skills-i18n";

export function getAllSkills(locale: string = "en"): Skill[] {
  return applyTranslations(skills, locale);
}

export function getSkillBySlug(
  slug: string,
  locale: string = "en"
): Skill | undefined {
  const skill = skills.find((s) => s.slug === slug);
  if (!skill) return undefined;
  return applyTranslation(skill, locale);
}

export function getSkillsByPhase(
  phase: number,
  locale: string = "en"
): Skill[] {
  const filtered = skills.filter((s) => s.phase === phase);
  return applyTranslations(filtered, locale);
}

export function getAllSlugs(): string[] {
  return skills.map((s) => s.slug);
}
