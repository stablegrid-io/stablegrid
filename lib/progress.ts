'use client';

import { createClient } from '@/lib/supabase/client';
import type { Topic } from '@/types/progress';

const safeWarn = (scope: string, error: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[progress] ${scope}`, error);
  }
};

export async function getTopicProgress(topic: Topic) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('topic_progress')
    .select(
      'id,user_id,topic,theory_chapters_total,theory_chapters_completed,theory_sections_total,theory_sections_read,theory_total_minutes_read,practice_questions_total,practice_questions_attempted,practice_questions_correct,functions_total,functions_viewed,functions_bookmarked,overall_completion_pct,first_activity_at,last_activity_at,updated_at'
    )
    .eq('user_id', user.id)
    .eq('topic', topic)
    .single();

  if (error && error.code !== 'PGRST116') {
    safeWarn('getTopicProgress', error);
    return null;
  }

  return data ?? null;
}

export async function getChapterCompletions(topic: Topic): Promise<Set<string>> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from('reading_sessions')
    .select('chapter_id')
    .eq('user_id', user.id)
    .eq('topic', topic)
    .eq('is_completed', true);

  if (error) {
    safeWarn('getChapterCompletions', error);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.chapter_id as string));
}

export async function trackFunctionView(topic: Topic, functionId: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing, error: existingError } = await supabase
    .from('function_views')
    .select('view_count')
    .eq('user_id', user.id)
    .eq('topic', topic)
    .eq('function_id', functionId)
    .maybeSingle();

  if (existingError) {
    safeWarn('trackFunctionView.select', existingError);
  }

  const nextCount = (existing?.view_count as number | undefined ?? 0) + 1;

  const { error: upsertError } = await supabase.from('function_views').upsert(
    {
      user_id: user.id,
      topic,
      function_id: functionId,
      view_count: nextCount
    },
    { onConflict: 'user_id,topic,function_id' }
  );

  if (upsertError) {
    safeWarn('trackFunctionView.upsert', upsertError);
    return;
  }

  const { count, error: countError } = await supabase
    .from('function_views')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('topic', topic);

  if (countError) {
    safeWarn('trackFunctionView.count', countError);
    return;
  }

  const { error: updateError } = await supabase
    .from('topic_progress')
    .update({
      functions_viewed: count ?? 0,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('topic', topic);

  if (updateError) {
    safeWarn('trackFunctionView.updateTopicProgress', updateError);
  }
}

export async function toggleBookmark(
  topic: Topic,
  functionId: string,
  isBookmarked: boolean
) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing, error: existingError } = await supabase
    .from('function_views')
    .select('view_count')
    .eq('user_id', user.id)
    .eq('topic', topic)
    .eq('function_id', functionId)
    .maybeSingle();

  if (existingError) {
    safeWarn('toggleBookmark.select', existingError);
  }

  const { error: upsertError } = await supabase.from('function_views').upsert(
    {
      user_id: user.id,
      topic,
      function_id: functionId,
      view_count: existing?.view_count ?? 1,
      is_bookmarked: isBookmarked
    },
    { onConflict: 'user_id,topic,function_id' }
  );

  if (upsertError) {
    safeWarn('toggleBookmark.upsert', upsertError);
    return;
  }

  const { count, error: countError } = await supabase
    .from('function_views')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('topic', topic)
    .eq('is_bookmarked', true);

  if (countError) {
    safeWarn('toggleBookmark.count', countError);
    return;
  }

  const { error: updateError } = await supabase
    .from('topic_progress')
    .update({
      functions_bookmarked: count ?? 0,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('topic', topic);

  if (updateError) {
    safeWarn('toggleBookmark.updateTopicProgress', updateError);
  }
}
