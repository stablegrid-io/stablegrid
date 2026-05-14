import 'server-only';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  getCanonicalModuleContext,
  type CanonicalModuleContextEntry
} from '@/lib/learn/canonicalModules';
import {
  mutateModuleProgressRows,
  normalizeModuleProgressChain,
  type ModuleProgressRowLike,
  type ModuleProgressUpsertRow
} from '@/lib/learn/moduleProgress';

type SupabaseClient = ReturnType<typeof createClient>;

interface ModuleProgressRow extends ModuleProgressRowLike {
  id: string;
  user_id: string;
  topic: string;
  updated_at: string;
}

/**
 * Read all module_progress rows for a user+topic in canonical module order.
 */
const fetchRows = async (
  supabase: SupabaseClient,
  userId: string,
  topic: string
): Promise<ModuleProgressRow[]> => {
  const { data, error } = await supabase
    .from('module_progress')
    .select(
      'id,user_id,topic,module_id,module_order,is_unlocked,is_completed,current_lesson_id,current_task_id,last_visited_route,completed_at,updated_at'
    )
    .eq('user_id', userId)
    .eq('topic', topic)
    .order('module_order', { ascending: true });

  if (error) {
    // Tolerate missing `current_task_id` column (pre-migration) by retrying
    // without it — keeps server-to-server completion working before the
    // migration lands in every env.
    if (/current_task_id/i.test(error.message)) {
      const fallback = await supabase
        .from('module_progress')
        .select(
          'id,user_id,topic,module_id,module_order,is_unlocked,is_completed,current_lesson_id,last_visited_route,completed_at,updated_at'
        )
        .eq('user_id', userId)
        .eq('topic', topic)
        .order('module_order', { ascending: true });
      if (fallback.error) throw new Error(fallback.error.message);
      return (fallback.data ?? []) as ModuleProgressRow[];
    }
    throw new Error(error.message);
  }
  return (data ?? []) as ModuleProgressRow[];
};

const upsertRows = async (
  supabase: SupabaseClient,
  rows: ModuleProgressUpsertRow[]
): Promise<void> => {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('module_progress')
    .upsert(rows, { onConflict: 'user_id,topic,module_id' });
  if (error) throw new Error(error.message);
};

const ensureChain = (
  rows: ModuleProgressRow[],
  canonicalModules: CanonicalModuleContextEntry[],
  userId: string,
  topic: string,
  nowIso: string
) => {
  // Re-use the chain normalizer the public API uses — keeps unlock-chain
  // semantics (each row unlocked iff index===0 OR prev module completed)
  // consistent with the user-facing complete_practice action.
  return normalizeModuleProgressChain({
    canonicalModules: canonicalModules.map((m) => ({ id: m.id, order: m.order })),
    existingRows: rows,
    userId,
    topic,
    nowIso
  });
};

const revalidate = (topic: string) => {
  revalidatePath('/practice/modules');
  revalidatePath('/home');
  revalidatePath(`/learn/${topic}`);
};

/**
 * Idempotently mark a module's `is_completed=true` and propagate the unlock
 * chain forward. Safe to call repeatedly — if the row is already complete,
 * the upsert writes the same values.
 *
 * Designed for server-to-server use: skips the rate limiting + idempotency
 * key dance the public `/api/learn/module-progress` POST handler runs.
 */
export const completeModuleProgress = async ({
  supabase,
  userId,
  topic,
  moduleId,
  trackSlug = null
}: {
  supabase: SupabaseClient;
  userId: string;
  topic: string;
  moduleId: string;
  trackSlug?: string | null;
}): Promise<void> => {
  const canonical = getCanonicalModuleContext(topic, trackSlug);
  if (!canonical.some((m) => m.id === moduleId)) {
    // Module not in the canonical list (e.g. unknown topic) — refuse to write.
    return;
  }

  const existing = await fetchRows(supabase, userId, topic);
  const nowIso = new Date().toISOString();

  // Seed missing rows so the chain normalizer sees the full set.
  const knownIds = new Set(existing.map((row) => row.module_id));
  const seeded: ModuleProgressRowLike[] = [
    ...existing,
    ...canonical
      .filter((m) => !knownIds.has(m.id))
      .map<ModuleProgressRowLike>((m) => ({
        module_id: m.id,
        module_order: m.order,
        is_unlocked: false,
        is_completed: false,
        current_lesson_id: null,
        last_visited_route: null,
        completed_at: null,
        updated_at: nowIso
      }))
  ];

  const mutated = mutateModuleProgressRows({
    rows: seeded,
    moduleId,
    mutation: { type: 'complete' },
    nowIso
  });

  const upserts = ensureChain(
    mutated as ModuleProgressRow[],
    canonical,
    userId,
    topic,
    nowIso
  );
  await upsertRows(supabase, upserts);
  revalidate(topic);
};

/**
 * Update the practice-side cursor for a single module. Inserts a minimal
 * row if none exists yet so the cursor survives the chain normalize pass.
 *
 * Falls back to a no-op (logs a warning) if the `current_task_id` column
 * isn't present yet — keeps the touch endpoint forward-compatible without
 * the migration applied.
 */
export const touchPracticeCurrentTask = async ({
  supabase,
  userId,
  topic,
  moduleId,
  taskId
}: {
  supabase: SupabaseClient;
  userId: string;
  topic: string;
  moduleId: string;
  taskId: string | null;
}): Promise<void> => {
  // Upsert just the cursor — direct write, no chain normalize. The unlock
  // chain only depends on is_completed, which we're not changing here.
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('module_progress')
    .upsert(
      {
        user_id: userId,
        topic,
        module_id: moduleId,
        current_task_id: taskId,
        updated_at: nowIso
      },
      { onConflict: 'user_id,topic,module_id' }
    );

  if (error) {
    if (/current_task_id/i.test(error.message)) {
      console.warn(
        '[touchPracticeCurrentTask] current_task_id column missing — migration pending'
      );
      return;
    }
    throw new Error(error.message);
  }
};
