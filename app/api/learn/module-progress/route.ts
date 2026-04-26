import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryCategories } from '@/data/learn/theory/categories';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import {
  mutateModuleProgressRows,
  normalizeModuleProgressChain,
  type CanonicalModuleEntry,
  type ModuleProgressRowLike
} from '@/lib/learn/moduleProgress';
import { createClient } from '@/lib/supabase/server';
import type { Topic } from '@/types/progress';

type ModuleProgressAction =
  | 'ensure'
  | 'complete'
  | 'complete_practice'
  | 'incomplete'
  | 'touch';

interface ModuleProgressRow extends ModuleProgressRowLike {
  id: string;
  user_id: string;
  topic: string;
  updated_at: string;
}

interface ReadingSessionFallbackRow {
  chapter_id: string | null;
  chapter_number: number | null;
  is_completed: boolean | null;
  sections_total: number | null;
  sections_read: number | null;
  sections_ids_read: string[] | null;
  completed_lesson_ids: string[] | null;
  current_lesson_id: string | null;
  last_visited_route: string | null;
  completed_at: string | null;
  last_active_at: string | null;
}

interface ExistingReadingSessionProgress {
  sections_read: number | null;
  sections_ids_read: string[] | null;
  completed_lesson_ids: string[] | null;
  lesson_seconds_by_id?: Record<string, unknown> | null;
  current_lesson_id: string | null;
  last_visited_route: string | null;
}

interface CanonicalModuleContextEntry extends CanonicalModuleEntry {
  lessonIds: string[];
  sectionsTotal: number;
}

const TOPIC_SET = new Set<Topic>(['pyspark', 'fabric', 'airflow', 'sql', 'python-de']);

const isTopic = (value: string): value is Topic => TOPIC_SET.has(value as Topic);

const isAction = (value: unknown): value is ModuleProgressAction =>
  value === 'ensure' ||
  value === 'complete' ||
  value === 'complete_practice' ||
  value === 'incomplete' ||
  value === 'touch';

const isMissingModuleProgressTableError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes('module_progress') &&
    (error.message.includes('does not exist') || error.message.includes('42P01'))
  );
};

const READING_SESSIONS_OPTIONAL_COLUMNS = [
  'current_lesson_id',
  'completed_lesson_ids',
  'last_visited_route',
  'lesson_seconds_by_id'
];

const hasMissingReadingSessionsColumnError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return READING_SESSIONS_OPTIONAL_COLUMNS.some((column) =>
    error.message.includes(column)
  );
};

const resolveTrackSlug = (topic: Topic, rawTrackSlug: string | null) => {
  if (!rawTrackSlug) {
    return null;
  }

  const doc = theoryDocs[topic];
  if (!doc) {
    return null;
  }

  const normalizedSlug = rawTrackSlug.trim().toLowerCase();
  return getTheoryTracks(doc).some((track) => track.slug === normalizedSlug)
    ? normalizedSlug
    : null;
};

const getCanonicalModuleContext = (
  topic: Topic,
  trackSlug: string | null
): CanonicalModuleContextEntry[] => {
  const doc = theoryDocs[topic];
  if (!doc) {
    return [];
  }

  const sourceChapters = trackSlug
    ? getTheoryTracks(doc).find((track) => track.slug === trackSlug)?.chapters ?? []
    : sortModulesByOrder(doc.modules ?? doc.chapters);

  return sortModulesByOrder(sourceChapters).map((module) => ({
    id: module.id,
    order: module.order ?? module.number,
    lessonIds: module.sections.map((section) => section.id),
    sectionsTotal: module.sections.length
  }));
};

const revalidateTheoryProgressViews = (topic: Topic) => {
  revalidatePath('/theory');
  revalidatePath('/learn/theory');
  revalidatePath(`/learn/${topic}/theory`);
  revalidatePath(`/learn/${topic}/theory/all`);

  const doc = theoryDocs[topic];
  if (!doc) {
    return;
  }

  getTheoryTracks(doc).forEach((track) => {
    revalidatePath(`/learn/${topic}/theory/${track.slug}`);
  });

  getTheoryCategories(doc).forEach((category) => {
    revalidatePath(`/learn/${topic}/theory/${category.slug}`);
  });
};

