'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { summarizeTheoryProgressFromSessions } from '@/lib/learn/theoryProgress';
import {
  getReadLessonIds,
  type LessonSecondsById,
  sanitizeLessonSecondsById,
  seedLessonSecondsFromCompletedLessons
} from '@/lib/learn/lessonReadProgress';
import { sortLessonsByOrder } from '@/lib/learn/freezeTheoryDoc';
import type { TheoryChapter } from '@/types/theory';
import type { Topic } from '@/types/progress';
import type { TheorySessionMethodId } from '@/lib/learn/theorySession';
import { getChapterCompletionRewardUnits } from '@/lib/energy';

interface UseReadingSessionOptions {
  topic: Topic;
  chapter: TheoryChapter;
  currentLessonId: string | null;
  lastVisitedRoute: string | null;
  sessionMethod?: TheorySessionMethodId | null;
  onChapterComplete?: () => void;
  onChapterIncomplete?: () => void;
  onFirstCompletionEnergyUnits?: (units: number) => void;
  onLessonRead?: (lessonId: string) => void;
}

type ReadingSessionRow = {
  id: string;
  is_completed: boolean;
  active_seconds: number;
  sections_ids_read?: string[] | null;
  completed_lesson_ids?: string[] | null;
  current_lesson_id?: string | null;
  last_visited_route?: string | null;
  lesson_seconds_by_id?: LessonSecondsById | null;
  xp_awarded?: boolean | null;
};

const RESUME_COLUMNS = [
  'current_lesson_id',
  'completed_lesson_ids',
  'last_visited_route',
  'lesson_seconds_by_id',
  'session_method'
];

const missingColumnFromError = (message: string | null | undefined, columns: string[]) =>
  columns.some((column) => message?.includes(column));

const hasMissingLessonHistoryTableError = (message: string | null | undefined) =>
  typeof message === 'string' &&
  (message.includes('reading_lesson_history') || message.includes('lesson_history'));

const parseLessonIdFromRoute = (route: string | null | undefined) => {
  if (typeof route !== 'string' || !route.includes('?')) {
    return null;
  }
  const [, query = ''] = route.split('?');
  const params = new URLSearchParams(query);
  const lessonId = params.get('lesson');
  return lessonId && lessonId.trim().length > 0 ? lessonId : null;
};

const sanitizeLessonId = (value: string | null | undefined, lessonIds: Set<string>) => {
  if (!value) return null;
  return lessonIds.has(value) ? value : null;
};

const sanitizeCompletedLessonIds = (
  value: string[] | null | undefined,
  orderedLessonIds: string[],
  lessonIdSet: Set<string>
) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const completedSet = new Set<string>();
  value.forEach((lessonId) => {
    if (typeof lessonId === 'string' && lessonIdSet.has(lessonId)) {
      completedSet.add(lessonId);
    }
  });

  return orderedLessonIds.filter((lessonId) => completedSet.has(lessonId));
};

const sameLessonIds = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
};

interface ReadingSessionShadowSnapshot {
  lesson_seconds_by_id?: LessonSecondsById | null;
  completed_lesson_ids?: string[] | null;
  current_lesson_id?: string | null;
  last_visited_route?: string | null;
}

const READING_SESSION_SHADOW_STORAGE_PREFIX = 'theory-reading-session-shadow';

const buildReadingSessionShadowStorageKey = ({
  userId,
  topic,
  chapterId
}: {
  userId: string;
  topic: Topic;
  chapterId: string;
}) => `${READING_SESSION_SHADOW_STORAGE_PREFIX}:${userId}:${topic}:${chapterId}`;

const mergeLessonSecondsById = (
  left: LessonSecondsById,
  right: LessonSecondsById,
  orderedLessonIds: string[]
) =>
  orderedLessonIds.reduce<LessonSecondsById>((accumulator, lessonId) => {
    const nextValue = Math.max(left[lessonId] ?? 0, right[lessonId] ?? 0);
    if (nextValue > 0) {
      accumulator[lessonId] = nextValue;
    }
    return accumulator;
  }, {});

