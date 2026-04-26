import type { Metadata } from 'next';
import { LandingPage } from '@/components/home/LandingPage';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function RootPage() {
  return <LandingPage />;
}
