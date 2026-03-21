'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { BoardColumn } from '@/components/home/activation-table/components/BoardColumn';
import { CreateTaskModal } from '@/components/home/activation-table/components/CreateTaskModal';
import { DeleteTaskModal } from '@/components/home/activation-table/components/DeleteTaskModal';
import { createPayloadRequestKey } from '@/lib/api/requestKeys';
import type {
  TaskCardData,
  TaskCardState
} from '@/components/home/activation-table/components/TaskCard';
import type {
  ActivationBoardCard,
  ActivationBoardPayload,
  ActivationTaskGroup,
  ActivationTaskStatus
} from '@/components/home/activation-table/types';

type BoardColumnKey = 'todo' | 'inProgress' | 'completed';
type TaskReorderPlacement = 'before' | 'after';

const BOARD_COLUMN_KEY_BY_STATE: Record<TaskCardState, BoardColumnKey> = {
  todo: 'todo',
  'in-progress': 'inProgress',
  completed: 'completed'
};

const ACTIVATION_STATUS_BY_STATE: Record<TaskCardState, ActivationTaskStatus> = {
  todo: 'todo',
  'in-progress': 'in_progress',
  completed: 'completed'
};

const reorderCardsInColumn = <T extends { id: string }>(
  cards: T[],
  sourceTaskId: string,
  targetTaskId: string,
  placement: TaskReorderPlacement
) => {
  if (sourceTaskId === targetTaskId) {
    return cards;
  }

  const nextCards = [...cards];
  const sourceIndex = nextCards.findIndex((card) => card.id === sourceTaskId);
  const targetIndex = nextCards.findIndex((card) => card.id === targetTaskId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return cards;
  }

  const [movingCard] = nextCards.splice(sourceIndex, 1);
  const nextTargetIndex = nextCards.findIndex((card) => card.id === targetTaskId);
  const insertIndex = placement === 'before' ? nextTargetIndex : nextTargetIndex + 1;
  nextCards.splice(insertIndex, 0, movingCard);

  const didChange = nextCards.some((card, index) => card.id !== cards[index]?.id);
  return didChange ? nextCards : cards;
};

const statusLabelForCard = (
  status: ActivationTaskStatus,
  progress: ActivationBoardCard['progress']
) => {
  if (progress.total === 0) return null;
  if (status === 'todo') {
    return `${progress.total} linked ${progress.total === 1 ? 'item' : 'items'}`;
  }
  return `${progress.completed}/${progress.total} complete`;
};

const ESTIMATE_BY_GROUP: Record<ActivationTaskGroup, { minutesPerItem: number; kwhPerItem: number }> = {
  theory: { minutesPerItem: 18, kwhPerItem: 5 },
  flashcards: { minutesPerItem: 4, kwhPerItem: 1 },
  notebooks: { minutesPerItem: 12, kwhPerItem: 3 },
  missions: { minutesPerItem: 16, kwhPerItem: 4 }
};

const TASK_CONTEXT_LABEL_BY_GROUP: Record<ActivationTaskGroup, string> = {
  theory: 'Track',
  flashcards: 'Flashcards',
  notebooks: 'Notebook',
  missions: 'Mission'
};

