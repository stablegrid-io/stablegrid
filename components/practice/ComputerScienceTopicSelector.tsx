'use client';

import {
  Hash,
  Binary,
  Hourglass,
  HardDrive,
  Blocks,
  Network,
  Split,
  MemoryStick,
  Router,
} from 'lucide-react';
import { PracticeTopicSelectorPage, type Topic } from './PracticeTopicSelectorPage';

const ACCENT = '34,197,94';

const TOPICS: Topic[] = [
  {
    id: 'data-structures',
    title: 'Data Structures',
    description: 'Arrays, hashmaps, sets, trees, graphs, heaps — the mental model behind joins and group-bys.',
    icon: Hash,
    accentRgb: ACCENT,
    category: 'Foundations',
    comingSoon: true,
  },
  {
    id: 'algorithms',
    title: 'Algorithms',
    description: 'Sorting, searching, traversals, dynamic programming, divide and conquer.',
    icon: Binary,
    accentRgb: ACCENT,
    category: 'Foundations',
    comingSoon: true,
  },
  {
    id: 'complexity-big-o',
    title: 'Complexity & Big-O',
    description: 'Time and space analysis — recognizing the difference between O(n) and O(n²) in your own code.',
    icon: Hourglass,
    accentRgb: ACCENT,
    category: 'Foundations',
    comingSoon: true,
  },
  {
    id: 'databases-storage',
    title: 'Databases & Storage',
    description: 'B-trees, LSM-trees, columnar vs row, indexes, transactions, isolation levels.',
    icon: HardDrive,
    accentRgb: ACCENT,
    category: 'Storage',
    comingSoon: true,
  },
  {
    id: 'systems-design',
    title: 'Systems Design',
    description: 'Caches, queues, load balancers, sharding — architectural patterns behind real pipelines.',
    icon: Blocks,
    accentRgb: ACCENT,
    category: 'Systems',
    comingSoon: true,
  },
  {
    id: 'distributed-systems',
    title: 'Distributed Systems',
    description: 'CAP, partitioning, replication, consensus, eventual consistency — the math under Spark and Kafka.',
    icon: Network,
    accentRgb: ACCENT,
    category: 'Systems',
    comingSoon: true,
  },
  {
    id: 'concurrency-parallelism',
    title: 'Concurrency & Parallelism',
    description: 'Threads, locks, race conditions, async, executors — writing code that doesn’t deadlock.',
    icon: Split,
    accentRgb: ACCENT,
    category: 'Performance',
    comingSoon: true,
  },
  {
    id: 'memory-performance',
    title: 'Memory & Performance',
    description: 'Cache locality, GC behavior, profiling, allocation patterns — making slow code fast.',
    icon: MemoryStick,
    accentRgb: ACCENT,
    category: 'Performance',
    comingSoon: true,
  },
  {
    id: 'networking',
    title: 'Networking',
    description: 'HTTP, gRPC, latency vs throughput, retries, idempotency — services talking reliably.',
    icon: Router,
    accentRgb: ACCENT,
    category: 'Communication',
    comingSoon: true,
  },
];

export function ComputerScienceTopicSelector() {
  return (
    <PracticeTopicSelectorPage
      title="Computer Science"
      subtitle="The foundations under everything — data structures, algorithms, systems, and the performance instincts that separate good code from fast code."
      topics={TOPICS}
      hrefPrefix="/practice/computer-science"
    />
  );
}
