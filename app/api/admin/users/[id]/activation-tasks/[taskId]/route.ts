import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { findBoardTask, toActivationTaskInput } from '@/lib/admin/activation';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import {
  deleteActivationTask,
  editActivationTask,
  getActivationBoardData,
  moveActivationTaskToCompleted,
  moveActivationTaskToTodo,
  startActivationTask
} from '@/lib/activation/service';
import { getAdminActivationTaskSnapshot, logAdminAudit } from '@/lib/admin/service';

const isStatusAction = (value: unknown): value is 'start' | 'move_to_todo' | 'move_to_completed' =>
  value === 'start' || value === 'move_to_todo' || value === 'move_to_completed';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const userId = params.id;
    const taskId = params.taskId;
    if (!userId || !taskId) {
      return NextResponse.json(
        { error: 'User id and task id are required.' },
        { status: 400 }
      );
    }

    const { adminSupabase, user } = await requireAdminAccess();
    const payload = await parseJsonBody(request);
    const before = await getAdminActivationTaskSnapshot({
      supabase: adminSupabase,
      userId,
      taskId
    });

    if (!before) {
      return NextResponse.json({ error: 'Activation task not found.' }, { status: 404 });
    }

    const action = payload.action;
    let auditAction = 'activation_task_updated';

    if (isStatusAction(action)) {
      if (action === 'start') {
        await startActivationTask({ supabase: adminSupabase, userId, taskId });
        auditAction = 'activation_task_started';
      }
      if (action === 'move_to_todo') {
        await moveActivationTaskToTodo({ supabase: adminSupabase, userId, taskId });
        auditAction = 'activation_task_moved_to_todo';
      }
      if (action === 'move_to_completed') {
        await moveActivationTaskToCompleted({
          supabase: adminSupabase,
          userId,
          taskId
        });
        auditAction = 'activation_task_completed';
      }
    } else {
      await editActivationTask({
        supabase: adminSupabase,
        userId,
        taskId,
        input: toActivationTaskInput(payload)
      });
    }

    const [after, board] = await Promise.all([
      getAdminActivationTaskSnapshot({
        supabase: adminSupabase,
        userId,
        taskId
      }),
      getActivationBoardData({
        supabase: adminSupabase,
        userId,
        shouldReconcile: false
      })
    ]);

    await logAdminAudit({
      supabase: adminSupabase,
      actorUserId: user.id,
      targetUserId: userId,
      entityType: isStatusAction(action) ? 'activation_task_status' : 'activation_task',
      entityId: taskId,
      action: auditAction,
      beforeState: before,
      afterState: after
    });

    return NextResponse.json({
      data: {
        task: findBoardTask(board, taskId),
        board
      }
    });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to update activation task.');
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const userId = params.id;
    const taskId = params.taskId;
    if (!userId || !taskId) {
      return NextResponse.json(
        { error: 'User id and task id are required.' },
        { status: 400 }
      );
    }

    const { adminSupabase, user } = await requireAdminAccess();
    const before = await getAdminActivationTaskSnapshot({
      supabase: adminSupabase,
      userId,
      taskId
    });

    if (!before) {
      return NextResponse.json({ error: 'Activation task not found.' }, { status: 404 });
    }

    await deleteActivationTask({
      supabase: adminSupabase,
      userId,
      taskId
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
      entityType: 'activation_task',
      entityId: taskId,
      action: 'activation_task_deleted',
      beforeState: before,
      afterState: null
    });

    return NextResponse.json({
      data: {
        board
      }
    });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to delete activation task.');
  }
}
