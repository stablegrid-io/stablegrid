import type { Metadata } from 'next';
import { ComingSoonCategoryLandingPage } from '@/components/practice/landing/ComingSoonCategoryLandingPage';
import { getComingSoonCategory } from '@/lib/landing/comingSoonCategories';

const TITLE = 'Math & Statistics Practice — The math under the metrics';
const DESCRIPTION =
  'Descriptive stats, distributions, sampling, regression, time series, big-data math. Statistical reasoning for data engineers — coming to the StableGrid catalogue soon.';
const URL = 'https://stablegrid.io/practice/math-statistics/landing';
const CANONICAL = '/practice/math-statistics/landing';

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
    title: 'Math & Statistics Practice — StableGrid',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Math & Statistics Practice — StableGrid',
    description: DESCRIPTION,
  },
};

export default function Page() {
  return (
    <ComingSoonCategoryLandingPage
      category={getComingSoonCategory('math-statistics')}
    />
  );
}
