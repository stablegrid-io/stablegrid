'use client';

import type { TopicInfo } from '@/lib/types';
import { TopicCard } from '@/components/hub/TopicCard';

interface TopicSelectorProps {
  topics: TopicInfo[];
}

export function TopicSelector({ topics }: TopicSelectorProps) {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      {topics.map((topic, index) => (
        <TopicCard key={topic.id} topic={topic} index={index} />
      ))}
    </section>
  );
}
