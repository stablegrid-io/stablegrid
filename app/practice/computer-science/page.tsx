import type { Metadata } from 'next';
import { ComputerScienceTopicSelector } from '@/components/practice/ComputerScienceTopicSelector';

export const metadata: Metadata = {
  title: 'Computer Science Practice | stablegrid.io',
  description: 'Data structures, algorithms, complexity, storage, systems design, distributed systems, concurrency, memory, and networking.',
};

export default function ComputerSciencePracticePage() {
  return <ComputerScienceTopicSelector />;
}
