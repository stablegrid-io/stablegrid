import { LandingNav } from '@/components/home/landing/LandingNav';
import { GridFlowSection } from '@/components/home/landing/GridFlowSection';
import { LandingFooter } from '@/components/home/landing/LandingFooter';

export const LandingPage = () => {
  return (
    <div className="relative min-h-screen bg-black text-[#e3efe8]">
      <LandingNav />
      <main>
        <GridFlowSection />
      </main>
      <LandingFooter />
    </div>
  );
};
