import type { Metadata } from 'next';
import { getPracticeSets, type PracticeSet } from '@/data/operations/practice-sets';
import { loadServerPracticeProgress } from '@/lib/practice/serverPracticeProgress';
import {
  PracticeTrackEditorial,
  type PracticeTrackSummary
} from '@/components/practice/PracticeTrackEditorial';

export const metadata: Metadata = {
  title: 'Fundamentals — StableGrid',
  description:
    'Recognition drills across the eight PySpark fundamentals — joins, plans, layout, memory, streaming, aggregations, manipulation, optimization.',
  alternates: { canonical: '/practice/fundamentals' },
  robots: { index: false, follow: false }
};

const FND_PATTERN = /^module-FND-/i;

const TIER_LABELS = {
  junior: { label: 'Junior', eyebrow: 'Recognition · Foundations' },
  mid: { label: 'Mid', eyebrow: 'Recognition · Production reads' },
  senior: { label: 'Senior', eyebrow: 'Recognition · Cross-team contracts' }
} as const;

const moduleOrderKey = (set: PracticeSet): string => {
  // Stable order by subject token after FND-, e.g. FND-AGGREGATIONS-SENIOR.
  const id = set.metadata.moduleId.toUpperCase();
  return id.replace(/^MODULE-FND-/, '').replace(/-(JUNIOR|MID|SENIOR)$/, '');
};

const filterByTier = (
  sets: PracticeSet[],
  level: keyof typeof TIER_LABELS
): PracticeSet[] =>
  sets
    .filter(
      (set) =>
        FND_PATTERN.test(set.metadata.moduleId) &&
        set.metadata.trackLevel?.toLowerCase() === level
    )
    .sort((a, b) => moduleOrderKey(a).localeCompare(moduleOrderKey(b)));

export default async function FundamentalsPage() {
  const allSets = getPracticeSets('pyspark');

  const tracks: PracticeTrackSummary[] = (
    Object.keys(TIER_LABELS) as Array<keyof typeof TIER_LABELS>
  ).map((slug) => ({
    slug,
    label: TIER_LABELS[slug].label,
    eyebrow: TIER_LABELS[slug].eyebrow,
    sets: filterByTier(allSets, slug)
  }));

  const moduleIds = tracks.flatMap((t) => t.sets.map((s) => s.metadata.moduleId));
  const { progressByModule } = await loadServerPracticeProgress(moduleIds);

  return (
    <PracticeTrackEditorial
      topic="pyspark"
      tracks={tracks}
      progressByModule={progressByModule}
      basePath="/practice/fundamentals"
      subtitle="Production traps spread across the eight fundamentals — joins, plans, layout, memory, streaming, aggregations, manipulation, optimization. Read each scenario, spot what's wrong, defend the answer; by the end you recognize the failure mode before the cluster does. Most outages at scale aren't novel bugs — they're the same handful of patterns nobody bothered to learn the shape of."
      prefixStyle="subject-only"
    />
  );
}
