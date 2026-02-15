import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TheoryCategorySelector } from '@/components/learn/theory/TheoryCategorySelector';
import { learnTopics } from '@/data/learn';
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryCategories } from '@/data/learn/theory/categories';
import { createClient } from '@/lib/supabase/server';

interface LearnTopicTheoryPageProps {
  params: {
    topic: string;
  };
}

export default async function LearnTopicTheoryPage({ params }: LearnTopicTheoryPageProps) {
  const doc = theoryDocs[params.topic];
  if (!doc) {
    notFound();
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let completedChapterIds: string[] = [];
  if (user) {
    const { data } = await supabase
      .from('reading_sessions')
      .select('chapter_id')
      .eq('user_id', user.id)
      .eq('topic', params.topic)
      .eq('is_completed', true);

    completedChapterIds = (data ?? [])
      .map((row) => row.chapter_id)
      .filter((chapterId): chapterId is string => typeof chapterId === 'string');
  }

  const categories = getTheoryCategories(doc);
  return (
    <TheoryCategorySelector
      doc={doc}
      categories={categories}
      completedChapterIds={completedChapterIds}
    />
  );
}

export function generateStaticParams() {
  return learnTopics.map((topic) => ({ topic: topic.id }));
}

export function generateMetadata({
  params
}: LearnTopicTheoryPageProps): Metadata {
  const doc = theoryDocs[params.topic];
  if (!doc) {
    return {
      title: 'Theory | Learn | Gridlock',
      description: 'Chapter-based theory documentation.'
    };
  }

  return {
    title: `${doc.title} Theory Categories | Gridlock`,
    description: 'Choose a theory category before opening chapters.'
  };
}
