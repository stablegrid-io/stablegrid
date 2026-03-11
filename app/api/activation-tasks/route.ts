import { NextResponse } from 'next/server';
import {
  ActivationServiceError,
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

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const created = await createActivationTask({
      supabase,
      userId: user.id,
      input: {
        taskType: payload.taskType as 'theory' | 'task',
        taskGroup: payload.taskGroup as
          | 'theory'
          | 'flashcards'
          | 'notebooks'
          | 'missions',
        trackSlug:
          typeof payload.trackSlug === 'string' ? payload.trackSlug : undefined,
        scopeType: payload.scopeType as 'count' | 'all_remaining',
        requestedCount:
          typeof payload.requestedCount === 'number'
            ? payload.requestedCount
            : undefined
      }
    });

    const board = await getActivationBoardData({
      supabase,
      userId: user.id,
      shouldReconcile: true
    });
    const allCards = [...board.todo, ...board.inProgress, ...board.completed];
    const createdCard = allCards.find((card) => card.id === created.taskId) ?? null;

    return NextResponse.json(
      {
        data: {
          created: createdCard,
          board
        }
      },
      { status: 201 }
    );
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
        error:
          error instanceof Error ? error.message : 'Failed to create activation task.'
      },
      { status: 500 }
    );
  }
}
