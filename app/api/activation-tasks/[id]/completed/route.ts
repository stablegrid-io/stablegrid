import { NextResponse } from 'next/server';
import {
  ActivationServiceError,
  getActivationBoardData,
  moveActivationTaskToCompleted
} from '@/lib/activation/service';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
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
    await moveActivationTaskToCompleted({
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

    return NextResponse.json({
      data: {
        task,
        board
      }
    });
  } catch (error) {
    if (error instanceof ActivationServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to move activation task to Completed.'
      },
      { status: 500 }
    );
  }
}
