import { notFound } from "next/navigation";
import { getSkillBySlug, getAllSlugs } from "@/lib/skills";
import { ChatContainer } from "@/components/chat/chat-container";
import { ChatErrorBoundary } from "@/components/chat/chat-error-boundary";

export function generateStaticParams() {
  const slugs = getAllSlugs();
  const locales = ["en", "zh", "ja"];
  return slugs.flatMap((slug) =>
    locales.map((locale) => ({ slug, locale }))
  );
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const skill = getSkillBySlug(slug, locale);
  if (!skill) notFound();

  return (
    <ChatErrorBoundary>
      <ChatContainer skill={skill} />
    </ChatErrorBoundary>
  );
}
