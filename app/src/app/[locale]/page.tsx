import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-purple-600/[0.05] via-transparent to-transparent dark:from-purple-900/[0.07]" />
      <div className="relative z-10">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <Footer />
      </div>
    </div>
  );
}
