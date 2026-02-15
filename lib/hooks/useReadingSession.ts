'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TheoryChapter } from '@/types/theory';
import type { Topic } from '@/types/progress';

interface UseReadingSessionOptions {
  topic: Topic;
  chapter: TheoryChapter;
  onChapterComplete?: () => void;
  onChapterIncomplete?: () => void;
  onFirstCompletionXp?: (xp: number) => void;
}

type ReadingSessionRow = {
  id: string;
  is_completed: boolean;
  active_seconds: number;
  xp_awarded?: boolean | null;
};

const READING_COMPLETION_XP = 50;

export function useReadingSession({
  topic,
  chapter,
  onChapterComplete,
  onChapterIncomplete,
  onFirstCompletionXp
}: UseReadingSessionOptions) {
  // Keep one browser client instance for the lifetime of this hook.
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);

  const activeSecondsRef = useRef(0);
  const isVisibleRef = useRef(true);
  const xpAwardedRef = useRef(false);

  useEffect(() => {
    activeSecondsRef.current = activeSeconds;
  }, [activeSeconds]);

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
        setSessionId(existing.id);
        setIsCompleted(existing.is_completed);
        setActiveSeconds(existing.active_seconds ?? 0);
        activeSecondsRef.current = existing.active_seconds ?? 0;
        xpAwardedRef.current = Boolean(existing.xp_awarded);

        await supabase
          .from('reading_sessions')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        const { data: created, error: createError } = await supabase
          .from('reading_sessions')
          .insert({
            user_id: user.id,
            topic,
            chapter_id: chapter.id,
            chapter_number: chapter.number,
            sections_total: chapter.sections.length,
            sections_read: 0
          })
          .select('id')
          .single<{ id: string }>();

        if (createError) {
          console.warn('Failed to create reading session:', createError.message);
          return;
        }

        if (!mounted || !created) return;
        setSessionId(created.id);
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
    activeSecondsRef.current = 0;
    xpAwardedRef.current = false;

    initSession();

    return () => {
      mounted = false;
    };
  }, [chapter.id, chapter.number, chapter.sections.length, supabase, topic]);

  const flushActiveSeconds = useCallback(async () => {
    if (!sessionId) return;
    await supabase
      .from('reading_sessions')
      .update({
        active_seconds: activeSecondsRef.current,
        last_active_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  }, [sessionId, supabase]);

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
      .select('is_completed, active_seconds, sections_total, sections_read')
      .eq('user_id', user.id)
      .eq('topic', topic);

    if (error || !sessions) return;

    const completed = sessions.filter((row) => row.is_completed).length;
    const totalSeconds = sessions.reduce(
      (sum, row) => sum + (row.active_seconds ?? 0),
      0
    );
    const sectionsTotal = sessions.reduce(
      (sum, row) => sum + (row.sections_total ?? 0),
      0
    );
    const sectionsReadCount = sessions.reduce(
      (sum, row) => sum + (row.sections_read ?? 0),
      0
    );

    await supabase
      .from('topic_progress')
      .update({
        theory_chapters_completed: completed,
        theory_sections_total: sectionsTotal,
        theory_sections_read: sectionsReadCount,
        theory_total_minutes_read: Math.round(totalSeconds / 60),
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('topic', topic);
  }, [supabase, topic]);

  const markChapterComplete = useCallback(async () => {
    if (!sessionId || isCompleted) return;

    const now = new Date().toISOString();
    const allSectionIds = chapter.sections.map((section) => section.id);
    const shouldAwardXp = !xpAwardedRef.current;

    const updatePayload: Record<string, unknown> = {
      sections_read: allSectionIds.length,
      sections_ids_read: allSectionIds,
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

    // Backward compatibility if DB migration was not applied yet.
    if (updateError && updateError.includes('xp_awarded')) {
      const { error: fallbackError } = await supabase
        .from('reading_sessions')
        .update({
          sections_read: allSectionIds.length,
          sections_ids_read: allSectionIds,
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

    setIsCompleted(true);
    if (shouldAwardXp) {
      xpAwardedRef.current = true;
      onFirstCompletionXp?.(READING_COMPLETION_XP);
    }
    onChapterComplete?.();
    await updateTopicProgress();
  }, [
    chapter.sections,
    isCompleted,
    onFirstCompletionXp,
    onChapterComplete,
    sessionId,
    supabase,
    updateTopicProgress
  ]);

  const markChapterIncomplete = useCallback(async () => {
    if (!sessionId || !isCompleted) return;

    const now = new Date().toISOString();

    await supabase
      .from('reading_sessions')
      .update({
        sections_read: 0,
        sections_ids_read: [],
        is_completed: false,
        completed_by_user: false,
        completed_at: null,
        last_active_at: now,
        active_seconds: activeSecondsRef.current
      })
      .eq('id', sessionId);

    setIsCompleted(false);
    onChapterIncomplete?.();
    await updateTopicProgress();
  }, [isCompleted, onChapterIncomplete, sessionId, supabase, updateTopicProgress]);

  return {
    sessionId,
    isCompleted,
    activeSeconds,
    markChapterComplete,
    markChapterIncomplete
  };
}
