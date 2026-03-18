import { notFound } from "next/navigation";
import { getSkillBySlug, getAllSlugs } from "@/lib/skills";
import { SkillHeader } from "@/components/skill-detail/skill-header";
import { SkillSections } from "@/components/skill-detail/skill-sections";
import { StartLearningButton } from "@/components/skill-detail/start-learning-button";
import { BackToTreeLink } from "@/components/skill-detail/back-to-tree-link";

export function generateStaticParams() {
  const slugs = getAllSlugs();
  const locales = ["en", "zh", "ja"];
  return slugs.flatMap((slug) =>
    locales.map((locale) => ({ slug, locale }))
  );
}

export default async function SkillPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const skill = getSkillBySlug(slug, locale);
  if (!skill) notFound();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        <BackToTreeLink />
        <SkillHeader skill={skill} />
        <StartLearningButton slug={slug} />
        <SkillSections skill={skill} />
      </div>
    </div>
  );
}
