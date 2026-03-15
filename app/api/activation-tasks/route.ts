import { NextResponse } from 'next/server';
import { parseJsonObject } from '@/lib/api/http';
import {
  runProtectedActivationMutation,
  toActivationErrorResponse
} from '@/lib/activation/http';
import {
  createActivationTask,
  getActivationBoardData
} from '@/lib/activation/service';
import { createClient } from '@/lib/supabase/server';

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
    const payload = await parseJsonObject(request);
    const input = {
      taskType: payload.taskType as 'theory' | 'task',
      taskGroup: payload.taskGroup as
        | 'theory'
        | 'flashcards'
        | 'notebooks'
        | 'missions',
      trackSlug: typeof payload.trackSlug === 'string' ? payload.trackSlug : undefined,
      scopeType: payload.scopeType as 'count' | 'all_remaining',
      requestedCount:
        typeof payload.requestedCount === 'number' ? payload.requestedCount : undefined,
      contentItemIds: Array.isArray(payload.contentItemIds)
        ? payload.contentItemIds.filter(
            (value): value is string => typeof value === 'string'
          )
        : undefined,
      contentItemId:
        typeof payload.contentItemId === 'string' ? payload.contentItemId : undefined
    };

    const response = await runProtectedActivationMutation({
      request,
      userId: user.id,
      scope: 'activation_task_create',
      requestBody: {
        ...input,
        contentItemIds: input.contentItemIds ?? null,
        contentItemId: input.contentItemId ?? null,
        requestedCount: input.requestedCount ?? null,
        trackSlug: input.trackSlug ?? null
      },
      execute: async () => {
        const created = await createActivationTask({
          supabase,
          userId: user.id,
          input
        });

        const board = await getActivationBoardData({
          supabase,
          userId: user.id,
          shouldReconcile: false
        });
        const allCards = [...board.todo, ...board.inProgress, ...board.completed];
        const createdCard = allCards.find((card) => card.id === created.taskId) ?? null;

        return {
          body: {
            data: {
              created: createdCard,
              board
            }
          },
          status: 201
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toActivationErrorResponse(error, 'Failed to create activation task.');
  }
}
