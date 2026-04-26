import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LearnModeTopicSelector } from '@/components/learn/LearnModeTopicSelector';
import { learnTopics } from '@/data/learn';
import { loadServerTheoryProgress } from '@/lib/learn/serverTheoryProgress';

export const metadata: Metadata = {
  title: 'Theory Hub',
  description:
    'Pick a track and dive into structured theory across PySpark, Fabric, Airflow, SQL, and Python — Junior to Senior.',
  alternates: { canonical: '/theory' }
};

function TheoryHubSkeleton() {
  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-8">
          <div className="border-l-2 border-primary/30 pl-6 space-y-3">
            <div className="h-12 w-64 rounded-lg bg-white/[0.04]" />
            <div className="h-4 w-96 rounded-lg bg-white/[0.03]" />
          </div>
          <div className="h-20 w-full max-w-2xl rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-72 rounded-lg border border-white/[0.06] bg-white/[0.02]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function TheoryHubContent() {
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

export default function TheoryHubPage() {
  return (
    <Suspense fallback={<TheoryHubSkeleton />}>
      <TheoryHubContent />
    </Suspense>
  );
}
