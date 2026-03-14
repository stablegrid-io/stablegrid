import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import {
  getActivationBoardData,
  reorderActivationTasks,
  type ActivationTaskStatus
} from '@/lib/activation/service';
import { logAdminAudit } from '@/lib/admin/service';

const isActivationTaskStatus = (value: unknown): value is ActivationTaskStatus =>
  value === 'todo' || value === 'in_progress' || value === 'completed';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
    }

    const { adminSupabase, user } = await requireAdminAccess();
    const payload = await parseJsonBody(request);
    const status = payload.status;
    const orderedTaskIds = Array.isArray(payload.orderedTaskIds)
      ? payload.orderedTaskIds.filter(
          (value): value is string => typeof value === 'string'
        )
      : [];

    if (!isActivationTaskStatus(status)) {
      return NextResponse.json({ error: 'Task status is required.' }, { status: 400 });
    }

    await reorderActivationTasks({
      supabase: adminSupabase,
      userId,
      status,
      orderedTaskIds
    });

    const board = await getActivationBoardData({
      supabase: adminSupabase,
      userId,
      shouldReconcile: false
    });

    await logAdminAudit({
      supabase: adminSupabase,
      actorUserId: user.id,
      targetUserId: userId,
      entityType: 'activation_task_order',
      entityId: `${userId}:${status}`,
      action: 'activation_tasks_reordered',
      beforeState: {
        status,
        orderedTaskIds
      },
      afterState: {
        status,
        orderedTaskIds: (
          status === 'todo'
            ? board.todo
            : status === 'in_progress'
              ? board.inProgress
              : board.completed
        ).map((task) => task.id)
      }
    });

    return NextResponse.json({
      data: {
        board
      }
    });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to reorder activation tasks.');
  }
}
