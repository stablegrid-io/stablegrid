import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject } from '@/lib/api/http';
import {
  runProtectedActivationMutation,
  toActivationErrorResponse
} from '@/lib/activation/http';
import {
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

  try {
    const payload = await parseJsonObject(request);

    const status = payload.status;
    const orderedTaskIds = Array.isArray(payload.orderedTaskIds)
      ? payload.orderedTaskIds.filter((value): value is string => typeof value === 'string')
      : [];

    if (!isActivationTaskStatus(status)) {
      throw new ApiRouteError('Task status is required.', 400);
    }

    if (orderedTaskIds.length === 0) {
      throw new ApiRouteError('Ordered task ids are required.', 400);
    }

    const response = await runProtectedActivationMutation({
      request,
      userId: user.id,
      scope: 'activation_task_reorder',
      requestBody: {
        status,
        orderedTaskIds
      },
      execute: async () => {
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
    return toActivationErrorResponse(error, 'Failed to reorder activation tasks.');
  }
}
