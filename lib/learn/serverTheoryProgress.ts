import 'server-only';

import { createClient } from '@/lib/supabase/server';

export interface ServerTheoryChapterProgressSnapshot {
  sectionsRead: number;
  sectionsTotal: number;
  isCompleted: boolean;
  lastActiveAt: string | null;
  currentLessonId: string | null;
  lastVisitedRoute: string | null;
}

export interface ServerTheoryModuleProgressSnapshot {
  moduleOrder: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  currentLessonId: string | null;
  lastVisitedRoute: string | null;
  updatedAt: string | null;
}

export interface ServerTheoryProgressPayload {
  hasUser: boolean;
  completedChapterIds: string[];
  chapterProgressById: Record<string, ServerTheoryChapterProgressSnapshot>;
  moduleProgressById: Record<string, ServerTheoryModuleProgressSnapshot>;
}

export const loadServerTheoryProgress = async (
  topic: string
): Promise<ServerTheoryProgressPayload> => {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      hasUser: false,
      completedChapterIds: [],
      chapterProgressById: {},
      moduleProgressById: {}
    };
  }

  const { data: readingSessionRows } = await supabase
    .from('reading_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('topic', topic);

  let completedChapterIds = (readingSessionRows ?? [])
    .filter((row) => row.is_completed)
    .map((row) => row.chapter_id)
    .filter((chapterId): chapterId is string => typeof chapterId === 'string');

  const chapterProgressById = (readingSessionRows ?? []).reduce<
    Record<string, ServerTheoryChapterProgressSnapshot>
  >((accumulator, row) => {
    if (typeof row.chapter_id !== 'string') {
      return accumulator;
    }

    accumulator[row.chapter_id] = {
      sectionsRead: Number(row.sections_read ?? 0),
      sectionsTotal: Number(row.sections_total ?? 0),
      isCompleted: Boolean(row.is_completed),
      lastActiveAt: typeof row.last_active_at === 'string' ? row.last_active_at : null,
      currentLessonId:
        typeof row.current_lesson_id === 'string' ? row.current_lesson_id : null,
      lastVisitedRoute:
        typeof row.last_visited_route === 'string' ? row.last_visited_route : null
    };

    return accumulator;
  }, {});

  let moduleProgressById: Record<string, ServerTheoryModuleProgressSnapshot> = {};
  const { data: moduleRows, error: moduleRowsError } = await supabase
    .from('module_progress')
    .select(
      'module_id,module_order,is_unlocked,is_completed,current_lesson_id,last_visited_route,updated_at'
    )
    .eq('user_id', user.id)
    .eq('topic', topic)
    .order('module_order', { ascending: true });

  if (!moduleRowsError && Array.isArray(moduleRows)) {
    moduleProgressById = moduleRows.reduce<
      Record<string, ServerTheoryModuleProgressSnapshot>
    >((accumulator, row) => {
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
    }, {});

    if (Object.keys(moduleProgressById).length > 0) {
      completedChapterIds = moduleRows
        .filter((row) => row.is_completed)
        .map((row) => row.module_id)
        .filter((chapterId): chapterId is string => typeof chapterId === 'string');
    }
  }

  return {
    hasUser: true,
    completedChapterIds,
    chapterProgressById,
    moduleProgressById
  };
};
