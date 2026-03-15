import { NextResponse } from 'next/server';
import {
  runProtectedActivationMutation,
  toActivationErrorResponse
} from '@/lib/activation/http';
import {
  getActivationBoardData,
  startActivationTask
} from '@/lib/activation/service';
import { createClient } from '@/lib/supabase/server';

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
    const response = await runProtectedActivationMutation({
      request,
      userId: user.id,
      scope: 'activation_task_start',
      requestBody: {
        taskId,
        action: 'start'
      },
      execute: async () => {
        await startActivationTask({
          supabase,
          userId: user.id,
          taskId
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
    return toActivationErrorResponse(error, 'Failed to start activation task.');
  }
}
