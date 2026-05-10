import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getPracticeSet } from '@/data/operations/practice-sets';
import { PracticeSetSession } from '@/app/operations/practice/[topic]/[level]/[modulePrefix]/PracticeSetViewer';

const VALID_LEVELS = new Set(['junior', 'mid', 'senior']);

interface FundamentalsLevelPageProps {
  params: { level: string };
  searchParams?: { practice?: string | string[] };
}

export default function FundamentalsLevelPage({
  params,
  searchParams
}: FundamentalsLevelPageProps) {
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

  if (!requestedPractice) {
    redirect('/practice/fundamentals');
  }

  const modulePrefix = requestedPractice.replace(/^module-/, '');
  const practiceSet = getPracticeSet('pyspark', modulePrefix);
  if (!practiceSet) {
    notFound();
  }

  if (practiceSet.metadata.trackLevel.toLowerCase() !== level) {
    redirect(
      `/practice/fundamentals/${practiceSet.metadata.trackLevel.toLowerCase()}?practice=${requestedPractice}`
    );
  }

  return <PracticeSetSession practiceSet={practiceSet} />;
}

export function generateStaticParams() {
  return Array.from(VALID_LEVELS).map((level) => ({ level }));
}

export const metadata: Metadata = {
  title: 'Fundamentals Practice — StableGrid',
  description: 'Fundamentals practice session.',
  robots: { index: false, follow: false }
};
