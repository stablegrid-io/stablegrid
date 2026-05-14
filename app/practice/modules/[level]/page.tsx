import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getPracticeSet } from '@/data/operations/practice-sets';
import { PracticeSetSession } from '@/app/operations/practice/[topic]/[level]/[modulePrefix]/PracticeSetViewer';

const VALID_LEVELS = new Set(['junior', 'mid', 'senior']);

// Some practice-set metadata uses historical `mid-level` / `junior-level`
// suffixes (see PM*_Practice.json). Strip the trailing `-level` so the
// redirect target matches a slug `/practice/modules/[level]` actually
// accepts. Without this, mid-tier modules 404'd through the redirect.
const normalizeTrackLevel = (raw: string | undefined): string | null => {
  if (!raw) return null;
  const normalized = raw.toLowerCase().replace(/-level$/, '');
  return VALID_LEVELS.has(normalized) ? normalized : null;
};

interface PracticeLevelPageProps {
  params: { level: string };
  searchParams?: { practice?: string | string[] };
}

export default function PracticeLevelPage({
  params,
  searchParams
}: PracticeLevelPageProps) {
  // Inbound level — accept canonical (`mid`) and historical (`mid-level`)
  // shapes alike. If a stale link sends users to `mid-level`, redirect them
  // to the canonical slug instead of 404ing.
  const rawLevel = params.level.toLowerCase();
  const normalizedInbound = normalizeTrackLevel(rawLevel);
  if (!normalizedInbound) {
    notFound();
  }
  if (normalizedInbound !== rawLevel) {
    const query = searchParams?.practice
      ? `?practice=${
          typeof searchParams.practice === 'string'
            ? searchParams.practice
            : searchParams.practice[0]
        }`
      : '';
    redirect(`/practice/modules/${normalizedInbound}${query}`);
  }
  const level = normalizedInbound;

  const requestedPractice =
    typeof searchParams?.practice === 'string'
      ? searchParams.practice
      : Array.isArray(searchParams?.practice)
        ? searchParams!.practice[0]
        : null;

  // No ?practice= query — bounce back to the editorial track listing.
  if (!requestedPractice) {
    redirect('/practice/modules');
  }

  const modulePrefix = requestedPractice.replace(/^module-/, '');
  const practiceSet = getPracticeSet('pyspark', modulePrefix);
  if (!practiceSet) {
    notFound();
  }

  const canonicalLevel = normalizeTrackLevel(practiceSet.metadata.trackLevel);
  if (!canonicalLevel) {
    notFound();
  }
  if (canonicalLevel !== level) {
    redirect(
      `/practice/modules/${canonicalLevel}?practice=${requestedPractice}`
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