const fetchModuleProgressRows = async ({
  supabase,
  userId,
  topic
}: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  topic: Topic;
}) => {
  const { data, error } = await supabase
    .from('module_progress')
    .select(
      'id,user_id,topic,module_id,module_order,is_unlocked,is_completed,current_lesson_id,last_visited_route,completed_at,updated_at'
    )
    .eq('user_id', userId)
    .eq('topic', topic)
    .order('module_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ModuleProgressRow[];
};

const fetchFallbackRowsFromReadingSessions = async ({
  supabase,
  userId,
  topic,
  canonicalModules
}: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  topic: Topic;
  canonicalModules: CanonicalModuleEntry[];
}) => {
  const { data, error } = await supabase
    .from('reading_sessions')
    .select(
      'chapter_id,chapter_number,is_completed,sections_total,sections_read,sections_ids_read,completed_lesson_ids,current_lesson_id,last_visited_route,completed_at,last_active_at'
    )
    .eq('user_id', userId)
    .eq('topic', topic);

  if (error) {
    throw new Error(error.message);
  }

  const byChapterId = new Map<string, ReadingSessionFallbackRow>();
  ((data ?? []) as ReadingSessionFallbackRow[]).forEach((row) => {
    if (typeof row.chapter_id !== 'string') {
      return;
    }

    const existing = byChapterId.get(row.chapter_id);
    if (!existing) {
      byChapterId.set(row.chapter_id, row);
      return;
    }

    const existingTs = new Date(
      existing.last_active_at ?? existing.completed_at ?? 0
    ).getTime();
    const nextTs = new Date(row.last_active_at ?? row.completed_at ?? 0).getTime();
    if (nextTs > existingTs) {
      byChapterId.set(row.chapter_id, row);
    }
  });

  let previousCompleted = false;
  return canonicalModules.map<ModuleProgressRow>((module, index) => {
    const fallback = byChapterId.get(module.id);
    const isCompleted = Boolean(fallback?.is_completed);
    const isUnlocked = index === 0 || previousCompleted || isCompleted;
    previousCompleted = isCompleted;
    const updatedAt =
      fallback?.last_active_at ??
      fallback?.completed_at ??
      new Date().toISOString();

    return {
      id: `fallback-${topic}-${module.id}`,
      user_id: userId,
      topic,
      module_id: module.id,
      module_order: module.order,
      is_unlocked: isUnlocked,
      is_completed: isCompleted,
      current_lesson_id: fallback?.current_lesson_id ?? null,
      last_visited_route: fallback?.last_visited_route ?? null,
      completed_at: fallback?.completed_at ?? null,
      updated_at: updatedAt
    };
  });
};

