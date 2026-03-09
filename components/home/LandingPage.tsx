import { LandingNav } from '@/components/home/landing/LandingNav';
import { GridFlowSection } from '@/components/home/landing/GridFlowSection';
import { LandingFooter } from '@/components/home/landing/LandingFooter';
import { LandingArrivalExperience } from '@/components/home/landing/LandingArrivalExperience';

export const LandingPage = () => {
  return (
    <div className="relative min-h-screen bg-[#090b0a] text-[#e3efe8]">
      <LandingNav />
      <LandingArrivalExperience>
        <main>
          <GridFlowSection />
        </main>
        <LandingFooter />
      </LandingArrivalExperience>
    </div>
  );
};
