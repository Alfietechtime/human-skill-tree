import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { NavLinks } from "@/components/nav-links";
import { SpotlightGuide } from "@/components/onboarding/spotlight-guide";
import { ToastProvider } from "@/components/ui/toast";
import { ProfileSetupDialog } from "@/components/auth/profile-setup-dialog";
import { AuthCallbackHandler } from "@/components/auth/auth-callback-handler";
import { CnTipBanner } from "@/components/cn-tip-banner";
import { Suspense } from "react";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <NextIntlClientProvider>
      <CnTipBanner />
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/50 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
        <Link href={`/${locale}`} className="flex items-center gap-2.5 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-sm">
            🌳
          </span>
          <span className="hidden sm:inline">Human Skill Tree</span>
        </Link>
        <NavLinks />
      </nav>
      {children}
      <SpotlightGuide />
      <ProfileSetupDialog />
      <Suspense>
        <AuthCallbackHandler />
      </Suspense>
      <ToastProvider />
    </NextIntlClientProvider>
  );
}