const persistFallbackReadingSessionAction = async ({
  supabase,
  userId,
  topic,
  moduleContext,
  action,
  moduleId,
  nowIso,
  currentLessonId,
  lastVisitedRoute
}: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  topic: Topic;
  moduleContext: CanonicalModuleContextEntry[];
  action: Exclude<ModuleProgressAction, 'ensure'>;
  moduleId: string;
  nowIso: string;
  currentLessonId?: string | null;
  lastVisitedRoute?: string | null;
}) => {
  const targetModule = moduleContext.find((module) => module.id === moduleId);
  if (!targetModule) {
    throw new Error(`Missing canonical module context for "${moduleId}".`);
  }

  let existingProgress: ExistingReadingSessionProgress | null = null;
  const { data: existingWithOptional, error: existingError } = await supabase
    .from('reading_sessions')
    .select(
      'sections_read,sections_ids_read,completed_lesson_ids,lesson_seconds_by_id,current_lesson_id,last_visited_route'
    )
    .eq('user_id', userId)
    .eq('topic', topic)
    .eq('chapter_id', moduleId)
    .maybeSingle<ExistingReadingSessionProgress>();

  if (!existingError) {
    existingProgress = existingWithOptional;
  } else if (hasMissingReadingSessionsColumnError(new Error(existingError.message))) {
    const { data: existingLegacy, error: existingLegacyError } = await supabase
      .from('reading_sessions')
      .select('sections_read,sections_ids_read')
      .eq('user_id', userId)
      .eq('topic', topic)
      .eq('chapter_id', moduleId)
      .maybeSingle<{ sections_read: number | null; sections_ids_read: string[] | null }>();

    if (existingLegacyError) {
      throw new Error(existingLegacyError.message);
    }

    existingProgress = existingLegacy
      ? {
          sections_read: existingLegacy.sections_read,
          sections_ids_read: existingLegacy.sections_ids_read,
          completed_lesson_ids: null,
          current_lesson_id: null,
          last_visited_route: null
        }
      : null;
  } else {
    throw new Error(existingError.message);
  }

  const lessonIdSet = new Set(targetModule.lessonIds);
  const sanitizedLessonId =
    typeof currentLessonId === 'string' && lessonIdSet.has(currentLessonId)
      ? currentLessonId
      : null;
  const routeValue = typeof lastVisitedRoute === 'string' ? lastVisitedRoute : null;
  const existingCompletedLessonIds = Array.isArray(existingProgress?.completed_lesson_ids)
    ? existingProgress?.completed_lesson_ids.filter((lessonId) => lessonIdSet.has(lessonId))
    : Array.isArray(existingProgress?.sections_ids_read)
      ? existingProgress?.sections_ids_read.filter((lessonId) => lessonIdSet.has(lessonId))
      : [];
  // Fallback storage tracks lesson completion from the reading session timer, not route changes.
  // Touch requests should only preserve resume state so opening a lesson never counts as reading it.
  const persistedCompletedLessonIds = targetModule.lessonIds.filter((lessonId) =>
    new Set(existingCompletedLessonIds).has(lessonId)
  );

  const basePayload: Record<string, unknown> = {
    user_id: userId,
    topic,
    chapter_id: targetModule.id,
    chapter_number: targetModule.order,
    sections_total: targetModule.sectionsTotal,
    last_active_at: nowIso
  };

  const fullPayload: Record<string, unknown> = {
    ...basePayload,
    lesson_seconds_by_id:
      existingProgress?.lesson_seconds_by_id &&
      typeof existingProgress.lesson_seconds_by_id === 'object' &&
      !Array.isArray(existingProgress.lesson_seconds_by_id)
        ? existingProgress.lesson_seconds_by_id
        : {},
    current_lesson_id:
      action === 'complete'
        ? sanitizedLessonId ?? targetModule.lessonIds[targetModule.lessonIds.length - 1] ?? null
        : action === 'incomplete'
          ? sanitizedLessonId ??
            (typeof existingProgress?.current_lesson_id === 'string' &&
            lessonIdSet.has(existingProgress.current_lesson_id)
              ? existingProgress.current_lesson_id
              : targetModule.lessonIds[0] ?? null)
          : sanitizedLessonId ??
            (typeof existingProgress?.current_lesson_id === 'string' &&
            lessonIdSet.has(existingProgress.current_lesson_id)
              ? existingProgress.current_lesson_id
              : null),
    last_visited_route: routeValue ?? existingProgress?.last_visited_route ?? null
  };

  if (action === 'complete') {
    fullPayload.is_completed = true;
    fullPayload.completed_at = nowIso;
    fullPayload.sections_read = persistedCompletedLessonIds.length;
    fullPayload.sections_ids_read = persistedCompletedLessonIds;
    fullPayload.completed_lesson_ids = persistedCompletedLessonIds;
  } else if (action === 'incomplete') {
    fullPayload.is_completed = false;
    fullPayload.completed_at = null;
    fullPayload.sections_read = persistedCompletedLessonIds.length;
    fullPayload.sections_ids_read = persistedCompletedLessonIds;
    fullPayload.completed_lesson_ids = persistedCompletedLessonIds;
  } else {
    fullPayload.sections_read = persistedCompletedLessonIds.length;
    fullPayload.sections_ids_read = persistedCompletedLessonIds;
    fullPayload.completed_lesson_ids = persistedCompletedLessonIds;
  }

  const { error: upsertError } = await supabase.from('reading_sessions').upsert(fullPayload, {
    onConflict: 'user_id,topic,chapter_id'
  });

  if (!upsertError) {
    return;
  }

  if (!hasMissingReadingSessionsColumnError(new Error(upsertError.message))) {
    throw new Error(upsertError.message);
  }

  const legacyPayload: Record<string, unknown> = {
    ...basePayload,
    sections_read: Number(fullPayload.sections_read ?? 0),
    sections_ids_read: Array.isArray(fullPayload.sections_ids_read)
      ? fullPayload.sections_ids_read
      : [],
    is_completed: Boolean(fullPayload.is_completed),
    completed_at:
      fullPayload.completed_at && typeof fullPayload.completed_at === 'string'
        ? fullPayload.completed_at
        : null
  };

  const { error: legacyError } = await supabase.from('reading_sessions').upsert(
    legacyPayload,
    {
      onConflict: 'user_id,topic,chapter_id'
    }
  );

  if (legacyError) {
    throw new Error(legacyError.message);
  }
};

