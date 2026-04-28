import 'server-only';

import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
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

export interface ServerCheckpointSnapshot {
  passed: boolean;
  /** Score on the most recent attempt as a 0..1 ratio. Used to render the
   *  fill bar on the "Checkpoint ready" CTA so the user sees how close they
   *  came on their previous attempt without needing to re-enter the quiz. */
  lastScore: number;
  /** Best-ever score (0..1). Sticky so reattempts can't lower it. */
  bestScore: number;
  totalQuestions: number;
}

export interface ServerTheoryProgressPayload {
  hasUser: boolean;
  totalChapterCount: number;
  completedChapterIds: string[];
  chapterProgressById: Record<string, ServerTheoryChapterProgressSnapshot>;
  moduleProgressById: Record<string, ServerTheoryModuleProgressSnapshot>;
  /**
   * Map of moduleId → whether the user has passed the module checkpoint quiz.
   * Sourced from `module_checkpoints`. Empty for anonymous users.
   * The client store (lib/stores/useCheckpointStore.ts) ORs this with its
   * localStorage cache so a just-passed-but-not-yet-synced result still
   * reflects on the track map until the next page load.
   *
   * Kept alongside `checkpointResultsById` for backward compatibility with
   * callers that only need the boolean.
   */
  checkpointPassedById: Record<string, boolean>;
  /**
   * Full per-module checkpoint snapshot — passed flag + last/best scores.
   * Powers the progress fill on "Checkpoint ready" CTAs.
   */
  checkpointResultsById: Record<string, ServerCheckpointSnapshot>;
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

  const tracks = getTheoryTracks(doc);
  const sourceModules =
    tracks.length > 0
      ? tracks.flatMap((track) => sortModulesByOrder(track.chapters))
      : sortModulesByOrder(doc.modules ?? doc.chapters);

  const seenModuleIds = new Set<string>();
  const uniqueModules = sourceModules.reduce<CanonicalTheoryModuleEntry[]>(
    (accumulator, module) => {
      if (seenModuleIds.has(module.id)) {
        return accumulator;
      }
      seenModuleIds.add(module.id);
      accumulator.push({
        id: module.id,
        order: accumulator.length + 1
      });
      return accumulator;
    },
    []
  );

  return uniqueModules;
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

  let previousCompleted = false;
  const moduleProgressById = evidence.reduce<
    Record<string, ServerTheoryModuleProgressSnapshot>
  >((accumulator, entry, index) => {
    // Completion must reflect explicit module completion state only.
    const isCompleted = entry.explicitCompleted;
    const isUnlocked =
      entry.moduleRow?.is_unlocked ??
      (index === 0 || previousCompleted || isCompleted || entry.hasProgress);
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
  const canonicalModules = getCanonicalTheoryModules(topic);
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      hasUser: false,
      totalChapterCount: canonicalModules.length,
      completedChapterIds: [],
      chapterProgressById: {},
      moduleProgressById: {},
      checkpointPassedById: {},
      checkpointResultsById: {}
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

  // Checkpoint quiz pass state. Tolerate a missing table (fresh installs that
  // haven't run the 20260427120000_module_checkpoints migration yet) so the
  // theory hub keeps rendering — fall back to the client store on the page.
  // Also pull last/best score so the track map can render a progress fill on
  // the "Checkpoint ready" CTA without an extra round-trip.
  const checkpointPassedById: Record<string, boolean> = {};
  const checkpointResultsById: Record<string, ServerCheckpointSnapshot> = {};
  const { data: checkpointRows, error: checkpointRowsError } = await supabase
    .from('module_checkpoints')
    .select('module_id,passed,last_score,best_score,total_questions')
    .eq('user_id', user.id)
    .eq('topic', topic);

  if (!checkpointRowsError && Array.isArray(checkpointRows)) {
    for (const row of checkpointRows as {
      module_id: string | null;
      passed: boolean | null;
      last_score: number | null;
      best_score: number | null;
      total_questions: number | null;
    }[]) {
      if (typeof row.module_id !== 'string') continue;
      const passed = Boolean(row.passed);
      if (passed) checkpointPassedById[row.module_id] = true;
      checkpointResultsById[row.module_id] = {
        passed,
        lastScore: clampScore(row.last_score),
        bestScore: clampScore(row.best_score),
        totalQuestions: typeof row.total_questions === 'number' && row.total_questions > 0
          ? row.total_questions
          : 0
      };
    }
  }

  return {
    hasUser: true,
    totalChapterCount: canonicalModules.length,
    completedChapterIds,
    chapterProgressById,
    moduleProgressById,
    checkpointPassedById,
    checkpointResultsById
  };
};

const clampScore = (value: number | null): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};
