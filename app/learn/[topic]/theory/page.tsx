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

interface ChapterProgressSnapshot {
  sectionsRead: number;
  sectionsTotal: number;
  isCompleted: boolean;
  lastActiveAt: string | null;
  currentLessonId: string | null;
  lastVisitedRoute: string | null;
}

interface ModuleProgressSnapshot {
  moduleOrder: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  currentLessonId: string | null;
  lastVisitedRoute: string | null;
  updatedAt: string | null;
}

export default async function LearnTopicTheoryPage({
  params
}: LearnTopicTheoryPageProps) {
  const doc = theoryDocs[params.topic];
  if (!doc) {
    notFound();
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let completedChapterIds: string[] = [];
  let chapterProgressById: Record<string, ChapterProgressSnapshot> = {};
  let moduleProgressById: Record<string, ModuleProgressSnapshot> = {};
  if (user) {
    const { data } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic', params.topic);

    completedChapterIds = (data ?? [])
      .filter((row) => row.is_completed)
      .map((row) => row.chapter_id)
      .filter((chapterId): chapterId is string => typeof chapterId === 'string');

    chapterProgressById = (data ?? []).reduce<Record<string, ChapterProgressSnapshot>>(
      (accumulator, row) => {
        if (typeof row.chapter_id !== 'string') {
          return accumulator;
        }

        accumulator[row.chapter_id] = {
          sectionsRead: Number(row.sections_read ?? 0),
          sectionsTotal: Number(row.sections_total ?? 0),
          isCompleted: Boolean(row.is_completed),
          lastActiveAt:
            typeof row.last_active_at === 'string' ? row.last_active_at : null,
          currentLessonId:
            typeof row.current_lesson_id === 'string' ? row.current_lesson_id : null,
          lastVisitedRoute:
            typeof row.last_visited_route === 'string' ? row.last_visited_route : null
        };
        return accumulator;
      },
      {}
    );

    const { data: moduleRows, error: moduleRowsError } = await supabase
      .from('module_progress')
      .select(
        'module_id,module_order,is_unlocked,is_completed,current_lesson_id,last_visited_route,updated_at'
      )
      .eq('user_id', user.id)
      .eq('topic', params.topic)
      .order('module_order', { ascending: true });

    if (!moduleRowsError && Array.isArray(moduleRows)) {
      moduleProgressById = moduleRows.reduce<Record<string, ModuleProgressSnapshot>>(
        (accumulator, row) => {
          if (typeof row.module_id !== 'string') {
            return accumulator;
          }

          accumulator[row.module_id] = {
            moduleOrder: Number(row.module_order ?? 0),
            isUnlocked: Boolean(row.is_unlocked),
            isCompleted: Boolean(row.is_completed),
            currentLessonId:
              typeof row.current_lesson_id === 'string' ? row.current_lesson_id : null,
            lastVisitedRoute:
              typeof row.last_visited_route === 'string' ? row.last_visited_route : null,
            updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null
          };
          return accumulator;
        },
        {}
      );

      if (Object.keys(moduleProgressById).length > 0) {
        completedChapterIds = moduleRows
          .filter((row) => row.is_completed)
          .map((row) => row.module_id)
          .filter((chapterId): chapterId is string => typeof chapterId === 'string');
      }
    }
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
      title: 'StableGrid.io',
      description: 'Module-based theory documentation.'
    };
  }

  return {
    title: 'StableGrid.io',
    description: 'Choose a theory category before opening modules.'
  };
}
