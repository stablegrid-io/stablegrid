import 'server-only';

import { theoryDocs } from '@/data/learn/theory';
import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import { getReadLessonCountFromSessionSnapshot } from '@/lib/learn/readingSessionProgress';
import { getTheoryOrderedLessonIds } from '@/lib/learn/theoryCatalog';
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

interface ServerTheoryModuleProgressRow {
  module_id: string | null;
  module_order: number | null;
  is_unlocked: boolean | null;
  is_completed: boolean | null;
  current_lesson_id: string | null;
  last_visited_route: string | null;
  updated_at: string | null;
}

interface CanonicalTheoryModuleEntry {
  id: string;
  order: number;
}

const getCanonicalTheoryModules = (topic: string): CanonicalTheoryModuleEntry[] => {
  const doc = theoryDocs[topic];
  if (!doc) {
    return [];
  }

  return sortModulesByOrder(doc.modules ?? doc.chapters).map((module) => ({
    id: module.id,
    order: module.order ?? module.number
  }));
};

const hasModuleRowProgress = (row: ServerTheoryModuleProgressRow | undefined) =>
  Boolean(row?.is_completed || row?.current_lesson_id || row?.last_visited_route);

const hasChapterSnapshotProgress = (
  snapshot: ServerTheoryChapterProgressSnapshot | undefined
) =>
  Boolean(
    snapshot?.isCompleted ||
      (snapshot?.sectionsRead ?? 0) > 0 ||
      snapshot?.currentLessonId ||
      snapshot?.lastVisitedRoute
  );

export const normalizeServerTheoryModuleProgress = ({
  topic,
  chapterProgressById,
  moduleRows
}: {
  topic: string;
  chapterProgressById: Record<string, ServerTheoryChapterProgressSnapshot>;
  moduleRows: ServerTheoryModuleProgressRow[];
}) => {
  const canonicalModules = getCanonicalTheoryModules(topic);
  if (canonicalModules.length === 0 || moduleRows.length === 0) {
    return {
      completedChapterIds: [] as string[],
      moduleProgressById: {} as Record<string, ServerTheoryModuleProgressSnapshot>
    };
  }

  const moduleRowById = moduleRows.reduce<Map<string, ServerTheoryModuleProgressRow>>(
    (accumulator, row) => {
      if (typeof row.module_id === 'string') {
        accumulator.set(row.module_id, row);
      }
      return accumulator;
    },
    new Map()
  );

  const evidence = canonicalModules.map((module) => {
    const moduleRow = moduleRowById.get(module.id);
    const chapterSnapshot = chapterProgressById[module.id];
    const explicitCompleted = moduleRow
      ? Boolean(moduleRow.is_completed)
      : Boolean(chapterSnapshot?.isCompleted);
    const hasProgress = moduleRow
      ? hasModuleRowProgress(moduleRow)
      : hasChapterSnapshotProgress(chapterSnapshot);

    return {
      module,
      moduleRow,
      chapterSnapshot,
      explicitCompleted,
      hasProgress
    };
  });

  const highestExplicitCompletedIndex = evidence.reduce(
    (highestIndex, entry, index) => (entry.explicitCompleted ? index : highestIndex),
    -1
  );
  const highestProgressIndex = evidence.reduce(
    (highestIndex, entry, index) => (entry.hasProgress ? index : highestIndex),
    -1
  );
  const completedBoundaryIndex = Math.max(
    highestExplicitCompletedIndex,
    highestProgressIndex - 1
  );

  let previousCompleted = false;
  const moduleProgressById = evidence.reduce<
    Record<string, ServerTheoryModuleProgressSnapshot>
  >((accumulator, entry, index) => {
    const isCompleted = entry.explicitCompleted || index <= completedBoundaryIndex;
    const isUnlocked = index === 0 || previousCompleted || isCompleted;
    previousCompleted = isCompleted;

    accumulator[entry.module.id] = {
      moduleOrder: entry.module.order,
      isUnlocked,
      isCompleted,
      currentLessonId:
        entry.moduleRow?.current_lesson_id ?? entry.chapterSnapshot?.currentLessonId ?? null,
      lastVisitedRoute:
        entry.moduleRow?.last_visited_route ??
        entry.chapterSnapshot?.lastVisitedRoute ??
        null,
      updatedAt:
        entry.moduleRow?.updated_at ?? entry.chapterSnapshot?.lastActiveAt ?? null
    };

    return accumulator;
  }, {});

  return {
    completedChapterIds: canonicalModules
      .filter((module) => moduleProgressById[module.id]?.isCompleted)
      .map((module) => module.id),
    moduleProgressById
  };
};

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
      sectionsRead: getReadLessonCountFromSessionSnapshot(
        row,
        getTheoryOrderedLessonIds(topic, row.chapter_id),
        Number(row.sections_total ?? 0)
      ),
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

  if (!moduleRowsError && Array.isArray(moduleRows) && moduleRows.length > 0) {
    const normalizedModuleProgress = normalizeServerTheoryModuleProgress({
      topic,
      chapterProgressById,
      moduleRows: moduleRows as ServerTheoryModuleProgressRow[]
    });
    moduleProgressById = normalizedModuleProgress.moduleProgressById;
    completedChapterIds = normalizedModuleProgress.completedChapterIds;
  }

  return {
    hasUser: true,
    completedChapterIds,
    chapterProgressById,
    moduleProgressById
  };
};
