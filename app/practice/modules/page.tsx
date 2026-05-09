import type { Metadata } from 'next';
import { getPracticeSets, type PracticeSet } from '@/data/operations/practice-sets';
import { loadServerPracticeProgress } from '@/lib/practice/serverPracticeProgress';
import {
  PracticeTrackEditorial,
  type PracticeTrackSummary
} from '@/components/practice/PracticeTrackEditorial';

export const metadata: Metadata = {
  title: 'Module Practice — StableGrid',
  description:
    'PySpark practice sets paired with each theory module, across Junior, Mid, and Senior tracks.',
  alternates: { canonical: '/practice/modules' },
  robots: { index: false, follow: false }
};

const TIER_PREFIXES = {
  junior: ['PS'],
  mid: ['PM'],
  senior: ['PX']
} as const;

const TIER_LABELS: Record<keyof typeof TIER_PREFIXES, { label: string; eyebrow: string }> = {
  junior: { label: 'Junior', eyebrow: 'Core Foundation' },
  mid: { label: 'Mid', eyebrow: 'Advanced Transformations' },
  senior: { label: 'Senior', eyebrow: 'Cluster Tuning' }
};

const moduleNumber = (set: PracticeSet): number => {
  const match = set.metadata.moduleId.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
};

const filterByTier = (
  sets: PracticeSet[],
  prefixes: readonly string[]
): PracticeSet[] =>
  sets
    .filter((set) => {
      const moduleId = set.metadata.moduleId.replace(/^module-/, '');
      // Match prefix exactly followed by digits — e.g. "PS1", "PS10" but not
      // "PSI4" or "PSS2" or other letter-letter-digit topic combos.
      return prefixes.some((prefix) =>
        new RegExp(`^${prefix}\\d+$`).test(moduleId)
      );
    })
    .sort((a, b) => moduleNumber(a) - moduleNumber(b));

export default async function PracticePage() {
  const allSets = getPracticeSets('pyspark');

  const tracks: PracticeTrackSummary[] = (
    Object.keys(TIER_PREFIXES) as Array<keyof typeof TIER_PREFIXES>
  ).map((slug) => ({
    slug,
    label: TIER_LABELS[slug].label,
    eyebrow: TIER_LABELS[slug].eyebrow,
    sets: filterByTier(allSets, TIER_PREFIXES[slug])
  }));

  const moduleIds = tracks.flatMap((t) => t.sets.map((s) => s.metadata.moduleId));
  const { progressByModule } = await loadServerPracticeProgress(moduleIds);

  return (
    <PracticeTrackEditorial
      topic="pyspark"
      tracks={tracks}
      progressByModule={progressByModule}
    />
  );
}
