import type { Metadata } from 'next';
import { LearnModeTopicSelector } from '@/components/learn/LearnModeTopicSelector';
import { learnTopics } from '@/data/learn';
import { loadServerTheoryProgress } from '@/lib/learn/serverTheoryProgress';

export const metadata: Metadata = {
  title: 'stableGrid.io',
  description: 'Select a topic, then open theory categories and chapters.'
};

export default async function LearnTheoryTopicsPage() {
  const initialCompletedChapterCountByTopic = Object.fromEntries(
    await Promise.all(
      learnTopics.map(async (topic) => {
        const progress = await loadServerTheoryProgress(topic.id);
        return [topic.id, progress.completedChapterIds.length] as const;
      })
    )
  );

  return (
    <LearnModeTopicSelector
      mode="theory"
      initialCompletedChapterCountByTopic={initialCompletedChapterCountByTopic}
    />
  );
}
