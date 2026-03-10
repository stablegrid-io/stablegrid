import { LandingNav } from '@/components/home/landing/LandingNav';
import { GridFlowSection } from '@/components/home/landing/GridFlowSection';
import { CoursesGallerySection } from '@/components/home/landing/CoursesGallerySection';
import { LandingFooter } from '@/components/home/landing/LandingFooter';

export const LandingPage = () => {
  return (
    <div className="relative min-h-screen bg-[#090b0a] text-[#e3efe8]">
      <LandingNav />
      <main>
        <GridFlowSection />
        <CoursesGallerySection />
      </main>
      <LandingFooter />
    </div>
  );
};
