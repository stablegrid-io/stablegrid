import type { Metadata } from 'next';
import { LandingPage } from '@/components/home/LandingPage';
import { FaqJsonLd } from '@/lib/seo/jsonLd';
import { LANDING_FAQS } from '@/lib/landing/faqs';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'x-default': '/',
    },
  },
};

export default function RootPage() {
  return (
    <>
      <FaqJsonLd items={LANDING_FAQS} />
      <LandingPage />
    </>
  );
}
