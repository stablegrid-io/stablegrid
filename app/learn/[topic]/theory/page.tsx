import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TheoryCategorySelector } from '@/components/learn/theory/TheoryCategorySelector';
import { TheoryTrackGallery } from '@/components/learn/theory/TheoryTrackGallery';
import { learnTopics } from '@/data/learn';
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryCategories } from '@/data/learn/theory/categories';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
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

  const tracks = getTheoryTracks(doc);
  if (tracks.length > 0) {
    return (
      <TheoryTrackGallery
        doc={doc}
        tracks={tracks}
        completedChapterIds={completedChapterIds}
        chapterProgressById={chapterProgressById}
        moduleProgressById={moduleProgressById}
      />
    );
  }

  const categories = getTheoryCategories(doc);
  return (
    <TheoryCategorySelector
      doc={doc}
      categories={categories}
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
  if (!doc) {
    return {
      title: 'stableGrid.io',
      description: 'Module-based theory documentation.'
    };
  }

  const hasTracks = getTheoryTracks(doc).length > 0;
  return {
    title: 'stableGrid.io',
    description: hasTracks
      ? 'Choose a guided track before opening modules.'
      : 'Choose a theory category before opening modules.'
  };
}
