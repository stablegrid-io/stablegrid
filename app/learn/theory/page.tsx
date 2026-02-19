import type { Metadata } from 'next';
import { LearnModeTopicSelector } from '@/components/learn/LearnModeTopicSelector';

export const metadata: Metadata = {
  title: 'StableGrid.io',
  description: 'Select a topic, then open theory categories and chapters.'
};

export default function LearnTheoryTopicsPage() {
  return <LearnModeTopicSelector mode="theory" />;
}
