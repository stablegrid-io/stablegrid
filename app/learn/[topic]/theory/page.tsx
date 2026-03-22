import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TheoryTrackPath } from '@/components/learn/theory/TheoryTrackPath';
import { learnTopics } from '@/data/learn';
import { theoryDocs } from '@/data/learn/theory';
import { loadServerTheoryProgress } from '@/lib/learn/serverTheoryProgress';

interface LearnTopicTheoryPageProps {
  params: {
    topic: string;
  };
}

export default async function LearnTopicTheoryPage({
  params
}: LearnTopicTheoryPageProps) {
  const doc = theoryDocs[params.topic];
  if (!doc) {
    notFound();
  }

  const { completedChapterIds, chapterProgressById, moduleProgressById } =
    await loadServerTheoryProgress(params.topic);

  return (
    <TheoryTrackPath
      doc={doc}
      track={{
        slug: 'all',
        label: doc.title,
        eyebrow: 'Modules',
        description: doc.description,
        highlights: [],
        chapters: [...(doc.modules ?? doc.chapters)],
        chapterCount: (doc.modules ?? doc.chapters).length,
        totalMinutes: (doc.modules ?? doc.chapters).reduce(
          (sum, ch) => sum + ch.totalMinutes,
          0
        ),
      }}
      completedChapterIds={completedChapterIds}
      chapterProgressById={chapterProgressById}
      moduleProgressById={moduleProgressById}
    />
  );
}

export function generateStaticParams() {
  return learnTopics.map((topic) => ({ topic: topic.id }));
}

export function generateMetadata({ params }: LearnTopicTheoryPageProps): Metadata {
  const doc = theoryDocs[params.topic];
  return {
    title: 'stableGrid',
    description: doc?.description ?? 'Module-based theory documentation.'
  };
}