const syncModuleProgressChain = async ({
  supabase,
  userId,
  topic,
  canonicalModules,
  existingRows,
  nowIso
}: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  topic: Topic;
  canonicalModules: CanonicalModuleEntry[];
  existingRows: ModuleProgressRowLike[];
  nowIso: string;
}) => {
  const upsertRows = normalizeModuleProgressChain({
    canonicalModules,
    existingRows,
    userId,
    topic,
    nowIso
  });

  const { error: upsertError } = await supabase.from('module_progress').upsert(upsertRows, {
    onConflict: 'user_id,topic,module_id'
  });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return fetchModuleProgressRows({ supabase, userId, topic });
};

const ensureModuleProgress = async ({
  supabase,
  userId,
  topic,
  canonicalModules
}: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  topic: Topic;
  canonicalModules: CanonicalModuleEntry[];
}) => {
  if (canonicalModules.length === 0) {
    return [];
  }

  const existingRows = await fetchModuleProgressRows({ supabase, userId, topic });
  return syncModuleProgressChain({
    supabase,
    userId,
    topic,
    canonicalModules,
    existingRows,
    nowIso: new Date().toISOString()
  });
};

const filterRowsForCanonicalModules = (
  rows: ModuleProgressRow[],
  canonicalModules: CanonicalModuleEntry[]
) => {
  const canonicalModuleIds = new Set(canonicalModules.map((module) => module.id));
  return rows.filter((row) => canonicalModuleIds.has(row.module_id));
};

interface ModuleProgressRequestPayload {
  action: ModuleProgressAction;
  currentLessonId: string | null;
  lastVisitedRoute: string | null;
  moduleId: string | null;
  topic: Topic;
  trackSlug: string | null;
}

