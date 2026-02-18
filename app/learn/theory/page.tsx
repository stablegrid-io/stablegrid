import type { Metadata } from 'next';
import { LearnModeTopicSelector } from '@/components/learn/LearnModeTopicSelector';

export const metadata: Metadata = {
  title: 'Theory | Learn | stablegrid.io',
  description: 'Select a topic, then open theory categories and chapters.'
};

export default function LearnTheoryTopicsPage() {
  return <LearnModeTopicSelector mode="theory" />;
}
