import { NextResponse } from 'next/server';
import { parseJsonObject } from '@/lib/api/http';
import {
  runProtectedActivationMutation,
  toActivationErrorResponse
} from '@/lib/activation/http';
import {
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

  try {
    const payload = await parseJsonObject(request);
    const input = toCreateInput(payload);

    const response = await runProtectedActivationMutation({
      request,
      userId: user.id,
      scope: 'activation_task_update',
      requestBody: {
        taskId,
        ...input,
        contentItemIds: input.contentItemIds ?? null,
        contentItemId: input.contentItemId ?? null,
        requestedCount: input.requestedCount ?? null,
        trackSlug: input.trackSlug ?? null
      },
      execute: async () => {
        await editActivationTask({
          supabase,
          userId: user.id,
          taskId,
          input
        });

        const board = await getActivationBoardData({
          supabase,
          userId: user.id,
          shouldReconcile: false
        });
        const allCards = [...board.todo, ...board.inProgress, ...board.completed];
        const task = allCards.find((card) => card.id === taskId) ?? null;

        return {
          body: {
            data: {
              task,
              board
            }
          },
          status: 200
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toActivationErrorResponse(error, 'Failed to edit activation task.');
  }
}

export async function DELETE(
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

  try {
    const response = await runProtectedActivationMutation({
      request,
      userId: user.id,
      scope: 'activation_task_delete',
      requestBody: {
        taskId,
        action: 'delete'
      },
      execute: async () => {
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

        return {
          body: {
            data: {
              board
            }
          },
          status: 200
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toActivationErrorResponse(error, 'Failed to delete activation task.');
  }
}