const parseModuleProgressRequestPayload = async (
  request: Request
): Promise<ModuleProgressRequestPayload> => {
  const payload = await parseJsonObject(request);

  const topic = typeof payload.topic === 'string' ? payload.topic : null;
  if (!topic || !isTopic(topic)) {
    throw new ApiRouteError('Invalid topic.', 400);
  }

  const rawTrackSlug = typeof payload.track === 'string' ? payload.track : null;
  const trackSlug = resolveTrackSlug(topic, rawTrackSlug);
  if (rawTrackSlug && !trackSlug) {
    throw new ApiRouteError('Invalid track.', 400);
  }

  const action = payload.action;
  if (!isAction(action)) {
    throw new ApiRouteError('Invalid action.', 400);
  }

  return {
    action,
    currentLessonId:
      typeof payload.currentLessonId === 'string' ? payload.currentLessonId.slice(0, 200) : null,
    lastVisitedRoute:
      typeof payload.lastVisitedRoute === 'string' && payload.lastVisitedRoute.startsWith('/learn/')
        ? payload.lastVisitedRoute.slice(0, 2_000)
        : null,
    moduleId: typeof payload.moduleId === 'string' ? payload.moduleId.slice(0, 200) : null,
    topic,
    trackSlug
  };
};

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const topic = url.searchParams.get('topic');
  if (!topic || !isTopic(topic)) {
    return NextResponse.json({ error: 'Invalid topic.' }, { status: 400 });
  }
  const rawTrackSlug = url.searchParams.get('track');
  const trackSlug = resolveTrackSlug(topic, rawTrackSlug);
  if (rawTrackSlug && !trackSlug) {
    return NextResponse.json({ error: 'Invalid track.' }, { status: 400 });
  }

  const canonicalModuleContext = getCanonicalModuleContext(topic, trackSlug);
  const canonicalModules = canonicalModuleContext.map((module) => ({
    id: module.id,
    order: module.order
  }));
  if (canonicalModules.length === 0) {
    return NextResponse.json({ data: [] });
  }

  try {
    const rows = await ensureModuleProgress({
      supabase,
      userId: user.id,
      topic,
      canonicalModules
    });
    const scopedRows = filterRowsForCanonicalModules(rows, canonicalModules);
    return NextResponse.json({ data: scopedRows, storage: 'module_progress' });
  } catch (error) {
    console.warn('[module-progress GET] failed:', error instanceof Error ? error.message : error);

    // Return empty data so the user can still read — don't block on progress.
    // The server-rendered initial state from page.tsx is the source of truth;
    // this client-side fetch only refreshes it. Falling back to reading_sessions
    // caused data divergence and hydration flash bugs.
    return NextResponse.json({
      data: [],
      storage: 'none',
      warning: 'Progress temporarily unavailable. Reading is not affected.'
    });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await parseModuleProgressRequestPayload(request);

  try {
    const clientIp = getClientIp(request);
    const idempotencyKey = readIdempotencyKey(request);

    await Promise.all([
      enforceRateLimit({
        scope: 'module_progress_user',
        key: user.id,
        limit: 90,
        windowSeconds: 5 * 60
      }),
      enforceRateLimit({
        scope: 'module_progress_ip',
        key: clientIp,
        limit: 180,
        windowSeconds: 5 * 60
      })
    ]);

    const nowIso = new Date().toISOString();
    const canonicalModuleContext = getCanonicalModuleContext(
      payload.topic,
      payload.trackSlug
    );
    const canonicalModules = canonicalModuleContext.map((module) => ({
      id: module.id,
      order: module.order
    }));
    if (canonicalModules.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const response = await runIdempotentJsonRequest({
      scope: 'module_progress',
      ownerKey: user.id,
      idempotencyKey,
      requestBody: {
        action: payload.action,
        currentLessonId: payload.currentLessonId,
        lastVisitedRoute: payload.lastVisitedRoute,
        moduleId: payload.moduleId,
        topic: payload.topic,
        track: payload.trackSlug
      },
      execute: async () => {
        let ensuredRows = await ensureModuleProgress({
          supabase,
          userId: user.id,
          topic: payload.topic,
          canonicalModules
        });
        ensuredRows = filterRowsForCanonicalModules(ensuredRows, canonicalModules);

        if (payload.action === 'ensure') {
          return {
            body: { data: ensuredRows, storage: 'module_progress' },
            status: 200
          };
        }

        if (
          !payload.moduleId ||
          !canonicalModules.some((module) => module.id === payload.moduleId)
        ) {
          throw new ApiRouteError('Invalid module id.', 400);
        }

        const targetRow = ensuredRows.find((row) => row.module_id === payload.moduleId);
        if (!targetRow) {
          throw new ApiRouteError('Module progress row missing.', 404);
        }

        const isCompleteAction =
          payload.action === 'complete' || payload.action === 'complete_practice';

        if (isCompleteAction && !targetRow.is_unlocked) {
          throw new ApiRouteError(
            'Module is locked and cannot be completed yet.',
            409
          );
        }

        // Reading completion requires a finished reading session. Practice
        // completion is independent — a user can master a module by passing
        // the practice set without reading every lesson, so we don't gate
        // on reading_sessions for `complete_practice`.
        if (payload.action === 'complete') {
          const { data: sessionRow } = await supabase
            .from('reading_sessions')
            .select('is_completed,sections_read,sections_total')
            .eq('user_id', user.id)
            .eq('topic', payload.topic)
            .eq('chapter_id', payload.moduleId)
            .maybeSingle();

          const sectionsRead = Number(sessionRow?.sections_read ?? 0);
          const sectionsTotal = Number(sessionRow?.sections_total ?? 1);
          const isSessionComplete = Boolean(sessionRow?.is_completed);

          if (!isSessionComplete && sectionsRead < sectionsTotal) {
            throw new ApiRouteError(
              'Module cannot be completed — reading session is incomplete.',
              409
            );
          }
        }

        const mutatedRows = isCompleteAction
          ? mutateModuleProgressRows({
              rows: ensuredRows,
              moduleId: payload.moduleId,
              mutation: { type: 'complete' },
              nowIso
            })
          : payload.action === 'incomplete'
            ? mutateModuleProgressRows({
                rows: ensuredRows,
                moduleId: payload.moduleId,
                mutation: { type: 'incomplete' },
                nowIso
              })
            : mutateModuleProgressRows({
                rows: ensuredRows,
                moduleId: payload.moduleId,
                mutation: {
                  type: 'touch',
                  currentLessonId: payload.currentLessonId,
                  lastVisitedRoute: payload.lastVisitedRoute
                },
                nowIso
              });

        const syncedRows = await syncModuleProgressChain({
          supabase,
          userId: user.id,
          topic: payload.topic,
          canonicalModules,
          existingRows: mutatedRows,
          nowIso
        });
        revalidateTheoryProgressViews(payload.topic);

        const scopedRows = filterRowsForCanonicalModules(syncedRows, canonicalModules);
        return {
          body: {
            data: scopedRows,
            storage: 'module_progress',
            warning: undefined
          },
          status: 200
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    // For non-critical 'touch' actions (route bookmarking), return success
    // so the user isn't interrupted while reading
    if (payload.action === 'touch') {
      console.warn('[module-progress POST touch] silenced error:', error instanceof Error ? error.message : error);
      return NextResponse.json({ data: [], warning: 'Touch sync skipped.' });
    }
    return toApiErrorResponse(error, 'Failed to update module progress.');
  }
}
