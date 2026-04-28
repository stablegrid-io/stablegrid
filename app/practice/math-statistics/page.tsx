import type { Metadata } from 'next';
import { MathStatisticsTopicSelector } from '@/components/practice/MathStatisticsTopicSelector';

export const metadata: Metadata = {
  title: 'Math & Statistics Practice | stablegrid.io',
  description: 'Descriptive stats, distributions, probability, inference, regression, time series, sampling, and big-data math.',
};

export default function MathStatisticsPracticePage() {
  return <MathStatisticsTopicSelector />;
}
