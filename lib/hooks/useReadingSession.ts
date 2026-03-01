'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { summarizeTheoryProgressFromSessions } from '@/lib/learn/theoryProgress';
import type { TheoryChapter } from '@/types/theory';
import type { Topic } from '@/types/progress';
import { getChapterCompletionRewardUnits } from '@/lib/energy';

interface UseReadingSessionOptions {
  topic: Topic;
  chapter: TheoryChapter;
  currentLessonId: string | null;
  lastVisitedRoute: string | null;
  onChapterComplete?: () => void;
  onChapterIncomplete?: () => void;
  onFirstCompletionEnergyUnits?: (units: number) => void;
}

type ReadingSessionRow = {
  id: string;
  is_completed: boolean;
  active_seconds: number;
  sections_ids_read?: string[] | null;
  completed_lesson_ids?: string[] | null;
  current_lesson_id?: string | null;
  last_visited_route?: string | null;
  xp_awarded?: boolean | null;
};

const RESUME_COLUMNS = [
  'current_lesson_id',
  'completed_lesson_ids',
  'last_visited_route'
];

const missingColumnFromError = (message: string | null | undefined, columns: string[]) =>
  columns.some((column) => message?.includes(column));

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

const mergeCompletedLessons = (
  completedLessonIds: string[],
  currentLessonId: string | null,
  orderedLessonIds: string[]
) => {
  const completedSet = new Set(completedLessonIds);
  if (currentLessonId) {
    completedSet.add(currentLessonId);
  }
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

export function useReadingSession({
  topic,
  chapter,
  currentLessonId,
  lastVisitedRoute,
  onChapterComplete,
  onChapterIncomplete,
  onFirstCompletionEnergyUnits
}: UseReadingSessionOptions) {
  // Keep one browser client instance for the lifetime of this hook.
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  const orderedLessonIds = useMemo(
    () => chapter.sections.map((section) => section.id),
    [chapter.sections]
  );
  const orderedLessonIdSet = useMemo(() => new Set(orderedLessonIds), [orderedLessonIds]);

  const activeSecondsRef = useRef(0);
  const isVisibleRef = useRef(true);
  const xpAwardedRef = useRef(false);
  const completedLessonIdsRef = useRef<string[]>([]);
  const currentLessonIdRef = useRef<string | null>(null);
  const lastVisitedRouteRef = useRef<string | null>(null);
  const chapterCompletionRewardUnits = useMemo(
    () => getChapterCompletionRewardUnits(chapter.totalMinutes),
    [chapter.totalMinutes]
  );

  useEffect(() => {
    activeSecondsRef.current = activeSeconds;
  }, [activeSeconds]);

  const persistLessonState = useCallback(
    async ({
      targetSessionId,
      lessonIds,
      lessonId,
      route,
      touchActiveSeconds
    }: {
      targetSessionId: string;
      lessonIds: string[];
      lessonId: string | null;
      route: string | null;
      touchActiveSeconds: boolean;
    }) => {
      const now = new Date().toISOString();
      const resumePayload = {
        sections_read: lessonIds.length,
        sections_ids_read: lessonIds,
        completed_lesson_ids: lessonIds,
        current_lesson_id: lessonId,
        last_visited_route: route,
        last_active_at: now
      } as Record<string, unknown>;

      if (touchActiveSeconds) {
        resumePayload.active_seconds = activeSecondsRef.current;
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
      if (!user) return;

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
        const resolvedLessonId =
          resumeFromSession ??
          resumeFromRoute ??
          resumeFromCurrent ??
          orderedLessonIds[0] ??
          null;
        const resolvedCompletedLessonIds = mergeCompletedLessons(
          completedFromSession,
          resolvedLessonId,
          orderedLessonIds
        );

        setSessionId(existing.id);
        setIsCompleted(existing.is_completed);
        setActiveSeconds(existing.active_seconds ?? 0);
        setCompletedLessonIds(resolvedCompletedLessonIds);
        activeSecondsRef.current = existing.active_seconds ?? 0;
        xpAwardedRef.current = Boolean(existing.xp_awarded);
        completedLessonIdsRef.current = resolvedCompletedLessonIds;
        currentLessonIdRef.current = resolvedLessonId;
        lastVisitedRouteRef.current =
          lastVisitedRouteRef.current ?? existing.last_visited_route ?? null;

        await persistLessonState({
          targetSessionId: existing.id,
          lessonIds: resolvedCompletedLessonIds,
          lessonId: resolvedLessonId,
          route: lastVisitedRouteRef.current,
          touchActiveSeconds: false
        });
      } else {
        const initialLessonId =
          sanitizeLessonId(currentLessonIdRef.current, orderedLessonIdSet) ??
          orderedLessonIds[0] ??
          null;
        const initialCompletedLessonIds = mergeCompletedLessons(
          [],
          initialLessonId,
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
          current_lesson_id: initialLessonId,
          last_visited_route: lastVisitedRouteRef.current
        };

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
          return;
        }

        if (!mounted || !createResult.data) return;

        setSessionId(createResult.data.id);
        setCompletedLessonIds(initialCompletedLessonIds);
        completedLessonIdsRef.current = initialCompletedLessonIds;
        currentLessonIdRef.current = initialLessonId;
        xpAwardedRef.current = false;

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
    activeSecondsRef.current = 0;
    xpAwardedRef.current = false;
    completedLessonIdsRef.current = [];
    currentLessonIdRef.current = sanitizeLessonId(currentLessonId, orderedLessonIdSet);
    lastVisitedRouteRef.current = lastVisitedRoute ?? null;

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
    persistLessonState,
    supabase,
    topic
  ]);

  useEffect(() => {
    if (!sessionId) return;

    const nextLessonId = sanitizeLessonId(currentLessonId, orderedLessonIdSet);
    const nextCompletedLessonIds = mergeCompletedLessons(
      completedLessonIdsRef.current,
      nextLessonId,
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

    void persistLessonState({
      targetSessionId: sessionId,
      lessonIds: nextCompletedLessonIds,
      lessonId: nextLessonId,
      route: nextRoute,
      touchActiveSeconds: false
    });
  }, [
    currentLessonId,
    lastVisitedRoute,
    orderedLessonIdSet,
    orderedLessonIds,
    persistLessonState,
    sessionId
  ]);

  const flushActiveSeconds = useCallback(async () => {
    if (!sessionId) return;

    const syncedCurrentLessonId = sanitizeLessonId(
      currentLessonIdRef.current,
      orderedLessonIdSet
    );
    const syncedCompletedLessonIds = mergeCompletedLessons(
      completedLessonIdsRef.current,
      syncedCurrentLessonId,
      orderedLessonIds
    );

    if (!sameLessonIds(completedLessonIdsRef.current, syncedCompletedLessonIds)) {
      completedLessonIdsRef.current = syncedCompletedLessonIds;
      setCompletedLessonIds(syncedCompletedLessonIds);
    }

    await persistLessonState({
      targetSessionId: sessionId,
      lessonIds: syncedCompletedLessonIds,
      lessonId: syncedCurrentLessonId,
      route: lastVisitedRouteRef.current,
      touchActiveSeconds: true
    });
  }, [orderedLessonIdSet, orderedLessonIds, persistLessonState, sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const onVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    const tick = window.setInterval(() => {
      if (!isVisibleRef.current) return;
      setActiveSeconds((prev) => prev + 1);
    }, 1000);

    const flush = window.setInterval(() => {
      void flushActiveSeconds();
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(tick);
      window.clearInterval(flush);
      void flushActiveSeconds();
    };
  }, [flushActiveSeconds, sessionId]);

  const updateTopicProgress = useCallback(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sessions, error } = await supabase
      .from('reading_sessions')
      .select(
        'chapter_id,is_completed,active_seconds,sections_read,last_active_at,completed_at'
      )
      .eq('user_id', user.id)
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
      .eq('user_id', user.id)
      .eq('topic', topic);
  }, [supabase, topic]);

  const markChapterComplete = useCallback(async () => {
    if (!sessionId || isCompleted) return;

    const now = new Date().toISOString();
    const currentTrackedLessonId =
      sanitizeLessonId(currentLessonIdRef.current, orderedLessonIdSet) ??
      orderedLessonIds[0] ??
      null;
    const completedLessonIdsForSave = mergeCompletedLessons(
      completedLessonIdsRef.current,
      currentTrackedLessonId,
      orderedLessonIds
    );
    const shouldAwardXp = !xpAwardedRef.current;

    const updatePayload: Record<string, unknown> = {
      sections_read: completedLessonIdsForSave.length,
      sections_ids_read: completedLessonIdsForSave,
      completed_lesson_ids: completedLessonIdsForSave,
      current_lesson_id: currentTrackedLessonId,
      last_visited_route: lastVisitedRouteRef.current,
      is_completed: true,
      completed_by_user: true,
      completed_at: now,
      last_active_at: now,
      active_seconds: activeSecondsRef.current
    };

    if (shouldAwardXp) {
      updatePayload.xp_awarded = true;
      updatePayload.xp_awarded_at = now;
    }

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
    sessionId,
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
    const preservedLessonIds = mergeCompletedLessons(
      completedLessonIdsRef.current,
      currentTrackedLessonId,
      orderedLessonIds
    );

    const { error } = await supabase
      .from('reading_sessions')
      .update({
        sections_read: preservedLessonIds.length,
        sections_ids_read: preservedLessonIds,
        completed_lesson_ids: preservedLessonIds,
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
    sessionId,
    supabase,
    updateTopicProgress
  ]);

  return {
    sessionId,
    isCompleted,
    activeSeconds,
    completedLessonIds,
    markChapterComplete,
    markChapterIncomplete
  };
}
