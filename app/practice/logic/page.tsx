import type { Metadata } from 'next';
import { LogicTopicSelector } from '@/components/practice/LogicTopicSelector';

export const metadata: Metadata = {
  title: 'Logic Practice | stablegrid.io',
  description: 'Predicate, set, pattern, and structural reasoning drills for data engineers and analysts.',
  robots: { index: false, follow: false },
};

export default function LogicPracticePage() {
  return <LogicTopicSelector />;
}
