import type { Metadata } from 'next';
import { CodingPracticeLandingPage } from '@/components/practice/landing/CodingPracticeLandingPage';

const TITLE = 'Coding Practice — Drill the rep on real production scenarios';
const DESCRIPTION =
  'PySpark and pandas drills against fictional power-grid datasets. Joins, aggregations, memory & skew, plan reading from Junior to Senior. Server-graded answers, deep-link back into the lesson when you miss.';
const URL = 'https://stablegrid.io/practice/coding/landing';
const CANONICAL = '/practice/coding/landing';

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
    title: 'Coding Practice — StableGrid',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coding Practice — StableGrid',
    description: DESCRIPTION,
  },
};

export default function Page() {
  return <CodingPracticeLandingPage />;
}
