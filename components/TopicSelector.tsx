'use client';

import type { TopicInfo } from '@/lib/types';
import { TopicCard } from '@/components/hub/TopicCard';

interface TopicSelectorProps {
  topics: TopicInfo[];
}

export function TopicSelector({ topics }: TopicSelectorProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {topics.map((topic, index) => (
        <TopicCard key={topic.id} topic={topic} index={index} />
      ))}
    </section>
  );
}