const formatDuration = (totalMinutes: number) => {
  if (totalMinutes <= 0) {
    return '0m';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

const isCardReadyToComplete = (card: ActivationBoardCard) =>
  card.status === 'in_progress' &&
  card.progress.total > 0 &&
  card.progress.completed >= card.progress.total;

const canCardMoveToTodo = (card: ActivationBoardCard) =>
  card.status === 'in_progress' && card.progress.completed === 0;

const FALLBACK_TRACKS = [
  { slug: 'pyspark', title: 'PySpark' },
  { slug: 'fabric', title: 'Microsoft Fabric' }
] as const;

const LOADING_COLUMN_SECTIONS: Array<{ state: TaskCardState; title: string; tone: string }> = [
  { state: 'todo', title: 'To Do', tone: 'bg-[#7f8b86]' },
  { state: 'in-progress', title: 'In Progress', tone: 'bg-[#7d93ba]' },
  { state: 'completed', title: 'Completed', tone: 'bg-[#78c2a2]' }
];

function ActivationBoardLoadingState() {
  return (
    <div className="relative mt-7 sm:pl-6" data-testid="activation-board-loading">
      <div className="max-w-[30rem]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9ba7a1]">
          Loading
        </p>
        <div className="relative mt-3 h-[7px] overflow-hidden rounded-full border border-[#2a312e] bg-[#0a0f0d]/90">
          <motion.div
            aria-hidden
            className="absolute inset-y-0 w-[32%] rounded-full bg-[linear-gradient(90deg,rgba(126,140,133,0.1),rgba(219,229,224,0.8),rgba(126,140,133,0.1))]"
            initial={{ x: '-120%' }}
            animate={{ x: ['-120%', '235%'] }}
            transition={{ duration: 1.45, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
          />
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-1 gap-4 md:grid-flow-col md:auto-cols-[minmax(18.5rem,1fr)] md:overflow-x-auto md:pb-1 md:snap-x md:snap-mandatory lg:grid-cols-3 lg:grid-flow-row lg:auto-cols-auto lg:overflow-visible">
        {LOADING_COLUMN_SECTIONS.map((column) => (
          <section
            key={column.state}
            aria-hidden
            className="relative overflow-hidden rounded-[18px] border border-[#2a312e] bg-[linear-gradient(180deg,#06090a_0%,#050607_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-5"
          >
            <header className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${column.tone}`} />
                <span className="text-sm font-medium text-[#d7e4de]/92">{column.title}</span>
              </div>
              <span className="h-6 w-10 rounded-full border border-[#2c3531] bg-[#0b100f]/85" />
            </header>

            <div className="mt-4 space-y-3">
              {[0, 1].map((index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-[16px] border border-[#232b28] bg-[#090d0c]/88 p-4"
                >
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_0%,rgba(237,244,240,0.07)_45%,transparent_70%)]"
                    initial={{ x: '-130%' }}
                    animate={{ x: ['-130%', '190%'] }}
                    transition={{
                      duration: 1.8,
                      ease: 'easeInOut',
                      repeat: Number.POSITIVE_INFINITY,
                      delay: index * 0.14
                    }}
                  />
                  <div className="relative">
                    <div className="h-4 w-[72%] rounded-full bg-[#151c19]/85" />
                    <div className="mt-3 h-3 w-full rounded-full bg-[#121815]/85" />
                    <div className="mt-2 h-3 w-[82%] rounded-full bg-[#121815]/85" />
                    <div className="mt-4 h-3 w-[42%] rounded-full bg-[#161e1a]/85" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ActivationTable() {
  const [board, setBoard] = useState<ActivationBoardPayload | null>(null);
  const boardRef = useRef<ActivationBoardPayload | null>(null);
  boardRef.current = board;
  // AbortController for the background board refresh fetch.
  // Direct action responses (startTask, moveTask, etc.) abort any in-flight
  // refresh so stale refresh data cannot overwrite a newer authoritative board.
  const boardFetchAbortRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  /** null = create mode; non-null = the card being edited. */
  const [editingCard, setEditingCard] = useState<ActivationBoardCard | null>(null);
  /** Error to surface inside the create/edit modal (e.g. delete failure during edit). */
  const [modalDeleteError, setModalDeleteError] = useState<string | null>(null);
  const [startPendingTaskId, setStartPendingTaskId] = useState<string | null>(null);
  const [movePendingTaskId, setMovePendingTaskId] = useState<string | null>(null);
  const [deletePendingTaskId, setDeletePendingTaskId] = useState<string | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [draggedTask, setDraggedTask] = useState<{
    id: string;
    state: TaskCardState;
    readyToComplete: boolean;
    canMoveToTodo: boolean;
  } | null>(null);
  const [dropColumn, setDropColumn] = useState<TaskCardState | null>(null);
  const [reorderTarget, setReorderTarget] = useState<{
    state: TaskCardState;
    taskId: string;
    placement: TaskReorderPlacement;
  } | null>(null);

  const tracks = useMemo(() => {
    const merged = [...(board?.catalog.tracks ?? []), ...FALLBACK_TRACKS];
    const bySlug = new Map<string, { slug: string; title: string }>();
    merged.forEach((track) => {
      if (!bySlug.has(track.slug)) {
        bySlug.set(track.slug, track);
      }
    });
    return Array.from(bySlug.values());
  }, [board?.catalog.tracks]);
  const inProgressReadyCount = useMemo(
    () => (board?.inProgress ?? []).filter((card) => isCardReadyToComplete(card)).length,
    [board?.inProgress]
  );
  useEffect(() => {
    // Abort any previous fetch so stale responses never overwrite newer data.
    boardFetchAbortRef.current?.abort();
    const controller = new AbortController();
    boardFetchAbortRef.current = controller;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/activation-board', {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal
        });
        const payload = (await response.json()) as {
          data?: ActivationBoardPayload;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to load activation board.');
        }

        setBoard(payload.data ?? null);
      } catch (fetchError) {
        if ((fetchError as { name?: string }).name === 'AbortError') {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Failed to load activation board.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [refreshNonce]);

  // Abort any in-flight board refresh before writing an authoritative board
  // from an action response, preventing stale refresh data from overwriting it.
  const setBoardFromAction = (newBoard: ActivationBoardPayload) => {
    boardFetchAbortRef.current?.abort();
    boardFetchAbortRef.current = null;
    setBoard(newBoard);
  };

  const startTask = async (taskId: string) => {
    setStartPendingTaskId(taskId);
    try {
      const response = await fetch(`/api/activation-tasks/${taskId}/start`, {
        method: 'PATCH',
        headers: {
          'Idempotency-Key': createPayloadRequestKey('activation_task_start', {
            taskId,
            action: 'start'
          })
        },
        credentials: 'include'
      });
      const payload = (await response.json()) as {
        data?: { board?: ActivationBoardPayload };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to start task.');
      }

      if (payload.data?.board) {
        setBoardFromAction(payload.data.board);
      } else {
        setRefreshNonce((value) => value + 1);
      }
      return true;
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Failed to start task.');
      return false;
    } finally {
      setStartPendingTaskId(null);
    }
  };

  const moveTaskToTodo = async (taskId: string) => {
    setMovePendingTaskId(taskId);
    try {
      const response = await fetch(`/api/activation-tasks/${taskId}/todo`, {
        method: 'PATCH',
        headers: {
          'Idempotency-Key': createPayloadRequestKey('activation_task_todo', {
            taskId,
            action: 'move_to_todo'
          })
        },
        credentials: 'include'
      });
      const payload = (await response.json()) as {
        data?: { board?: ActivationBoardPayload };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to move task to To Do.');
      }

      if (payload.data?.board) {
        setBoardFromAction(payload.data.board);
      } else {
        setRefreshNonce((value) => value + 1);
      }
      return true;
    } catch (moveError) {
      setError(
        moveError instanceof Error ? moveError.message : 'Failed to move task to To Do.'
      );
      return false;
    } finally {
      setMovePendingTaskId(null);
    }
  };

  const moveTaskToCompleted = async (taskId: string) => {
    setMovePendingTaskId(taskId);
    try {
      const response = await fetch(`/api/activation-tasks/${taskId}/completed`, {
        method: 'PATCH',
        headers: {
          'Idempotency-Key': createPayloadRequestKey('activation_task_completed', {
            taskId,
            action: 'move_to_completed'
          })
        },
        credentials: 'include'
      });
      const payload = (await response.json()) as {
        data?: { board?: ActivationBoardPayload };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to move task to Completed.');
      }

      if (payload.data?.board) {
        setBoardFromAction(payload.data.board);
      } else {
        setRefreshNonce((value) => value + 1);
      }
      return true;
    } catch (moveError) {
      setError(
        moveError instanceof Error ? moveError.message : 'Failed to move task to Completed.'
      );
      return false;
    } finally {
      setMovePendingTaskId(null);
    }
  };

  const persistTaskReorder = async (state: TaskCardState, orderedTaskIds: string[]) => {
    try {
      const requestBody = {
        status: ACTIVATION_STATUS_BY_STATE[state],
        orderedTaskIds
      };
      const response = await fetch('/api/activation-tasks/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': createPayloadRequestKey(
            'activation_task_reorder',
            requestBody
          )
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
      const payload = (await response.json()) as {
        data?: { board?: ActivationBoardPayload };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to reorder tasks.');
      }

      if (payload.data?.board) {
        setBoardFromAction(payload.data.board);
      } else {
        setRefreshNonce((value) => value + 1);
      }
      return true;
    } catch (reorderError) {
      setError(
        reorderError instanceof Error ? reorderError.message : 'Failed to reorder tasks.'
      );
      return false;
    }
  };

  const applyOptimisticTaskMove = (
    sourceTaskId: string,
    sourceState: TaskCardState,
    targetState: TaskCardState
  ) => {
    setBoard((currentBoard) => {
      if (!currentBoard) return currentBoard;

      const sourceKey = BOARD_COLUMN_KEY_BY_STATE[sourceState];
      const targetKey = BOARD_COLUMN_KEY_BY_STATE[targetState];
      if (sourceKey === targetKey) return currentBoard;

      const sourceTasks = [...currentBoard[sourceKey]];
      const sourceIndex = sourceTasks.findIndex((task) => task.id === sourceTaskId);
      if (sourceIndex === -1) return currentBoard;

      const [movingTask] = sourceTasks.splice(sourceIndex, 1);
      const nextStatus = ACTIVATION_STATUS_BY_STATE[targetState];
      const movedTask: ActivationBoardCard = {
        ...movingTask,
        status: nextStatus,
        statusLabel: statusLabelForCard(nextStatus, movingTask.progress),
        actionLabel: nextStatus === 'todo' ? 'Start' : nextStatus === 'in_progress' ? 'Open' : null
      };

      return {
        ...currentBoard,
        [sourceKey]: sourceTasks,
        [targetKey]: [movedTask, ...currentBoard[targetKey]]
      };
    });
  };

  const applyOptimisticTaskReorder = (
    state: TaskCardState,
    sourceTaskId: string,
    targetTaskId: string,
    placement: TaskReorderPlacement
  ) => {
    setBoard((currentBoard) => {
      if (!currentBoard) return currentBoard;

      const key = BOARD_COLUMN_KEY_BY_STATE[state];
      const reorderedCards = reorderCardsInColumn(
        currentBoard[key],
        sourceTaskId,
        targetTaskId,
        placement
      );

      if (reorderedCards === currentBoard[key]) {
        return currentBoard;
      }

      return {
        ...currentBoard,
        [key]: reorderedCards
      };
    });
  };

  const handleColumnDragOver = (state: TaskCardState) => {
    setDropColumn((current) => (current === state ? current : state));
  };

  const handleColumnDragLeave = (state: TaskCardState) => {
    setDropColumn((current) => (current === state ? null : current));
  };

  const handleBlockedCompletedDrop = () => {
    clearDragState();
    setError(
      draggedTask?.state === 'todo'
        ? 'Move the task into In Progress before completing it.'
        : 'Finish all linked items to unlock Completed.'
    );
  };

  const handleBlockedTodoDrop = () => {
    clearDragState();
    setError('Tasks with completed progress cannot move back to To Do.');
  };

  const clearDragState = () => {
    setDraggedTask(null);
    setDropColumn(null);
    setReorderTarget(null);
  };

  const handleTaskReorderPreview = (
    state: TaskCardState,
    taskId: string,
    placement: TaskReorderPlacement
  ) => {
    if (!draggedTask || draggedTask.state !== state || draggedTask.id === taskId) {
      return;
    }

    setDropColumn(null);
    setReorderTarget((current) => {
      if (
        current?.state === state &&
        current.taskId === taskId &&
        current.placement === placement
      ) {
        return current;
      }

      return {
        state,
        taskId,
        placement
      };
    });
  };

  const handleTaskReorderDrop = async (
    state: TaskCardState,
    targetTaskId: string,
    placement: TaskReorderPlacement
  ) => {
    if (!draggedTask || draggedTask.state !== state || !board) {
      clearDragState();
      return;
    }

    const sourceTaskId = draggedTask.id;
    const key = BOARD_COLUMN_KEY_BY_STATE[state];
    const reorderedCards = reorderCardsInColumn(
      board[key],
      sourceTaskId,
      targetTaskId,
      placement
    );
    const previousBoard = boardRef.current;

    clearDragState();

    if (reorderedCards === board[key]) {
      return;
    }

    applyOptimisticTaskReorder(state, sourceTaskId, targetTaskId, placement);
    const reordered = await persistTaskReorder(
      state,
      reorderedCards.map((card) => card.id)
    );

    if (!reordered) {
      setBoard(previousBoard);
    }
  };

  const handleTaskDrop = async (targetState: TaskCardState) => {
    if (!draggedTask) return;
    const sourceTask = draggedTask;
    clearDragState();

    if (sourceTask.state === targetState) return;

    if (sourceTask.state === 'todo' && targetState === 'in-progress') {
      const previousBoard = boardRef.current;
      applyOptimisticTaskMove(sourceTask.id, 'todo', 'in-progress');
      const started = await startTask(sourceTask.id);
      if (!started && previousBoard) {
        setBoard(previousBoard);
      }
      return;
    }

    if (sourceTask.state === 'in-progress' && targetState === 'todo') {
      const previousBoard = boardRef.current;
      applyOptimisticTaskMove(sourceTask.id, 'in-progress', 'todo');
      const moved = await moveTaskToTodo(sourceTask.id);
      if (!moved && previousBoard) {
        setBoard(previousBoard);
      }
      return;
    }

    if (sourceTask.state === 'in-progress' && targetState === 'completed') {
      const previousBoard = boardRef.current;
      applyOptimisticTaskMove(sourceTask.id, 'in-progress', 'completed');
      const moved = await moveTaskToCompleted(sourceTask.id);
      if (!moved && previousBoard) {
        setBoard(previousBoard);
      }
      return;
    }

    setError('Tasks can move between To Do and In Progress, then into Completed once unlocked.');
  };

  const openCreate = useCallback(() => {
    setEditingCard(null);
    setModalDeleteError(null);
    setError(null);
    setIsCreateOpen(true);
  }, []);

  const openEdit = useCallback((card: ActivationBoardCard) => {
    if (card.status === 'completed') {
      setError('Completed tasks cannot be edited.');
      return;
    }
    setEditingCard(card);
    setModalDeleteError(null);
    setError(null);
    setIsCreateOpen(true);
  }, []);

  const closeCreate = useCallback(() => {
    setIsCreateOpen(false);
    setEditingCard(null);
    setModalDeleteError(null);
  }, []);

  const deleteTask = async (taskId: string) => {
    const isEditingTask = editingCard?.id === taskId;
    setDeletePendingTaskId(taskId);
    setError(null);
    if (isEditingTask) setModalDeleteError(null);
    try {
      const response = await fetch(`/api/activation-tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Idempotency-Key': createPayloadRequestKey('activation_task_delete', {
            taskId,
            action: 'delete'
          })
        },
        credentials: 'include'
      });
      const payload = (await response.json()) as {
        data?: { board?: ActivationBoardPayload };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to delete task.');
      }

      if (payload.data?.board) {
        setBoardFromAction(payload.data.board);
      } else {
        setRefreshNonce((value) => value + 1);
      }
      return true;
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Failed to delete task.';
      if (isEditingTask) {
        setModalDeleteError(message);
      } else {
        setError(message);
      }
      return false;
    } finally {
      setDeletePendingTaskId(null);
    }
  };

  const requestDeleteTask = useCallback((card: ActivationBoardCard) => {
    setError(null);
    setDeleteConfirmTask({ id: card.id, title: card.title });
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirmTask((current) => {
      if (current && deletePendingTaskId === current.id) return current;
      return null;
    });
  }, [deletePendingTaskId]);

  const confirmDeleteTask = async () => {
    if (!deleteConfirmTask) return;
    const taskId = deleteConfirmTask.id;
    const deleted = await deleteTask(taskId);
    setDeleteConfirmTask(null);
    if (deleted && editingCard?.id === taskId) {
      closeCreate();
    }
  };

  const toCardData = (cards: ActivationBoardCard[]): TaskCardData[] =>
    cards.map((card) => ({
      id: card.id,
      title: card.title,
      subtitle: card.description,
      kind: card.taskType,
      kindLabel: card.taskType === 'theory' ? 'Theory' : 'Task',
      contextLabel:
        card.taskType === 'theory'
          ? card.trackTitle ?? 'Track'
          : TASK_CONTEXT_LABEL_BY_GROUP[card.taskGroup],
      readyToComplete: isCardReadyToComplete(card),
      statusLabel: card.statusLabel ?? undefined,
      actionLabel: undefined,
      onAction: null,
      actionDisabled: startPendingTaskId === card.id || movePendingTaskId === card.id,
      onEdit: card.status !== 'completed' ? () => openEdit(card) : null,
      editDisabled: deletePendingTaskId === card.id,
      href: card.status === 'in_progress' ? (card.actionHref ?? null) : null
    }));

  const todoCards = toCardData(board?.todo ?? []);
  const inProgressCards = toCardData(board?.inProgress ?? []);
  const completedCards = toCardData(board?.completed ?? []);
  const getCardByState = (taskId: string, state: TaskCardState) => {
    const cards =
      state === 'todo'
        ? board?.todo ?? []
        : state === 'in-progress'
          ? board?.inProgress ?? []
          : board?.completed ?? [];

    return cards.find((card) => card.id === taskId) ?? null;
  };
  const beginTaskDrag = (taskId: string, state: TaskCardState) => {
    const card = getCardByState(taskId, state);
    setDraggedTask({
      id: taskId,
      state,
      readyToComplete: card ? isCardReadyToComplete(card) : false,
      canMoveToTodo: card ? canCardMoveToTodo(card) : false
    });
    setDropColumn(null);
    setReorderTarget(null);
    setError(null);
  };
  const commitmentEstimates = useMemo(() => {
    const activeCards = [...(board?.todo ?? []), ...(board?.inProgress ?? [])];
    return activeCards.reduce(
      (accumulator, card) => {
        const estimate = ESTIMATE_BY_GROUP[card.taskGroup];
        const remainingItems = Math.max(card.progress.total - card.progress.completed, 0);
        return {
          minutes: accumulator.minutes + remainingItems * estimate.minutesPerItem,
          kwh: accumulator.kwh + remainingItems * estimate.kwhPerItem
        };
      },
      { minutes: 0, kwh: 0 }
    );
  }, [board?.inProgress, board?.todo]);

  return (
    <section
      data-testid="home-activation-table"
      className="mx-auto w-full max-w-[1240px]"
    >
      <div className="relative overflow-hidden border border-[#f0a030]/20 bg-[#08090b] px-5 py-6 shadow-[0_0_60px_-20px_rgba(240,160,48,0.15),0_30px_80px_-52px_rgba(0,0,0,0.9)] sm:px-7 sm:py-7 lg:px-9 lg:py-8">
        {/* Tactical grid overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(240,160,48,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(240,160,48,0.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />
        {/* Orange top stripe */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f0a030] to-transparent"
          style={{ boxShadow: '0 0 18px 2px rgba(240,160,48,0.45)' }}
        />
        {/* Ambient orange glow top-left */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_0%,rgba(240,160,48,0.07),transparent_45%)]"
        />
        {/* Corner bracket decorations */}
        <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-[#f0a030]/50" />
        <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-[#f0a030]/50" />
        <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-[#f0a030]/20" />
        <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-[#f0a030]/20" />

        <header className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            {/* Ops label */}
            <p className="font-mono text-[9px] font-medium uppercase tracking-[0.45em] text-[#f0a030]/50">
              // OPS · MISSION BOARD ·
            </p>
            {/* Main title */}
            <h2 className="mt-1 font-mono text-[clamp(1rem,2vw,1.4rem)] font-black uppercase tracking-[0.22em] text-[#f5f0e8]" style={{ textShadow: '0 0 32px rgba(240,160,48,0.2)' }}>
              Activation Table
            </h2>
            {/* Orange underline accent */}
            <div aria-hidden className="mt-2 h-px w-full max-w-xs bg-gradient-to-r from-[#f0a030]/70 via-[#f0a030]/30 to-transparent" style={{ boxShadow: '0 0 8px rgba(240,160,48,0.4)' }} />
            {/* HUD stat panels */}
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <div className="border border-[#f0a030]/30 bg-[#0d0e0b] px-3.5 py-2" style={{ boxShadow: 'inset 0 1px 0 rgba(240,160,48,0.06)' }}>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#f0a030]/60">
                  Time Needed
                </p>
                <p className="mt-0.5 font-mono text-[11px] font-bold text-[#f0a030]" style={{ textShadow: '0 0 10px rgba(240,160,48,0.4)' }}>
                  {formatDuration(commitmentEstimates.minutes)}
                </p>
              </div>
              <div className="border border-[#f0a030]/30 bg-[#0d0e0b] px-3.5 py-2" style={{ boxShadow: 'inset 0 1px 0 rgba(240,160,48,0.06)' }}>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#f0a030]/60">
                  kWh Gain
                </p>
                <p className="mt-0.5 font-mono text-[11px] font-bold text-[#f0a030]" style={{ textShadow: '0 0 10px rgba(240,160,48,0.4)' }}>
                  +{commitmentEstimates.kwh} kWh
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="group relative w-fit overflow-hidden border border-[#f0a030]/60 bg-[#0d0e0a] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#f0a030] transition-all duration-200 hover:border-[#f0a030] hover:bg-[#f0a030]/10 hover:shadow-[0_0_20px_rgba(240,160,48,0.25)]"
          >
            <span className="relative z-10">▶ Create task</span>
          </button>
        </header>
        <div
          aria-hidden
          className="relative mt-4 h-px bg-gradient-to-r from-[#f0a030]/40 via-[#f0a030]/15 to-transparent"
        />

        {loading ? (
          <ActivationBoardLoadingState />
        ) : error ? (
          <p className="relative mt-7 text-sm text-[#d6a0a0] sm:pl-6">{error}</p>
        ) : (
          <LayoutGroup id="activation-task-board">
            <div className="relative mt-8 grid grid-cols-1 gap-6 sm:pl-6 md:grid-flow-col md:auto-cols-[minmax(20rem,1fr)] md:overflow-x-auto md:pb-1 md:snap-x md:snap-mandatory lg:grid-cols-3 lg:grid-flow-row lg:auto-cols-auto lg:overflow-visible">
              <BoardColumn
                title="To Do"
                state="todo"
                tasks={todoCards}
                draggedTaskId={draggedTask?.state === 'todo' ? draggedTask.id : null}
                reorderTarget={
                  reorderTarget?.state === 'todo'
                    ? { taskId: reorderTarget.taskId, placement: reorderTarget.placement }
                    : null
                }
                dropEnabled={draggedTask?.state === 'in-progress' && draggedTask.canMoveToTodo}
                dropBlocked={draggedTask?.state === 'in-progress' && !draggedTask.canMoveToTodo}
                dropActive={dropColumn === 'todo' && draggedTask?.state === 'in-progress'}
                showDropSlot={dropColumn === 'todo' && draggedTask?.state === 'in-progress'}
                dropSlotLabel={
                  draggedTask?.state === 'in-progress'
                    ? draggedTask.canMoveToTodo
                      ? 'Move back to To Do'
                      : 'Progress keeps this active'
                    : ''
                }
                blockedHint="Tasks with completed progress stay active until they are finished."
                onDropTask={(state) => {
                  void handleTaskDrop(state);
                }}
                onBlockedDrop={handleBlockedTodoDrop}
                onColumnDragOver={handleColumnDragOver}
                onColumnDragLeave={handleColumnDragLeave}
                onTaskDragStart={beginTaskDrag}
                onTaskDragEnd={clearDragState}
                onTaskReorderPreview={handleTaskReorderPreview}
                onTaskReorderDrop={(state, taskId, placement) => {
                  void handleTaskReorderDrop(state, taskId, placement);
                }}
              />
              <BoardColumn
                title="In Progress"
                state="in-progress"
                tasks={inProgressCards}
                draggedTaskId={draggedTask?.state === 'in-progress' ? draggedTask.id : null}
                reorderTarget={
                  reorderTarget?.state === 'in-progress'
                    ? { taskId: reorderTarget.taskId, placement: reorderTarget.placement }
                    : null
                }
                dropEnabled={draggedTask?.state === 'todo'}
                dropActive={dropColumn === 'in-progress' && draggedTask?.state === 'todo'}
                showDropSlot={dropColumn === 'in-progress' && draggedTask?.state === 'todo'}
                dropSlotLabel={draggedTask?.state === 'todo' ? 'Move into In Progress' : ''}
                onDropTask={(state) => {
                  void handleTaskDrop(state);
                }}
                onColumnDragOver={handleColumnDragOver}
                onColumnDragLeave={handleColumnDragLeave}
                onTaskDragStart={beginTaskDrag}
                onTaskDragEnd={clearDragState}
                onTaskReorderPreview={handleTaskReorderPreview}
                onTaskReorderDrop={(state, taskId, placement) => {
                  void handleTaskReorderDrop(state, taskId, placement);
                }}
              />
              <BoardColumn
                title="Completed"
                state="completed"
                tasks={completedCards}
                draggedTaskId={draggedTask?.state === 'completed' ? draggedTask.id : null}
                reorderTarget={
                  reorderTarget?.state === 'completed'
                    ? { taskId: reorderTarget.taskId, placement: reorderTarget.placement }
                    : null
                }
                ambientHighlight={inProgressReadyCount > 0}
                ambientHint={
                  inProgressReadyCount > 0
                    ? `${inProgressReadyCount} task${inProgressReadyCount === 1 ? '' : 's'} unlocked. Drag into Completed.`
                    : ''
                }
                dropEnabled={draggedTask?.state === 'in-progress' && draggedTask.readyToComplete}
                dropBlocked={
                  draggedTask?.state === 'todo' ||
                  (draggedTask?.state === 'in-progress' && !draggedTask.readyToComplete)
                }
                dropActive={
                  dropColumn === 'completed' &&
                  (draggedTask?.state === 'todo' || draggedTask?.state === 'in-progress')
                }
                showDropSlot={
                  dropColumn === 'completed' &&
                  (draggedTask?.state === 'todo' || draggedTask?.state === 'in-progress')
                }
                dropSlotLabel={
                  draggedTask?.state === 'in-progress' && draggedTask.readyToComplete
                    ? 'Release to complete'
                    : draggedTask?.state === 'todo'
                      ? 'Move into In Progress first'
                      : draggedTask?.state === 'in-progress'
                        ? 'Locked until all linked items are done'
                        : ''
                }
                blockedHint={
                  draggedTask?.state === 'todo'
                    ? 'Move the task into In Progress before you complete it.'
                    : 'Finish all linked items to unlock Completed.'
                }
                onDropTask={(state) => {
                  void handleTaskDrop(state);
                }}
                onBlockedDrop={handleBlockedCompletedDrop}
                onColumnDragOver={handleColumnDragOver}
                onColumnDragLeave={handleColumnDragLeave}
                onTaskDragStart={beginTaskDrag}
                onTaskDragEnd={clearDragState}
                onTaskReorderPreview={handleTaskReorderPreview}
                onTaskReorderDrop={(state, taskId, placement) => {
                  void handleTaskReorderDrop(state, taskId, placement);
                }}
              />
            </div>
          </LayoutGroup>
        )}
      </div>

      {isCreateOpen ? (
        <CreateTaskModal
          key={editingCard?.id ?? 'new'}
          editingCard={editingCard}
          catalog={board?.catalog ?? null}
          tracks={tracks}
          pendingDeleteId={deletePendingTaskId}
          forceError={modalDeleteError}
          onClose={closeCreate}
          onBoardUpdate={setBoardFromAction}
          onRefresh={() => setRefreshNonce((n) => n + 1)}
          onRequestDelete={requestDeleteTask}
        />
      ) : null}

      <DeleteTaskModal
        task={deleteConfirmTask}
        isPending={deletePendingTaskId === deleteConfirmTask?.id}
        onClose={closeDeleteConfirm}
        onConfirm={() => void confirmDeleteTask()}
      />
    </section>
  );
}
