import type { Metadata } from 'next';
import { LearnModeTopicSelector } from '@/components/learn/LearnModeTopicSelector';
import { learnTopics } from '@/data/learn';
import { loadServerTheoryProgress } from '@/lib/learn/serverTheoryProgress';

export const metadata: Metadata = {
  title: 'stableGrid.io',
  description: 'Select a topic, then open theory categories and chapters.'
};

export default async function TheoryTopicsPage() {
  const progressByTopic = Object.fromEntries(
    await Promise.all(
      learnTopics.map(async (topic) => {
        const progress = await loadServerTheoryProgress(topic.id);
        return [topic.id, progress] as const;
      })
    )
  );

  const initialCompletedChapterCountByTopic = Object.fromEntries(
    learnTopics.map((topic) => [topic.id, progressByTopic[topic.id]?.completedChapterIds.length ?? 0])
  );
  const initialChapterCountByTopic = Object.fromEntries(
    learnTopics.map((topic) => [topic.id, progressByTopic[topic.id]?.totalChapterCount ?? 0])
  );

  return (
    <LearnModeTopicSelector
      mode="theory"
      initialCompletedChapterCountByTopic={initialCompletedChapterCountByTopic}
      initialChapterCountByTopic={initialChapterCountByTopic}
    />
  );
}
