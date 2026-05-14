import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';
import { touchPracticeCurrentTask } from '@/lib/learn/moduleProgressService';

// Lightweight cursor write. Called by PracticeSetViewer on every task
// navigation (NEXT_TASK / PREV_TASK / GO_TO_TASK) so the user can resume
// where they left off. Kept separate from /task-attempt to avoid polluting
// the append-only attempt log when the user just navigates without
// submitting.

const isSafeId = (value: unknown, max = 200): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= max &&
  /^[A-Za-z0-9_\-:.]+$/.test(value);

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const clientIp = getClientIp(request);
    await Promise.all([
      enforceRateLimit({
        scope: 'practice_cursor_user',
        key: user.id,
        limit: 600,
        windowSeconds: 5 * 60
      }),
      enforceRateLimit({
        scope: 'practice_cursor_ip',
        key: clientIp,
        limit: 1200,
        windowSeconds: 5 * 60
      })
    ]);

    const payload = await parseJsonObject(request);
    if (!isSafeId(payload.topic, 64)) {
      throw new ApiRouteError('Invalid topic.', 400);
    }
    if (!isSafeId(payload.moduleId)) {
      throw new ApiRouteError('Invalid moduleId.', 400);
    }
    // taskId can be null when the user reaches the results screen; we still
    // want to persist that "end-of-set" state so a refresh doesn't drop
    // them back to task 0.
    const taskId =
      payload.taskId === null || payload.taskId === undefined
        ? null
        : isSafeId(payload.taskId)
          ? payload.taskId
          : null;

    await touchPracticeCurrentTask({
      supabase,
      userId: user.id,
      topic: payload.topic,
      moduleId: payload.moduleId,
      taskId
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to update cursor.');
  }
}
