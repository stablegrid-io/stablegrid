import 'server-only';

import { createClient } from '@/lib/supabase/server';

export interface ServerPracticeModuleProgress {
  moduleId: string;
  tasksSolved: number;
  tasksAttempted: number;
  /**
   * Most-recently-attempted task that has not yet been solved. Used by the
   * track view to render the "current" indicator on the next square the
   * user is working on.
   */
  currentTaskId: string | null;
}

export interface ServerPracticeProgressPayload {
  hasUser: boolean;
  /** Map of moduleId → { tasksSolved, tasksAttempted, currentTaskId }. */
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

  const { data, error } = await supabase
    .from('practice_task_attempts')
    .select('module_id, task_id, result, attempted_at')
    .eq('user_id', user.id)
    .in('module_id', moduleIds)
    .order('attempted_at', { ascending: false });

  if (error && !isMissingTableError(error)) {
    return { hasUser: true, progressByModule: {}, solvedTasksByModule: {} };
  }

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
      currentTaskId: null
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

  return { hasUser: true, progressByModule, solvedTasksByModule };
};
