import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';

// Append-only attempt log for practice tasks.
//
// POST records one attempt:
//   { topic, moduleId, taskId, result: 'success' | 'failure' | 'self_review' }
//
// GET returns the per-task best result for a module:
//   ?moduleId=module-PSPJ1
//   → { data: [{ taskId, bestResult, attempts, lastAttemptedAt }] }
// `bestResult` collapses the attempt history: if any attempt is 'success'
// the task is treated as solved; otherwise the most recent result wins.

type PracticeAttemptResult = 'success' | 'failure' | 'self_review';

const ALLOWED_RESULTS: ReadonlySet<PracticeAttemptResult> = new Set([
  'success',
  'failure',
  'self_review',
]);

const isPracticeAttemptResult = (value: unknown): value is PracticeAttemptResult =>
  typeof value === 'string' && ALLOWED_RESULTS.has(value as PracticeAttemptResult);

const isSafeId = (value: unknown, max = 200): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= max &&
  /^[A-Za-z0-9_\-:.]+$/.test(value);

interface TaskAttemptRow {
  task_id: string;
  result: PracticeAttemptResult;
  attempted_at: string;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const clientIp = getClientIp(request);
    await Promise.all([
      enforceRateLimit({
        scope: 'practice_task_attempt_user',
        key: user.id,
        limit: 240,
        windowSeconds: 5 * 60,
      }),
      enforceRateLimit({
        scope: 'practice_task_attempt_ip',
        key: clientIp,
        limit: 480,
        windowSeconds: 5 * 60,
      }),
    ]);

    const payload = await parseJsonObject(request);
    if (!isSafeId(payload.topic, 64)) {
      throw new ApiRouteError('Invalid topic.', 400);
    }
    if (!isSafeId(payload.moduleId)) {
      throw new ApiRouteError('Invalid moduleId.', 400);
    }
    if (!isSafeId(payload.taskId)) {
      throw new ApiRouteError('Invalid taskId.', 400);
    }
    if (!isPracticeAttemptResult(payload.result)) {
      throw new ApiRouteError('Invalid result.', 400);
    }
    // Code and output are user-generated free text. Cap at sane limits to
    // protect the row size, and coerce undefined → null for the insert.
    const code =
      typeof payload.code === 'string' ? payload.code.slice(0, 32_000) : null;
    const output =
      typeof payload.output === 'string' ? payload.output.slice(0, 32_000) : null;

    const { error } = await supabase.from('practice_task_attempts').insert({
      user_id: user.id,
      topic: payload.topic,
      module_id: payload.moduleId,
      task_id: payload.taskId,
      result: payload.result,
      code,
      output,
    });
    if (error) {
      // Tolerate the older table shape (pre-20260429130000) — retry without
      // code/output so the attempt still records on environments that
      // haven't applied that follow-up migration yet.
      if (
        error.message.includes('code') ||
        error.message.includes('output')
      ) {
        const { error: retryError } = await supabase
          .from('practice_task_attempts')
          .insert({
            user_id: user.id,
            topic: payload.topic,
            module_id: payload.moduleId,
            task_id: payload.taskId,
            result: payload.result,
          });
        if (retryError) throw new Error(retryError.message);
        return NextResponse.json({ ok: true, warning: 'code/output not persisted (older schema).' });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to record attempt.');
  }
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const moduleId = url.searchParams.get('moduleId');
  if (!isSafeId(moduleId)) {
    return NextResponse.json({ error: 'Invalid moduleId.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('practice_task_attempts')
      .select('task_id, result, attempted_at')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .order('attempted_at', { ascending: false });
    if (error) {
      // Tolerate a missing table on environments that haven't run the
      // 20260429120000_practice_task_attempts migration yet — return empty
      // so the UI degrades gracefully instead of breaking the practice page.
      if (
        error.message.includes('practice_task_attempts') &&
        (error.message.includes('does not exist') || error.message.includes('42P01'))
      ) {
        return NextResponse.json({ data: [] });
      }
      throw new Error(error.message);
    }

    const rows = (data ?? []) as TaskAttemptRow[];

    // Collapse attempt history into a per-task summary. "success" sticks
    // (any past pass means the task is solved); otherwise the most recent
    // attempt drives the displayed result.
    const summary = new Map<
      string,
      {
        taskId: string;
        bestResult: PracticeAttemptResult;
        attempts: number;
        lastAttemptedAt: string;
      }
    >();
    // Rows arrive newest-first, so iterating once gives us recency for free.
    for (const row of rows) {
      const existing = summary.get(row.task_id);
      if (!existing) {
        summary.set(row.task_id, {
          taskId: row.task_id,
          bestResult: row.result,
          attempts: 1,
          lastAttemptedAt: row.attempted_at,
        });
        continue;
      }
      existing.attempts += 1;
      if (existing.bestResult !== 'success' && row.result === 'success') {
        existing.bestResult = 'success';
      }
    }

    return NextResponse.json({ data: Array.from(summary.values()) });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to load attempts.');
  }
}
