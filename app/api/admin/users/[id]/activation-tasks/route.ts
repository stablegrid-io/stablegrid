import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { findBoardTask, toActivationTaskInput } from '@/lib/admin/activation';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import { getActivationBoardData, createActivationTask } from '@/lib/activation/service';
import { getAdminActivationTaskSnapshot, logAdminAudit } from '@/lib/admin/service';

export async function POST(
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

    const created = await createActivationTask({
      supabase: adminSupabase,
      userId,
      input: toActivationTaskInput(payload)
    });

    const [taskSnapshot, board] = await Promise.all([
      getAdminActivationTaskSnapshot({
        supabase: adminSupabase,
        userId,
        taskId: created.taskId
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
      entityType: 'activation_task',
      entityId: created.taskId,
      action: 'activation_task_created',
      beforeState: null,
      afterState: taskSnapshot
    });

    return NextResponse.json(
      {
        data: {
          task: findBoardTask(board, created.taskId),
          board
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to create activation task.');
  }
}
