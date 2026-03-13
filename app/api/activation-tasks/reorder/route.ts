import { NextResponse } from 'next/server';
import {
  ActivationServiceError,
  getActivationBoardData,
  reorderActivationTasks,
  type ActivationTaskStatus
} from '@/lib/activation/service';
import { createClient } from '@/lib/supabase/server';

const isActivationTaskStatus = (value: unknown): value is ActivationTaskStatus =>
  value === 'todo' || value === 'in_progress' || value === 'completed';

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const status = payload.status;
  const orderedTaskIds = Array.isArray(payload.orderedTaskIds)
    ? payload.orderedTaskIds.filter((value): value is string => typeof value === 'string')
    : [];

  if (!isActivationTaskStatus(status)) {
    return NextResponse.json({ error: 'Task status is required.' }, { status: 400 });
  }

  if (orderedTaskIds.length === 0) {
    return NextResponse.json({ error: 'Ordered task ids are required.' }, { status: 400 });
  }

  try {
    await reorderActivationTasks({
      supabase,
      userId: user.id,
      status,
      orderedTaskIds
    });

    const board = await getActivationBoardData({
      supabase,
      userId: user.id,
      shouldReconcile: false
    });

    return NextResponse.json({
      data: {
        board
      }
    });
  } catch (error) {
    if (error instanceof ActivationServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to reorder activation tasks.'
      },
      { status: 500 }
    );
  }
}
