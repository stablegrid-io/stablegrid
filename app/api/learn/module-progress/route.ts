import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
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

type ModuleProgressAction = 'ensure' | 'complete' | 'incomplete' | 'touch';

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

const TOPIC_SET = new Set<Topic>(['pyspark', 'fabric']);

const isTopic = (value: string): value is Topic => TOPIC_SET.has(value as Topic);

const isAction = (value: unknown): value is ModuleProgressAction =>
  value === 'ensure' ||
  value === 'complete' ||
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

const getCanonicalModules = (topic: Topic): CanonicalModuleEntry[] => {
  const moduleContext = getCanonicalModuleContext(topic);
  return moduleContext.map((module) => ({ id: module.id, order: module.order }));
};

const getCanonicalModuleContext = (topic: Topic): CanonicalModuleContextEntry[] => {
  const doc = theoryDocs[topic];
  if (!doc) {
    return [];
  }

  return sortModulesByOrder(doc.modules ?? doc.chapters).map((module) => ({
    id: module.id,
    order: module.order ?? module.number,
    lessonIds: module.sections.map((section) => section.id),
    sectionsTotal: module.sections.length
  }));
};

const revalidateTheoryProgressViews = (topic: Topic) => {
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
  topic
}: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  topic: Topic;
}) => {
  const canonicalModules = getCanonicalModules(topic);
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

  const canonicalModuleContext = getCanonicalModuleContext(topic);
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
      topic
    });
    return NextResponse.json({ data: rows, storage: 'module_progress' });
  } catch (error) {
    if (isMissingModuleProgressTableError(error)) {
      try {
        const fallbackRows = await fetchFallbackRowsFromReadingSessions({
          supabase,
          userId: user.id,
          topic,
          canonicalModules
        });
        return NextResponse.json({
          data: fallbackRows,
          storage: 'reading_sessions_fallback',
          warning:
            'module_progress table missing; using reading_sessions fallback.'
        });
      } catch (fallbackError) {
        return NextResponse.json(
          {
            error:
              fallbackError instanceof Error
                ? fallbackError.message
                : 'Failed to fetch fallback module progress.'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch module progress.' },
      { status: 500 }
    );
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

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const topic = typeof payload.topic === 'string' ? payload.topic : null;
  if (!topic || !isTopic(topic)) {
    return NextResponse.json({ error: 'Invalid topic.' }, { status: 400 });
  }

  const action = payload.action;
  if (!isAction(action)) {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const canonicalModuleContext = getCanonicalModuleContext(topic);
  const canonicalModules = canonicalModuleContext.map((module) => ({
    id: module.id,
    order: module.order
  }));
  if (canonicalModules.length === 0) {
    return NextResponse.json({ data: [] });
  }

  try {
    let ensuredRows: ModuleProgressRow[];
    let usingFallback = false;

    try {
      ensuredRows = await ensureModuleProgress({
        supabase,
        userId: user.id,
        topic
      });
    } catch (error) {
      if (!isMissingModuleProgressTableError(error)) {
        throw error;
      }

      usingFallback = true;
      ensuredRows = await fetchFallbackRowsFromReadingSessions({
        supabase,
        userId: user.id,
        topic,
        canonicalModules
      });
    }

    if (action === 'ensure') {
      return NextResponse.json({
        data: ensuredRows,
        storage: usingFallback ? 'reading_sessions_fallback' : 'module_progress',
        warning: usingFallback
          ? 'module_progress table missing; using reading_sessions fallback.'
          : undefined
      });
    }

    const moduleId = typeof payload.moduleId === 'string' ? payload.moduleId : null;
    if (!moduleId || !canonicalModules.some((module) => module.id === moduleId)) {
      return NextResponse.json({ error: 'Invalid module id.' }, { status: 400 });
    }

    const targetRow = ensuredRows.find((row) => row.module_id === moduleId);
    if (!targetRow) {
      return NextResponse.json({ error: 'Module progress row missing.' }, { status: 404 });
    }

    if (action === 'complete' && !targetRow.is_unlocked) {
      return NextResponse.json(
        { error: 'Module is locked and cannot be completed yet.' },
        { status: 409 }
      );
    }

    const mutatedRows =
      action === 'complete'
        ? mutateModuleProgressRows({
            rows: ensuredRows,
            moduleId,
            mutation: { type: 'complete' },
            nowIso
          })
        : action === 'incomplete'
          ? mutateModuleProgressRows({
              rows: ensuredRows,
              moduleId,
              mutation: { type: 'incomplete' },
              nowIso
            })
          : mutateModuleProgressRows({
              rows: ensuredRows,
              moduleId,
              mutation: {
                type: 'touch',
                currentLessonId:
                  typeof payload.currentLessonId === 'string' ? payload.currentLessonId : null,
                lastVisitedRoute:
                  typeof payload.lastVisitedRoute === 'string'
                    ? payload.lastVisitedRoute
                    : null
              },
              nowIso
            });

    if (usingFallback) {
      await persistFallbackReadingSessionAction({
        supabase,
        userId: user.id,
        topic,
        moduleContext: canonicalModuleContext,
        action,
        moduleId,
        nowIso,
        currentLessonId:
          typeof payload.currentLessonId === 'string' ? payload.currentLessonId : null,
        lastVisitedRoute:
          typeof payload.lastVisitedRoute === 'string' ? payload.lastVisitedRoute : null
      });
      revalidateTheoryProgressViews(topic);

      const fallbackRows = await fetchFallbackRowsFromReadingSessions({
        supabase,
        userId: user.id,
        topic,
        canonicalModules
      });
      return NextResponse.json({
        data: fallbackRows,
        storage: 'reading_sessions_fallback',
        warning: 'module_progress table missing; using reading_sessions fallback.'
      });
    }

    const syncedRows = await syncModuleProgressChain({
      supabase,
      userId: user.id,
      topic,
      canonicalModules,
      existingRows: mutatedRows,
      nowIso
    });
    revalidateTheoryProgressViews(topic);

    return NextResponse.json({ data: syncedRows, storage: 'module_progress' });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update module progress.'
      },
      { status: 500 }
    );
  }
}
