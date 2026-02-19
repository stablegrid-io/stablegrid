import type { Metadata } from 'next';
import { LearnModeTopicSelector } from '@/components/learn/LearnModeTopicSelector';

export const metadata: Metadata = {
  title: 'StableGrid.io',
  description: 'Select a topic, then open the functions reference.'
};

export default function LearnFunctionsTopicsPage() {
  return <LearnModeTopicSelector mode="functions" />;
}
