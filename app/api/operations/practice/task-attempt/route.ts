import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';
import { validatePracticeMcqAnswers } from '@/lib/validators/practiceMcqValidator';

// Append-only attempt log for practice tasks.
//
// POST records one attempt:
//   { topic, moduleId, taskId, result, code?, output?, answers? }
//   where answers is { fieldId: submittedValue }
//
// For MCQ tasks the server re-validates submitted answers against the
// registry's correctAnswer and writes the SERVER-DERIVED result, ignoring
// any client claim. Code tasks (no MCQ fields) keep the client-asserted
// result because Pyodide runs only in the browser.
//
// GET returns the per-task best result for a module:
//   ?moduleId=module-PS1
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

    // Sanitise submitted answers: must be a flat object with string keys
    // matching field-id shape and string values capped at 4 KB so a
    // 16-field carousel attempt stays well under any reasonable row limit.
    const rawAnswers = payload.answers;
    const submittedAnswers: Record<string, string> = {};
    if (rawAnswers && typeof rawAnswers === 'object' && !Array.isArray(rawAnswers)) {
      for (const [k, v] of Object.entries(rawAnswers as Record<string, unknown>)) {
        if (!isSafeId(k, 100)) continue;
        if (typeof v !== 'string') continue;
        submittedAnswers[k] = v.slice(0, 4_000);
      }
    }
    const hasSubmittedAnswers = Object.keys(submittedAnswers).length > 0;

    // Strict task identity check: confirm the (topic, moduleId, taskId)
    // triple resolves to a real task in the bundled registry. The
    // `isSafeId` regex above only enforces shape; without this lookup a
    // client could POST `taskId='made-up'` and pollute the attempt log.
    // Skipped for code tasks where the client only sends code/output and
    // no answers, AND the submitted moduleId still resolves to a known
    // module — gives existing legacy clients a soft landing.
    const verdict = hasSubmittedAnswers
      ? validatePracticeMcqAnswers(
          payload.topic,
          payload.moduleId,
          payload.taskId,
          submittedAnswers,
        )
      : (() => {
          // Even without submitted answers, do a registry lookup for the
          // strict task-identity check. Reuse the same validator to keep
          // one source of truth for "does this task exist".
          return validatePracticeMcqAnswers(
            payload.topic,
            payload.moduleId,
            payload.taskId,
            {},
          );
        })();

    if (verdict.status === 'unknown_task') {
      throw new ApiRouteError(
        'Unknown (topic, moduleId, taskId) triple — refusing to record attempt.',
        400,
      );
    }

    // Server-side result derivation: when the registered task has MCQ
    // fields and the client submitted answers, re-compute success/failure
    // from `correctAnswer`. The recorded result becomes the server's
    // verdict, ignoring any client claim.
    let finalResult: PracticeAttemptResult = payload.result;
    let validatedAnswersForStorage: Record<string, { value: string; isCorrect: boolean }> | null =
      null;
    let serverValidated = false;
    if (verdict.status === 'validated') {
      finalResult = verdict.result;
      validatedAnswersForStorage = verdict.perField;
      serverValidated = true;
      // Audit trail: log when a client claims success but the server-side
      // validation says otherwise (or vice versa). Helps detect tampered
      // clients without rejecting the attempt — the server-derived result
      // is still what gets stored.
      if (payload.result !== finalResult) {
        console.warn('[practice-attempt] client/server result mismatch', {
          userId: user.id,
          topic: payload.topic,
          moduleId: payload.moduleId,
          taskId: payload.taskId,
          clientClaim: payload.result,
          serverDerived: finalResult,
        });
      }
    }
    // 'no_validatable_fields' (pure code task or task without correctAnswer)
    // → trust the client claim, since the server cannot re-execute Pyodide.

    const { error } = await supabase.from('practice_task_attempts').insert({
      user_id: user.id,
      topic: payload.topic,
      module_id: payload.moduleId,
      task_id: payload.taskId,
      result: finalResult,
      code,
      output,
      answers: validatedAnswersForStorage ?? (hasSubmittedAnswers ? submittedAnswers : null),
    });
    if (error) {
      // Tolerate older table shapes by progressively dropping columns the
      // database may not know about yet. answers (20260502120000) →
      // code/output (20260429130000) → bare row (20260429120000).
      const msg = error.message.toLowerCase();
      const missingAnswers = msg.includes('answers') && (msg.includes('column') || msg.includes('does not exist'));
      const missingCodeOrOutput = (msg.includes('code') || msg.includes('output')) && (msg.includes('column') || msg.includes('does not exist'));

      if (missingAnswers) {
        const { error: retryError } = await supabase
          .from('practice_task_attempts')
          .insert({
            user_id: user.id,
            topic: payload.topic,
            module_id: payload.moduleId,
            task_id: payload.taskId,
            result: finalResult,
            code,
            output,
          });
        if (retryError) throw new Error(retryError.message);
        return NextResponse.json({
          ok: true,
          serverValidated,
          warning: 'answers not persisted (older schema).',
        });
      }

      if (missingCodeOrOutput) {
        const { error: retryError } = await supabase
          .from('practice_task_attempts')
          .insert({
            user_id: user.id,
            topic: payload.topic,
            module_id: payload.moduleId,
            task_id: payload.taskId,
            result: finalResult,
          });
        if (retryError) throw new Error(retryError.message);
        return NextResponse.json({
          ok: true,
          serverValidated,
          warning: 'code/output/answers not persisted (older schema).',
        });
      }

      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, serverValidated });
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
