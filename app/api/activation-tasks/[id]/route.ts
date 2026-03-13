import { NextResponse } from 'next/server';
import {
  ActivationServiceError,
  deleteActivationTask,
  editActivationTask,
  getActivationBoardData
} from '@/lib/activation/service';
import { createClient } from '@/lib/supabase/server';

const toCreateInput = (payload: Record<string, unknown>) => ({
  taskType: payload.taskType as 'theory' | 'task',
  taskGroup: payload.taskGroup as 'theory' | 'flashcards' | 'notebooks' | 'missions',
  trackSlug: typeof payload.trackSlug === 'string' ? payload.trackSlug : undefined,
  scopeType: payload.scopeType as 'count' | 'all_remaining',
  requestedCount: typeof payload.requestedCount === 'number' ? payload.requestedCount : undefined,
  contentItemIds: Array.isArray(payload.contentItemIds)
    ? payload.contentItemIds.filter(
        (value): value is string => typeof value === 'string'
      )
    : undefined,
  contentItemId:
    typeof payload.contentItemId === 'string' ? payload.contentItemId : undefined
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  if (!taskId) {
    return NextResponse.json({ error: 'Task id is required.' }, { status: 400 });
  }

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

  try {
    await editActivationTask({
      supabase,
      userId: user.id,
      taskId,
      input: toCreateInput(payload)
    });

    const board = await getActivationBoardData({
      supabase,
      userId: user.id,
      shouldReconcile: false
    });
    const allCards = [...board.todo, ...board.inProgress, ...board.completed];
    const task = allCards.find((card) => card.id === taskId) ?? null;

    return NextResponse.json({
      data: {
        task,
        board
      }
    });
  } catch (error) {
    if (error instanceof ActivationServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          ...(error.details ?? {})
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to edit activation task.'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  if (!taskId) {
    return NextResponse.json({ error: 'Task id is required.' }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await deleteActivationTask({
      supabase,
      userId: user.id,
      taskId
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
        error: error instanceof Error ? error.message : 'Failed to delete activation task.'
      },
      { status: 500 }
    );
  }
}
