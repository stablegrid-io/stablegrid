import type { Metadata } from 'next';
import { ComingSoonCategoryLandingPage } from '@/components/practice/landing/ComingSoonCategoryLandingPage';
import { getComingSoonCategory } from '@/lib/landing/comingSoonCategories';

const TITLE = 'Computer Science Practice — Foundations under the framework';
const DESCRIPTION =
  'Data structures, algorithms, complexity, distributed systems, concurrency, memory, networking. The foundations under every pipeline you ship — coming to the StableGrid catalogue soon.';
const URL = 'https://stablegrid.io/practice/computer-science/landing';
const CANONICAL = '/practice/computer-science/landing';

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
    title: 'Computer Science Practice — StableGrid',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Computer Science Practice — StableGrid',
    description: DESCRIPTION,
  },
};

export default function Page() {
  return (
    <ComingSoonCategoryLandingPage
      category={getComingSoonCategory('computer-science')}
    />
  );
}
