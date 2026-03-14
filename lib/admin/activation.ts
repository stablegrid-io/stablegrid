import type { ActivationBoardData, CreateActivationTaskInput } from '@/lib/activation/service';

export const toActivationTaskInput = (
  payload: Record<string, unknown>
): CreateActivationTaskInput => ({
  taskType: payload.taskType as 'theory' | 'task',
  taskGroup: payload.taskGroup as 'theory' | 'flashcards' | 'notebooks' | 'missions',
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
    typeof payload.contentItemId === 'string' ? payload.contentItemId : undefined,
  title: typeof payload.title === 'string' ? payload.title : undefined,
  description: typeof payload.description === 'string' ? payload.description : undefined
});

export const findBoardTask = (board: ActivationBoardData, taskId: string) =>
  [...board.todo, ...board.inProgress, ...board.completed].find((task) => task.id === taskId) ??
  null;
