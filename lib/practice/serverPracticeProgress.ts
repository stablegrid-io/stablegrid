import 'server-only';

import { createClient } from '@/lib/supabase/server';

export interface ServerPracticeModuleProgress {
  moduleId: string;
  tasksSolved: number;
  tasksAttempted: number;
  /**
   * The task the user should resume into. When module_progress.current_task_id
   * is present (written by PracticeSetViewer on every navigation) it wins.
   * Otherwise falls back to the latest non-success attempt — a heuristic
   * that handles legacy users with no cursor written yet.
   */
  currentTaskId: string | null;
  /** True when module_progress.is_completed=true. Server-of-truth flag for unlock chain. */
  isCompleted: boolean;
}

export interface ServerPracticeProgressPayload {
  hasUser: boolean;
  /** Map of moduleId → { tasksSolved, tasksAttempted, currentTaskId, isCompleted }. */
  progressByModule: Record<string, ServerPracticeModuleProgress>;
  /** Map of moduleId → ordered set of solved taskIds, lookup-friendly. */
  solvedTasksByModule: Record<string, string[]>;
}

interface AttemptRow {
  module_id: string | null;
  task_id: string | null;
  result: 'success' | 'failure' | 'self_review' | null;
  attempted_at: string | null;
}

const isMissingTableError = (error: { message?: string } | null | undefined): boolean => {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('practice_task_attempts') &&
    (msg.includes('does not exist') || msg.includes('42p01'))
  );
};

/**
 * Loads per-module practice progress for the current user.
 *
 * Filters server-side to the supplied `moduleIds` so the editorial track view
 * only pays for the data it renders. Tolerates the practice_task_attempts
 * table being missing on fresh installs (returns empty progress).
 */
export const loadServerPracticeProgress = async (
  moduleIds: string[]
): Promise<ServerPracticeProgressPayload> => {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || moduleIds.length === 0) {
    return { hasUser: Boolean(user), progressByModule: {}, solvedTasksByModule: {} };
  }

  const [attemptsResult, moduleProgressResult] = await Promise.all([
    supabase
      .from('practice_task_attempts')
      .select('module_id, task_id, result, attempted_at')
      .eq('user_id', user.id)
      .in('module_id', moduleIds)
      .order('attempted_at', { ascending: false }),
    supabase
      .from('module_progress')
      .select('module_id, current_task_id, is_completed')
      .eq('user_id', user.id)
      .in('module_id', moduleIds)
  ]);
  const { data, error } = attemptsResult;
  if (error && !isMissingTableError(error)) {
    return { hasUser: true, progressByModule: {}, solvedTasksByModule: {} };
  }

  // module_progress may not have current_task_id yet (pre-migration) — retry
  // a slimmer select before giving up on this read entirely.
  let mpRows: Array<{ module_id: string; current_task_id: string | null; is_completed: boolean | null }> = [];
  if (moduleProgressResult.error) {
    if (/current_task_id/i.test(moduleProgressResult.error.message ?? '')) {
      const fallback = await supabase
        .from('module_progress')
        .select('module_id, is_completed')
        .eq('user_id', user.id)
        .in('module_id', moduleIds);
      mpRows = ((fallback.data ?? []) as Array<{ module_id: string; is_completed: boolean | null }>).map(
        (row) => ({ ...row, current_task_id: null })
      );
    }
    // Other module_progress errors fall through silently — progressByModule
    // still works without the cursor / completion flag.
  } else {
    mpRows = (moduleProgressResult.data ?? []) as typeof mpRows;
  }
  const moduleProgressById = new Map(mpRows.map((row) => [row.module_id, row]));

  // Per (module, task), keep the best outcome ("success" sticks) plus the
  // latest attempt timestamp. Rows arrive newest-first so the first row we
  // see for a (module, task) pair is the latest attempt by definition.
  const bestByPair = new Map<
    string,
    { moduleId: string; taskId: string; bestResult: 'success' | 'failure' | 'self_review'; latestAt: string }
  >();
  for (const row of (data ?? []) as AttemptRow[]) {
    if (!row.module_id || !row.task_id || !row.result || !row.attempted_at) continue;
    const key = `${row.module_id}:${row.task_id}`;
    const existing = bestByPair.get(key);
    if (!existing) {
      bestByPair.set(key, {
        moduleId: row.module_id,
        taskId: row.task_id,
        bestResult: row.result,
        latestAt: row.attempted_at
      });
      continue;
    }
    if (existing.bestResult !== 'success' && row.result === 'success') {
      existing.bestResult = 'success';
    }
  }

  const progressByModule: Record<string, ServerPracticeModuleProgress> = {};
  const solvedTasksByModule: Record<string, string[]> = {};
  for (const moduleId of moduleIds) {
    progressByModule[moduleId] = {
      moduleId,
      tasksSolved: 0,
      tasksAttempted: 0,
      currentTaskId: null,
      isCompleted: Boolean(moduleProgressById.get(moduleId)?.is_completed)
    };
    solvedTasksByModule[moduleId] = [];
  }

  // Track the latest non-success attempt per module — that's the task the
  // user is actively working on for the "current" indicator.
  const latestNonSuccessByModule = new Map<string, { taskId: string; latestAt: string }>();

  for (const entry of bestByPair.values()) {
    const bucket = progressByModule[entry.moduleId];
    if (!bucket) continue;
    bucket.tasksAttempted += 1;
    if (entry.bestResult === 'success') {
      bucket.tasksSolved += 1;
      solvedTasksByModule[entry.moduleId].push(entry.taskId);
    } else {
      const prev = latestNonSuccessByModule.get(entry.moduleId);
      if (!prev || entry.latestAt > prev.latestAt) {
        latestNonSuccessByModule.set(entry.moduleId, {
          taskId: entry.taskId,
          latestAt: entry.latestAt
        });
      }
    }
  }

  for (const [moduleId, current] of latestNonSuccessByModule.entries()) {
    if (progressByModule[moduleId]) {
      progressByModule[moduleId].currentTaskId = current.taskId;
    }
  }

  // module_progress.current_task_id wins over the attempt-derived heuristic
  // — it's the literal cursor the user was on, including tasks they looked
  // at but never submitted. Falls back to the heuristic when the column is
  // null (legacy users) or the cursor points at a task they've since solved.
  for (const moduleId of moduleIds) {
    const cursorId = moduleProgressById.get(moduleId)?.current_task_id ?? null;
    if (cursorId && !solvedTasksByModule[moduleId].includes(cursorId)) {
      progressByModule[moduleId].currentTaskId = cursorId;
    }
  }

  return { hasUser: true, progressByModule, solvedTasksByModule };
};
