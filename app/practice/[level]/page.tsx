import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getPracticeSet } from '@/data/operations/practice-sets';
import { PracticeSetSession } from '@/app/operations/practice/[topic]/[level]/[modulePrefix]/PracticeSetViewer';

const VALID_LEVELS = new Set(['junior', 'mid', 'senior']);

interface PracticeLevelPageProps {
  params: { level: string };
  searchParams?: { practice?: string | string[] };
}

export default function PracticeLevelPage({
  params,
  searchParams
}: PracticeLevelPageProps) {
  const level = params.level.toLowerCase();
  if (!VALID_LEVELS.has(level)) {
    notFound();
  }

  const requestedPractice =
    typeof searchParams?.practice === 'string'
      ? searchParams.practice
      : Array.isArray(searchParams?.practice)
        ? searchParams!.practice[0]
        : null;

  // No ?practice= query — bounce back to the editorial track listing.
  if (!requestedPractice) {
    redirect('/practice');
  }

  const modulePrefix = requestedPractice.replace(/^module-/, '');
  const practiceSet = getPracticeSet('pyspark', modulePrefix);
  if (!practiceSet) {
    notFound();
  }

  if (practiceSet.metadata.trackLevel.toLowerCase() !== level) {
    redirect(
      `/practice/${practiceSet.metadata.trackLevel.toLowerCase()}?practice=${requestedPractice}`
    );
  }

  return <PracticeSetSession practiceSet={practiceSet} />;
}

export function generateStaticParams() {
  return Array.from(VALID_LEVELS).map((level) => ({ level }));
}

export const metadata: Metadata = {
  title: 'Practice Session — StableGrid',
  description: 'Practice session.',
  robots: { index: false, follow: false }
};
