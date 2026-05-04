import type { Metadata } from 'next';
import { ComingSoonCategoryLandingPage } from '@/components/practice/landing/ComingSoonCategoryLandingPage';
import { getComingSoonCategory } from '@/lib/landing/comingSoonCategories';

const TITLE = 'Logic Practice — Reason like a query planner';
const DESCRIPTION =
  'Predicate logic, set reasoning, pattern recognition, structural deduction. The thinking muscle behind every join, filter, and assertion you write — coming to the StableGrid catalogue soon.';
const URL = 'https://stablegrid.io/practice/logic/landing';
const CANONICAL = '/practice/logic/landing';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: CANONICAL,
    languages: {
      'en-US': CANONICAL,
      'x-default': CANONICAL,
    },
  },
  openGraph: {
    type: 'website',
    url: URL,
    siteName: 'StableGrid',
    title: 'Logic Practice — StableGrid',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Logic Practice — StableGrid',
    description: DESCRIPTION,
  },
};

export default function Page() {
  return (
    <ComingSoonCategoryLandingPage
      category={getComingSoonCategory('logic')}
    />
  );
}
