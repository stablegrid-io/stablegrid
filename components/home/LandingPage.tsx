import { LandingNav } from '@/components/home/landing/LandingNav';
import { HeroSection } from '@/components/home/landing/HeroSection';
import { FeaturesSection } from '@/components/home/landing/FeaturesSection';
import { TopicsSection } from '@/components/home/landing/TopicsSection';
import { HowItWorksSection } from '@/components/home/landing/HowItWorksSection';
import { PricingSection } from '@/components/home/landing/PricingSection';
import { CTASection } from '@/components/home/landing/CTASection';
import { LandingFooter } from '@/components/home/landing/LandingFooter';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#09111e] text-[#d8eaf8]">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TopicsSection />
        <HowItWorksSection />
        <PricingSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
};