export function useReadingSession({
  topic,
  chapter,
  currentLessonId,
  lastVisitedRoute,
  sessionMethod,
  onChapterComplete,
  onChapterIncomplete,
  onFirstCompletionEnergyUnits,
  onLessonRead
}: UseReadingSessionOptions) {
  // Keep one browser client instance for the lifetime of this hook.
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const sessionMethodRef = useRef<TheorySessionMethodId | null>(sessionMethod ?? null);
  useEffect(() => {
    sessionMethodRef.current = sessionMethod ?? null;
  }, [sessionMethod]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const orderedLessons = useMemo(
    () => sortLessonsByOrder(chapter.sections),
    [chapter.sections]
  );
  const orderedLessonIds = useMemo(
    () => orderedLessons.map((section) => section.id),
    [orderedLessons]
  );
  const orderedLessonIdSet = useMemo(() => new Set(orderedLessonIds), [orderedLessonIds]);
  const lessonOrderById = useMemo(
    () =>
      orderedLessons.reduce<Record<string, number>>((accumulator, lesson, index) => {
        accumulator[lesson.id] = lesson.order ?? index + 1;
        return accumulator;
      }, {}),
    [orderedLessons]
  );

  const activeSecondsRef = useRef(0);
  const isVisibleRef = useRef(true);
  const xpAwardedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const lessonSecondsByIdRef = useRef<LessonSecondsById>({});
  const completedLessonIdsRef = useRef<string[]>([]);
  const currentLessonIdRef = useRef<string | null>(null);
  const lastVisitedRouteRef = useRef<string | null>(null);
  const shadowStorageKeyRef = useRef<string | null>(null);
  const chapterCompletionRewardUnits = useMemo(
    () => getChapterCompletionRewardUnits(chapter.totalMinutes),
    [chapter.totalMinutes]
  );

  useEffect(() => {
    activeSecondsRef.current = activeSeconds;
  }, [activeSeconds]);

  const readShadowSnapshot = useCallback(
    (storageKey: string | null): ReadingSessionShadowSnapshot => {
      if (!storageKey || typeof window === 'undefined') {
        return {};
      }

      try {
        const rawValue = window.sessionStorage.getItem(storageKey);
        if (!rawValue) {
          return {};
        }

        const parsedValue = JSON.parse(rawValue) as ReadingSessionShadowSnapshot;
        return {
          lesson_seconds_by_id: sanitizeLessonSecondsById(
            parsedValue.lesson_seconds_by_id,
            orderedLessonIds,
            orderedLessonIdSet
          ),
          completed_lesson_ids: sanitizeCompletedLessonIds(
            parsedValue.completed_lesson_ids,
            orderedLessonIds,
            orderedLessonIdSet
          ),
          current_lesson_id: sanitizeLessonId(
            parsedValue.current_lesson_id,
            orderedLessonIdSet
          ),
          last_visited_route:
            typeof parsedValue.last_visited_route === 'string'
              ? parsedValue.last_visited_route
              : null
        };
      } catch {
        return {};
      }
    },
    [orderedLessonIdSet, orderedLessonIds]
  );

  const persistShadowSnapshot = useCallback(
    ({
      lessonSecondsById,
      lessonIds,
      lessonId,
      route
    }: {
      lessonSecondsById: LessonSecondsById;
      lessonIds: string[];
      lessonId: string | null;
      route: string | null;
    }) => {
      const storageKey = shadowStorageKeyRef.current;
      if (!storageKey || typeof window === 'undefined') {
        return;
      }

      try {
        const payload: ReadingSessionShadowSnapshot = {
          lesson_seconds_by_id: lessonSecondsById,
          completed_lesson_ids: lessonIds,
          current_lesson_id: lessonId,
          last_visited_route: route
        };
        window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        // Ignore storage failures; the server-backed row remains the primary source of truth.
      }
    },
    []
  );

  const persistReadLessonHistory = useCallback(
    async (newlyReadLessonIds: string[], targetSessionId: string | null) => {
      if (newlyReadLessonIds.length === 0 || !targetSessionId || !userIdRef.current) {
        return;
      }

      const now = new Date().toISOString();
      const historyRows = newlyReadLessonIds.map((lessonId) => ({
        user_id: userIdRef.current,
        topic,
        chapter_id: chapter.id,
        chapter_number: chapter.number,
        lesson_id: lessonId,
        lesson_order: lessonOrderById[lessonId] ?? 1,
        read_at: now,
        source_session_id: targetSessionId
      }));

      const { error } = await supabase.from('reading_lesson_history').upsert(historyRows, {
        onConflict: 'user_id,topic,chapter_id,lesson_id',
        ignoreDuplicates: true
      });

      if (error && !hasMissingLessonHistoryTableError(error.message)) {
        console.warn('Failed to persist lesson history:', error.message);
      }
    },
    [chapter.id, chapter.number, lessonOrderById, supabase, topic]
  );

  const syncCompletedLessonsFromSeconds = useCallback(
    (lessonSecondsById: LessonSecondsById) => {
      const previousCompletedLessonIds = completedLessonIdsRef.current;
      const nextCompletedLessonIds = getReadLessonIds(lessonSecondsById, orderedLessonIds);
      const newlyReadLessonIds = nextCompletedLessonIds.filter(
        (lessonId) => !previousCompletedLessonIds.includes(lessonId)
      );

      if (!sameLessonIds(completedLessonIdsRef.current, nextCompletedLessonIds)) {
        completedLessonIdsRef.current = nextCompletedLessonIds;
        setCompletedLessonIds(nextCompletedLessonIds);
      }

      if (newlyReadLessonIds.length > 0) {
        void persistReadLessonHistory(newlyReadLessonIds, sessionId);
        newlyReadLessonIds.forEach((id) => onLessonRead?.(id));
      }

      return nextCompletedLessonIds;
    },
    [orderedLessonIds, persistReadLessonHistory, sessionId]
  );

  const persistLessonState = useCallback(
    async ({
      targetSessionId,
      lessonIds,
      lessonSecondsById,
      lessonId,
      route,
      touchActiveSeconds
    }: {
      targetSessionId: string;
      lessonIds: string[];
      lessonSecondsById: LessonSecondsById;
      lessonId: string | null;
      route: string | null;
      touchActiveSeconds: boolean;
    }) => {
      const now = new Date().toISOString();
      const resumePayload = {
        sections_read: lessonIds.length,
        sections_ids_read: lessonIds,
        completed_lesson_ids: lessonIds,
        lesson_seconds_by_id: lessonSecondsById,
        current_lesson_id: lessonId,
        last_visited_route: route,
        last_active_at: now
      } as Record<string, unknown>;

      if (touchActiveSeconds) {
        resumePayload.active_seconds = activeSecondsRef.current;
      }

      if (sessionMethodRef.current) {
        resumePayload.session_method = sessionMethodRef.current;
      }

      const { error: resumeError } = await supabase
        .from('reading_sessions')
        .update(resumePayload)
        .eq('id', targetSessionId);

      if (!resumeError) {
        return;
      }

      if (!missingColumnFromError(resumeError.message, RESUME_COLUMNS)) {
        console.warn('Failed to persist lesson state:', resumeError.message);
        return;
      }

      const legacyPayload: Record<string, unknown> = {
        sections_read: lessonIds.length,
        sections_ids_read: lessonIds,
        last_active_at: now
      };

      if (touchActiveSeconds) {
        legacyPayload.active_seconds = activeSecondsRef.current;
      }

      const { error: legacyError } = await supabase
        .from('reading_sessions')
        .update(legacyPayload)
        .eq('id', targetSessionId);

      if (legacyError) {
        console.warn('Failed to persist lesson state:', legacyError.message);
      }
    },
    [supabase]
  );

  useEffect(() => {
    currentLessonIdRef.current = sanitizeLessonId(currentLessonId, orderedLessonIdSet);
  }, [currentLessonId, orderedLessonIdSet]);

  useEffect(() => {
    lastVisitedRouteRef.current = lastVisitedRoute ?? null;
  }, [lastVisitedRoute]);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) {
          setIsHydrated(true);
        }
        return;
      }
      userIdRef.current = user.id;
      shadowStorageKeyRef.current = buildReadingSessionShadowStorageKey({
        userId: user.id,
        topic,
        chapterId: chapter.id
      });
      const shadowSnapshot = readShadowSnapshot(shadowStorageKeyRef.current);

      const { data: existing, error: existingError } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic', topic)
        .eq('chapter_id', chapter.id)
        .maybeSingle<ReadingSessionRow>();

      if (existingError) {
        console.warn('Failed to fetch reading session:', existingError.message);
      }

      if (existing) {
        if (!mounted) return;

        const completedFromSession = sanitizeCompletedLessonIds(
          existing.completed_lesson_ids ?? existing.sections_ids_read,
          orderedLessonIds,
          orderedLessonIdSet
        );
        const completedFromShadow = sanitizeCompletedLessonIds(
          shadowSnapshot.completed_lesson_ids,
          orderedLessonIds,
          orderedLessonIdSet
        );
        const lessonSecondsFromSession = sanitizeLessonSecondsById(
          existing.lesson_seconds_by_id,
          orderedLessonIds,
          orderedLessonIdSet
        );
        const lessonSecondsFromShadow = sanitizeLessonSecondsById(
          shadowSnapshot.lesson_seconds_by_id,
          orderedLessonIds,
          orderedLessonIdSet
        );
        const resumeFromSession = sanitizeLessonId(
          existing.current_lesson_id,
          orderedLessonIdSet
        );
        const resumeFromRoute = sanitizeLessonId(
          parseLessonIdFromRoute(existing.last_visited_route),
          orderedLessonIdSet
        );
        const resumeFromCurrent = sanitizeLessonId(
          currentLessonIdRef.current,
          orderedLessonIdSet
        );
        const resumeFromShadow = sanitizeLessonId(
          shadowSnapshot.current_lesson_id,
          orderedLessonIdSet
        );
        const resolvedLessonId =
          resumeFromCurrent ??
          resumeFromShadow ??
          resumeFromSession ??
          resumeFromRoute ??
          orderedLessonIds[0] ??
          null;
        const resolvedLessonSecondsById = seedLessonSecondsFromCompletedLessons(
          mergeLessonSecondsById(
            lessonSecondsFromSession,
            lessonSecondsFromShadow,
            orderedLessonIds
          ),
          orderedLessonIds.filter(
            (lessonId) =>
              completedFromSession.includes(lessonId) ||
              completedFromShadow.includes(lessonId)
          )
        );
        const resolvedCompletedLessonIds = getReadLessonIds(
          resolvedLessonSecondsById,
          orderedLessonIds
        );

        setSessionId(existing.id);
        setIsCompleted(existing.is_completed);
        setActiveSeconds(existing.active_seconds ?? 0);
        setCompletedLessonIds(resolvedCompletedLessonIds);
        setIsHydrated(true);
        activeSecondsRef.current = existing.active_seconds ?? 0;
        xpAwardedRef.current = Boolean(existing.xp_awarded);
        lessonSecondsByIdRef.current = resolvedLessonSecondsById;
        completedLessonIdsRef.current = resolvedCompletedLessonIds;
        currentLessonIdRef.current = resolvedLessonId;
        lastVisitedRouteRef.current =
          lastVisitedRouteRef.current ??
          shadowSnapshot.last_visited_route ??
          existing.last_visited_route ??
          null;
        persistShadowSnapshot({
          lessonSecondsById: resolvedLessonSecondsById,
          lessonIds: resolvedCompletedLessonIds,
          lessonId: resolvedLessonId,
          route: lastVisitedRouteRef.current
        });

        await persistLessonState({
          targetSessionId: existing.id,
          lessonIds: resolvedCompletedLessonIds,
          lessonSecondsById: resolvedLessonSecondsById,
          lessonId: resolvedLessonId,
          route: lastVisitedRouteRef.current,
          touchActiveSeconds: false
        });
      } else {
        const initialShadowLessonSecondsById = sanitizeLessonSecondsById(
          shadowSnapshot.lesson_seconds_by_id,
          orderedLessonIds,
          orderedLessonIdSet
        );
        const initialShadowCompletedLessonIds = sanitizeCompletedLessonIds(
          shadowSnapshot.completed_lesson_ids,
          orderedLessonIds,
          orderedLessonIdSet
        );
        const initialLessonId =
          sanitizeLessonId(currentLessonIdRef.current, orderedLessonIdSet) ??
          sanitizeLessonId(shadowSnapshot.current_lesson_id, orderedLessonIdSet) ??
          orderedLessonIds[0] ??
          null;
        const initialLessonSecondsById = seedLessonSecondsFromCompletedLessons(
          initialShadowLessonSecondsById,
          initialShadowCompletedLessonIds
        );
        const initialCompletedLessonIds = getReadLessonIds(
          initialLessonSecondsById,
          orderedLessonIds
        );

        const createPayload: Record<string, unknown> = {
          user_id: user.id,
          topic,
          chapter_id: chapter.id,
          chapter_number: chapter.number,
          sections_total: chapter.sections.length,
          sections_read: initialCompletedLessonIds.length,
          sections_ids_read: initialCompletedLessonIds,
          completed_lesson_ids: initialCompletedLessonIds,
          lesson_seconds_by_id: initialLessonSecondsById,
          current_lesson_id: initialLessonId,
          last_visited_route:
            lastVisitedRouteRef.current ?? shadowSnapshot.last_visited_route ?? null
        };
        if (sessionMethodRef.current) {
          createPayload.session_method = sessionMethodRef.current;
        }

        let createResult = await supabase
          .from('reading_sessions')
          .insert(createPayload)
          .select('id')
          .single<{ id: string }>();

        if (
          createResult.error &&
          missingColumnFromError(createResult.error.message, RESUME_COLUMNS)
        ) {
          createResult = await supabase
            .from('reading_sessions')
            .insert({
              user_id: user.id,
              topic,
              chapter_id: chapter.id,
              chapter_number: chapter.number,
              sections_total: chapter.sections.length,
              sections_read: initialCompletedLessonIds.length,
              sections_ids_read: initialCompletedLessonIds
            })
            .select('id')
            .single<{ id: string }>();
        }

        if (createResult.error) {
          console.warn('Failed to create reading session:', createResult.error.message);
          if (mounted) {
            setIsHydrated(true);
          }
          return;
        }

        if (!mounted || !createResult.data) return;

        setSessionId(createResult.data.id);
        setCompletedLessonIds(initialCompletedLessonIds);
        setIsHydrated(true);
        lessonSecondsByIdRef.current = initialLessonSecondsById;
        completedLessonIdsRef.current = initialCompletedLessonIds;
        currentLessonIdRef.current = initialLessonId;
        xpAwardedRef.current = false;
        persistShadowSnapshot({
          lessonSecondsById: initialLessonSecondsById,
          lessonIds: initialCompletedLessonIds,
          lessonId: initialLessonId,
          route: lastVisitedRouteRef.current ?? shadowSnapshot.last_visited_route ?? null
        });

        await supabase.from('topic_progress').upsert(
          {
            user_id: user.id,
            topic,
            first_activity_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,topic' }
        );
      }
    };

    setSessionId(null);
    setIsCompleted(false);
    setActiveSeconds(0);
    setCompletedLessonIds([]);
    setIsHydrated(false);
    activeSecondsRef.current = 0;
    xpAwardedRef.current = false;
    userIdRef.current = null;
    shadowStorageKeyRef.current = null;
    lessonSecondsByIdRef.current = {};
    completedLessonIdsRef.current = [];
    currentLessonIdRef.current = sanitizeLessonId(
      currentLessonIdRef.current,
      orderedLessonIdSet
    );
    lastVisitedRouteRef.current = lastVisitedRouteRef.current ?? null;

    void initSession();

    return () => {
      mounted = false;
    };
  }, [
    chapter.id,
    chapter.number,
    chapter.sections.length,
    orderedLessonIdSet,
    orderedLessonIds,
    persistShadowSnapshot,
    persistLessonState,
    readShadowSnapshot,
    supabase,
    topic
  ]);

  useEffect(() => {
    if (!sessionId) return;

    const nextLessonId = sanitizeLessonId(currentLessonId, orderedLessonIdSet);
    const nextCompletedLessonIds = getReadLessonIds(
      lessonSecondsByIdRef.current,
      orderedLessonIds
    );
    const nextRoute = lastVisitedRoute ?? null;
    const didLessonsChange = !sameLessonIds(
      completedLessonIdsRef.current,
      nextCompletedLessonIds
    );
    const didCurrentLessonChange = currentLessonIdRef.current !== nextLessonId;
    const didRouteChange = lastVisitedRouteRef.current !== nextRoute;

    if (!didLessonsChange && !didCurrentLessonChange && !didRouteChange) {
      return;
    }

    currentLessonIdRef.current = nextLessonId;
    lastVisitedRouteRef.current = nextRoute;
    completedLessonIdsRef.current = nextCompletedLessonIds;
    setCompletedLessonIds(nextCompletedLessonIds);
    persistShadowSnapshot({
      lessonSecondsById: lessonSecondsByIdRef.current,
      lessonIds: nextCompletedLessonIds,
      lessonId: nextLessonId,
      route: nextRoute
    });

    void persistLessonState({
      targetSessionId: sessionId,
      lessonIds: nextCompletedLessonIds,
      lessonSecondsById: lessonSecondsByIdRef.current,
      lessonId: nextLessonId,
      route: nextRoute,
      touchActiveSeconds: false
    });
  }, [
    currentLessonId,
    lastVisitedRoute,
    orderedLessonIdSet,
    orderedLessonIds,
    persistShadowSnapshot,
    persistLessonState,
    sessionId
  ]);

  const updateTopicProgress = useCallback(async () => {
    let userId = userIdRef.current;
    if (!userId) {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }

    if (!userId) return;

    const { data: sessions, error } = await supabase
      .from('reading_sessions')
      .select(
        'chapter_id,is_completed,active_seconds,sections_read,sections_ids_read,completed_lesson_ids,lesson_seconds_by_id,last_active_at,completed_at'
      )
      .eq('user_id', userId)
      .eq('topic', topic);

    if (error || !sessions) return;

    const summary = summarizeTheoryProgressFromSessions(topic, sessions);

    await supabase
      .from('topic_progress')
      .update({
        theory_chapters_total: summary.chapterTotal,
        theory_chapters_completed: summary.chapterCompleted,
        theory_sections_total: summary.sectionTotal,
        theory_sections_read: summary.sectionRead,
        theory_total_minutes_read: Math.round(summary.totalSeconds / 60),
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('topic', topic);
  }, [supabase, topic]);

  const persistReadThresholdProgress = useCallback(
    async (lessonIds: string[], lessonSecondsById: LessonSecondsById) => {
      if (!sessionId) {
        return;
      }

      const syncedCurrentLessonId = sanitizeLessonId(
        currentLessonIdRef.current,
        orderedLessonIdSet
      );

      await persistLessonState({
        targetSessionId: sessionId,
        lessonIds,
        lessonSecondsById,
        lessonId: syncedCurrentLessonId,
        route: lastVisitedRouteRef.current,
        touchActiveSeconds: false
      });
      await updateTopicProgress();
    },
    [orderedLessonIdSet, persistLessonState, sessionId, updateTopicProgress]
  );

  const flushActiveSeconds = useCallback(async () => {
    if (!sessionId) return;

    const syncedCurrentLessonId = sanitizeLessonId(
      currentLessonIdRef.current,
      orderedLessonIdSet
    );
    const syncedCompletedLessonIds = syncCompletedLessonsFromSeconds(
      lessonSecondsByIdRef.current
    );
    persistShadowSnapshot({
      lessonSecondsById: lessonSecondsByIdRef.current,
      lessonIds: syncedCompletedLessonIds,
      lessonId: syncedCurrentLessonId,
      route: lastVisitedRouteRef.current
    });

    await persistLessonState({
      targetSessionId: sessionId,
      lessonIds: syncedCompletedLessonIds,
      lessonSecondsById: lessonSecondsByIdRef.current,
      lessonId: syncedCurrentLessonId,
      route: lastVisitedRouteRef.current,
      touchActiveSeconds: true
    });
  }, [
    orderedLessonIdSet,
    persistShadowSnapshot,
    persistLessonState,
    sessionId,
    syncCompletedLessonsFromSeconds
  ]);

  useEffect(() => {
    if (!sessionId) return;

    const onVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };
    const persistPageSnapshot = () => {
      const syncedCurrentLessonId = sanitizeLessonId(
        currentLessonIdRef.current,
        orderedLessonIdSet
      );
      const syncedCompletedLessonIds = getReadLessonIds(
        lessonSecondsByIdRef.current,
        orderedLessonIds
      );
      persistShadowSnapshot({
        lessonSecondsById: lessonSecondsByIdRef.current,
        lessonIds: syncedCompletedLessonIds,
        lessonId: syncedCurrentLessonId,
        route: lastVisitedRouteRef.current
      });
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', persistPageSnapshot);

    const tick = window.setInterval(() => {
      if (!isVisibleRef.current) return;

      const lessonId = sanitizeLessonId(currentLessonIdRef.current, orderedLessonIdSet);
      if (lessonId) {
        const previousCompletedLessonIds = completedLessonIdsRef.current;
        const nextLessonSecondsById = {
          ...lessonSecondsByIdRef.current,
          [lessonId]: (lessonSecondsByIdRef.current[lessonId] ?? 0) + 1
        };
        lessonSecondsByIdRef.current = nextLessonSecondsById;
        const nextCompletedLessonIds = syncCompletedLessonsFromSeconds(
          nextLessonSecondsById
        );

        // Persist the read threshold immediately so reloads and module re-entry
        // never show a completed lesson as unread again.
        if (!sameLessonIds(previousCompletedLessonIds, nextCompletedLessonIds)) {
          persistShadowSnapshot({
            lessonSecondsById: nextLessonSecondsById,
            lessonIds: nextCompletedLessonIds,
            lessonId,
            route: lastVisitedRouteRef.current
          });
          void persistReadThresholdProgress(
            nextCompletedLessonIds,
            nextLessonSecondsById
          );
        }
      }

      setActiveSeconds((prev) => prev + 1);
    }, 1000);

    const flush = window.setInterval(() => {
      void flushActiveSeconds();
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', persistPageSnapshot);
      persistPageSnapshot();
      window.clearInterval(tick);
      window.clearInterval(flush);
      void flushActiveSeconds();
    };
  }, [
    flushActiveSeconds,
    orderedLessonIdSet,
    orderedLessonIds,
    persistShadowSnapshot,
    persistReadThresholdProgress,
    sessionId,
    syncCompletedLessonsFromSeconds
  ]);

  const markChapterComplete = useCallback(async () => {
    if (!sessionId || isCompleted) return;

    const now = new Date().toISOString();
    const currentTrackedLessonId =
      sanitizeLessonId(currentLessonIdRef.current, orderedLessonIdSet) ??
      orderedLessonIds[0] ??
      null;
    const completedLessonIdsForSave = syncCompletedLessonsFromSeconds(
      lessonSecondsByIdRef.current
    );
    const shouldAwardXp = !xpAwardedRef.current;

    const updatePayload: Record<string, unknown> = {
      sections_read: completedLessonIdsForSave.length,
      sections_ids_read: completedLessonIdsForSave,
      completed_lesson_ids: completedLessonIdsForSave,
      lesson_seconds_by_id: lessonSecondsByIdRef.current,
      current_lesson_id: currentTrackedLessonId,
      last_visited_route: lastVisitedRouteRef.current,
      is_completed: true,
      completed_by_user: true,
      completed_at: now,
      last_active_at: now,
      active_seconds: activeSecondsRef.current
    };

    if (sessionMethodRef.current) {
      updatePayload.session_method = sessionMethodRef.current;
    }

    if (shouldAwardXp) {
      updatePayload.xp_awarded = true;
      updatePayload.xp_awarded_at = now;
    }
    persistShadowSnapshot({
      lessonSecondsById: lessonSecondsByIdRef.current,
      lessonIds: completedLessonIdsForSave,
      lessonId: currentTrackedLessonId,
      route: lastVisitedRouteRef.current
    });

    let updateError: string | null = null;

    const { error } = await supabase
      .from('reading_sessions')
      .update(updatePayload)
      .eq('id', sessionId);

    if (error) {
      updateError = error.message;
    }

    // Backward compatibility if DB migrations were not applied yet.
    if (
      updateError &&
      (updateError.includes('xp_awarded') ||
        missingColumnFromError(updateError, RESUME_COLUMNS))
    ) {
      const { error: fallbackError } = await supabase
        .from('reading_sessions')
        .update({
          sections_read: completedLessonIdsForSave.length,
          sections_ids_read: completedLessonIdsForSave,
          is_completed: true,
          completed_by_user: true,
          completed_at: now,
          last_active_at: now,
          active_seconds: activeSecondsRef.current
        })
        .eq('id', sessionId);

      if (fallbackError) {
        console.warn('Failed to mark chapter complete:', fallbackError.message);
        return;
      }
    } else if (updateError) {
      console.warn('Failed to mark chapter complete:', updateError);
      return;
    }

    completedLessonIdsRef.current = completedLessonIdsForSave;
    setCompletedLessonIds(completedLessonIdsForSave);
    setIsCompleted(true);
    if (shouldAwardXp) {
      xpAwardedRef.current = true;
      onFirstCompletionEnergyUnits?.(chapterCompletionRewardUnits);
    }
    onChapterComplete?.();
    await updateTopicProgress();
  }, [
    chapterCompletionRewardUnits,
    isCompleted,
    onChapterComplete,
    onFirstCompletionEnergyUnits,
    orderedLessonIdSet,
    orderedLessonIds,
    persistShadowSnapshot,
    sessionId,
    syncCompletedLessonsFromSeconds,
    supabase,
    updateTopicProgress
  ]);

  const markChapterIncomplete = useCallback(async () => {
    if (!sessionId || !isCompleted) return;

    const now = new Date().toISOString();
    const currentTrackedLessonId =
      sanitizeLessonId(currentLessonIdRef.current, orderedLessonIdSet) ??
      orderedLessonIds[0] ??
      null;
    const preservedLessonIds = syncCompletedLessonsFromSeconds(
      lessonSecondsByIdRef.current
    );
    persistShadowSnapshot({
      lessonSecondsById: lessonSecondsByIdRef.current,
      lessonIds: preservedLessonIds,
      lessonId: currentTrackedLessonId,
      route: lastVisitedRouteRef.current
    });

    const { error } = await supabase
      .from('reading_sessions')
      .update({
        sections_read: preservedLessonIds.length,
        sections_ids_read: preservedLessonIds,
        completed_lesson_ids: preservedLessonIds,
        lesson_seconds_by_id: lessonSecondsByIdRef.current,
        current_lesson_id: currentTrackedLessonId,
        last_visited_route: lastVisitedRouteRef.current,
        is_completed: false,
        completed_by_user: false,
        completed_at: null,
        last_active_at: now,
        active_seconds: activeSecondsRef.current
      })
      .eq('id', sessionId);

    if (error && missingColumnFromError(error.message, RESUME_COLUMNS)) {
      const { error: fallbackError } = await supabase
        .from('reading_sessions')
        .update({
          sections_read: preservedLessonIds.length,
          sections_ids_read: preservedLessonIds,
          is_completed: false,
          completed_by_user: false,
          completed_at: null,
          last_active_at: now,
          active_seconds: activeSecondsRef.current
        })
        .eq('id', sessionId);

      if (fallbackError) {
        console.warn('Failed to mark chapter incomplete:', fallbackError.message);
        return;
      }
    } else if (error) {
      console.warn('Failed to mark chapter incomplete:', error.message);
      return;
    }

    completedLessonIdsRef.current = preservedLessonIds;
    setCompletedLessonIds(preservedLessonIds);
    setIsCompleted(false);
    onChapterIncomplete?.();
    await updateTopicProgress();
  }, [
    isCompleted,
    onChapterIncomplete,
    orderedLessonIdSet,
    orderedLessonIds,
    persistShadowSnapshot,
    sessionId,
    syncCompletedLessonsFromSeconds,
    supabase,
    updateTopicProgress
  ]);

  return {
    sessionId,
    isCompleted,
    activeSeconds,
    completedLessonIds,
    isHydrated,
    markChapterComplete,
    markChapterIncomplete
  };
}
