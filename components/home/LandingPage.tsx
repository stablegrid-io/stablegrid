import { LandingNav } from '@/components/home/landing/LandingNav';
import { LazyGridFlowSection } from '@/components/home/landing/LazyGridFlowSection';
import { LandingFooter } from '@/components/home/landing/LandingFooter';

export const LandingPage = () => {
  return (
    <div className="relative min-h-screen bg-black text-[#e3efe8]">
      <LandingNav />
      <main>
        <LazyGridFlowSection />
      </main>
      <LandingFooter />
    </div>
  );
};
