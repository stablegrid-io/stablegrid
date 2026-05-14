import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { completeModuleProgress } from '@/lib/learn/moduleProgressService';
import { inferTrackSlugFromModuleId } from '@/lib/learn/canonicalModules';
import { getPracticeSetTaskIds } from '@/lib/practice/practiceSetTaskIds';

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * After a successful task-attempt insert, check whether the module is now
 * fully solved (every canonical task has at least one `success` attempt).
 * If yes — and module_progress isn't already flagged complete — mark it
 * complete and propagate the unlock chain.
 *
 * Closes the "user solved all 6 tasks but closed the tab before pressing
 * Finish" gap, in which the attempt log was correct but module_progress
 * stayed at is_completed=false forever.
 *
 * Fire-and-forget from the caller's perspective: errors are swallowed and
 * logged so the per-attempt insert never fails on a downstream issue.
 */
export const maybeAutoCompleteModule = async ({
  supabase,
  userId,
  topic,
  moduleId
}: {
  supabase: SupabaseClient;
  userId: string;
  topic: string;
  moduleId: string;
}): Promise<void> => {
  try {
    const requiredTaskIds = getPracticeSetTaskIds(topic, moduleId);
    if (requiredTaskIds.length === 0) return;

    const { data: solvedRows, error: attemptsError } = await supabase
      .from('practice_task_attempts')
      .select('task_id')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('result', 'success');
    if (attemptsError) {
      console.warn('[auto-complete] attempts read failed:', attemptsError.message);
      return;
    }

    const solvedSet = new Set((solvedRows ?? []).map((r) => r.task_id));
    if (!requiredTaskIds.every((id) => solvedSet.has(id))) return;

    // Already marked complete — short-circuit before the chain upsert.
    const { data: existingRow } = await supabase
      .from('module_progress')
      .select('is_completed')
      .eq('user_id', userId)
      .eq('topic', topic)
      .eq('module_id', moduleId)
      .maybeSingle<{ is_completed: boolean | null }>();
    if (existingRow?.is_completed) return;

    const trackSlug = inferTrackSlugFromModuleId(moduleId);
    await completeModuleProgress({
      supabase,
      userId,
      topic,
      moduleId,
      trackSlug
    });
  } catch (error) {
    // Auto-completion is best-effort. The per-task attempt was already
    // recorded by the caller; a failure here just delays the unlock chain
    // until the user clicks Finish manually.
    console.warn(
      '[auto-complete] unexpected failure:',
      error instanceof Error ? error.message : error
    );
  }
};
