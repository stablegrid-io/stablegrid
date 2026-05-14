import 'server-only';

import { createClient } from '@/lib/supabase/server';

/**
 * Server-side read of `module_progress.current_task_id` for the authenticated
 * user. Drives the `initialTaskId` prop on `PracticeSetSession` so a fresh
 * page load opens the user back at the task they were on.
 *
 * Returns `null` when:
 *   - the user is signed out (auth gate handles redirects upstream)
 *   - no row exists yet for this module
 *   - the column is missing (pre-migration env) — graceful fallback to task 0
 */
export const readPracticeResumeTaskId = async (
  topic: string,
  moduleId: string
): Promise<string | null> => {
  if (!topic || !moduleId) return null;
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('module_progress')
    .select('current_task_id')
    .eq('user_id', user.id)
    .eq('topic', topic)
    .eq('module_id', moduleId)
    .maybeSingle<{ current_task_id: string | null }>();

  if (error) {
    // Tolerate missing column (pre-migration) — return null so the viewer
    // opens at task 0, same as a brand-new user.
    if (/current_task_id/i.test(error.message)) return null;
    return null;
  }

  return data?.current_task_id ?? null;
};
