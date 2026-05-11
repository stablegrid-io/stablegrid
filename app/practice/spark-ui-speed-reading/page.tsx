import type { Metadata } from 'next';
import { ComingSoonCategory } from '../_components/ComingSoonCategory';

export const metadata: Metadata = {
  title: 'Spark UI Speed Reading — StableGrid',
  description:
    'One screenshot. Sixty seconds. Stage timelines, executor heatmaps, SQL DAGs — call the bottleneck before the timer runs out.',
  alternates: { canonical: '/practice/spark-ui-speed-reading' },
  robots: { index: false, follow: false }
};

export default function SparkUiSpeedReadingPage() {
  return (
    <ComingSoonCategory
      eyebrow="Spark UI Speed Reading"
      title="One screenshot. Sixty seconds."
      description="Stage timelines, executor heatmaps, SQL DAGs, query-plan trees. You have one minute to call the bottleneck. Production debugging is rarely contemplative — train the muscle that surfaces in the on-call hour."
    />
  );
}
