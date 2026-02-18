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
  let chapterProgressById: Record<
    string,
    {
      sectionsRead: number;
      sectionsTotal: number;
      isCompleted: boolean;
      lastActiveAt: string | null;
    }
  > = {};
  if (user) {
    const { data } = await supabase
      .from('reading_sessions')
      .select('chapter_id,sections_read,sections_total,is_completed,last_active_at')
      .eq('user_id', user.id)
      .eq('topic', params.topic);

    completedChapterIds = (data ?? [])
      .filter((row) => row.is_completed)
      .map((row) => row.chapter_id)
      .filter((chapterId): chapterId is string => typeof chapterId === 'string');

    chapterProgressById = (data ?? []).reduce<
      Record<
        string,
        {
          sectionsRead: number;
          sectionsTotal: number;
          isCompleted: boolean;
          lastActiveAt: string | null;
        }
      >
    >((accumulator, row) => {
      if (typeof row.chapter_id !== 'string') {
        return accumulator;
      }

      accumulator[row.chapter_id] = {
        sectionsRead: Number(row.sections_read ?? 0),
        sectionsTotal: Number(row.sections_total ?? 0),
        isCompleted: Boolean(row.is_completed),
        lastActiveAt:
          typeof row.last_active_at === 'string' ? row.last_active_at : null
      };
      return accumulator;
    }, {});
  }

  const categories = getTheoryCategories(doc);
  return (
    <TheoryCategorySelector
      doc={doc}
      categories={categories}
      completedChapterIds={completedChapterIds}
      chapterProgressById={chapterProgressById}
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
      title: 'Theory | Learn | stablegrid.io',
      description: 'Chapter-based theory documentation.'
    };
  }

  return {
    title: `${doc.title} Theory Categories | stablegrid.io`,
    description: 'Choose a theory category before opening chapters.'
  };
}
