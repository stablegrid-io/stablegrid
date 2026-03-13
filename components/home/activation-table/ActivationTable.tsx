'use client';

import { useEffect, useMemo, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { BoardColumn } from '@/components/home/activation-table/components/BoardColumn';
import type {
  TaskCardData,
  TaskCardState
} from '@/components/home/activation-table/components/TaskCard';

type ActivationTaskType = 'theory' | 'task';
type ActivationTaskGroup = 'theory' | 'flashcards' | 'notebooks' | 'missions';
type ActivationTaskStatus = 'todo' | 'in_progress' | 'completed';

interface ActivationBoardCard {
  id: string;
  title: string;
  description: string;
  status: ActivationTaskStatus;
  taskType: ActivationTaskType;
  taskGroup: ActivationTaskGroup;
  trackSlug: string | null;
  trackTitle: string | null;
  scopeType: 'count' | 'all_remaining';
  requestedCount: number | null;
  progress: {
    completed: number;
    total: number;
  };
  primaryContentItemId: string | null;
  statusLabel: string | null;
  actionLabel: 'Start' | 'Open' | null;
}

interface ActivationCatalogTaskOption {
  id: string;
  title: string;
  label: string;
  trackSlug: string | null;
  trackTitle: string | null;
}

interface ActivationBoardPayload {
  todo: ActivationBoardCard[];
  inProgress: ActivationBoardCard[];
  completed: ActivationBoardCard[];
  catalog: {
    tracks: Array<{ slug: string; title: string }>;
    taskOptions?: {
      theory: ActivationCatalogTaskOption[];
      theoryCompleted: ActivationCatalogTaskOption[];
      flashcards: ActivationCatalogTaskOption[];
      notebooks: ActivationCatalogTaskOption[];
      missions: ActivationCatalogTaskOption[];
    };
  };
}

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

const SUBJECT_TRACK_OPTIONS_BY_SLUG: Record<string, Array<{ slug: string; label: string }>> = {
  pyspark: [
    { slug: 'full-stack', label: 'PySpark: The Full Stack' },
    { slug: 'data-engineering-track', label: 'PySpark: Data Engineering Track' }
  ],
  fabric: [{ slug: 'full-stack', label: 'Fabric: End-to-End Platform' }]
};

const resolveCopyPreview = ({
  taskType,
  taskGroup,
  scopeType,
  requestedCount,
  trackTitle
}: {
  taskType: ActivationTaskType;
  taskGroup: ActivationTaskGroup;
  scopeType: 'count' | 'all_remaining';
  requestedCount: number | null;
  trackTitle: string | null;
}) => {
  if (taskType === 'theory') {
    if (scopeType === 'all_remaining') {
      return {
        title: `Complete all remaining ${trackTitle ?? 'track'} theory`,
        description: 'Continue through the next theory units in this track.'
      };
    }

    const count = requestedCount ?? 1;
    return {
      title: `Complete ${count} ${trackTitle ?? 'track'} ${count === 1 ? 'module' : 'modules'}`,
      description: 'Continue through the next theory units in this track.'
    };
  }

  if (taskGroup === 'flashcards') {
    if (scopeType === 'all_remaining') {
      return {
        title: `Complete all remaining ${trackTitle ?? 'track'} flashcards`,
        description: 'Apply your learning through guided practical work.'
      };
    }

    const count = requestedCount ?? 1;
    return {
      title: `Complete ${count} ${trackTitle ?? 'track'} ${count === 1 ? 'flashcard' : 'flashcards'}`,
      description: 'Apply your learning through guided practical work.'
    };
  }

  if (taskGroup === 'notebooks') {
    if (scopeType === 'all_remaining') {
      return {
        title: `Complete all remaining ${trackTitle ?? 'track'} notebooks`,
        description: 'Apply your learning through guided practical work.'
      };
    }

    const count = requestedCount ?? 1;
    return {
      title: `Complete ${count} ${trackTitle ?? 'track'} ${count === 1 ? 'notebook' : 'notebooks'}`,
      description: 'Apply your learning through guided practical work.'
    };
  }

  if (scopeType === 'all_remaining') {
    return {
      title: 'Complete all remaining missions',
      description: 'Apply your learning through guided practical work.'
    };
  }

  const count = requestedCount ?? 1;
  return {
    title: `Complete ${count} ${count === 1 ? 'mission' : 'missions'}`,
    description: 'Apply your learning through guided practical work.'
  };
};

const MODAL_FIELD_CLASS =
  'mt-1 h-10 w-full rounded-[11px] border border-[#2f3c50] bg-[#1a2436] px-3 text-sm text-[#e9eff8] outline-none transition-all focus:border-[#7f8fa8] focus:ring-2 focus:ring-[#8f99a3]/20';

const MODAL_LABEL_CLASS = 'text-xs font-medium text-[#a9b6c8]';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [startPendingTaskId, setStartPendingTaskId] = useState<string | null>(null);
  const [deletePendingTaskId, setDeletePendingTaskId] = useState<string | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
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

  const [taskType, setTaskType] = useState<ActivationTaskType>('theory');
  const [taskGroup, setTaskGroup] = useState<ActivationTaskGroup>('theory');
  const [trackSlug, setTrackSlug] = useState<string>('pyspark');
  const [subjectTrackSlug, setSubjectTrackSlug] = useState<string>('full-stack');
  const [selectedTaskOptionId, setSelectedTaskOptionId] = useState<string>('');
  const [selectedTheoryModuleIds, setSelectedTheoryModuleIds] = useState<string[]>([]);
  const [showFinishedTheoryModules, setShowFinishedTheoryModules] = useState(false);
  const [scopeValue, setScopeValue] = useState<'1' | '2' | '3' | 'all'>('1');

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
  const activeTrack = tracks.find((track) => track.slug === trackSlug) ?? tracks[0] ?? null;
  const subjectTracks = useMemo(() => {
    const predefined = SUBJECT_TRACK_OPTIONS_BY_SLUG[trackSlug];
    if (predefined?.length) {
      return predefined;
    }

    const subjectTitle = activeTrack?.title ?? 'Track';
    return [{ slug: 'full-stack', label: `${subjectTitle}: The Full Stack` }];
  }, [activeTrack?.title, trackSlug]);
  const taskOptionsByGroup = board?.catalog.taskOptions ?? {
    theory: [],
    theoryCompleted: [],
    flashcards: [],
    notebooks: [],
    missions: []
  };
  const availableTheoryModules = taskOptionsByGroup.theory.filter(
    (option) => option.trackSlug === trackSlug
  );
  const completedTheoryModules = taskOptionsByGroup.theoryCompleted.filter(
    (option) => option.trackSlug === trackSlug
  );
  const selectedTheoryModules = availableTheoryModules.filter((option) =>
    selectedTheoryModuleIds.includes(option.id)
  );
  const isSpecificTheorySelection =
    taskType === 'theory' && selectedTheoryModuleIds.length > 0;
  const activeTaskOptions =
    taskType === 'task'
      ? taskGroup === 'flashcards'
        ? taskOptionsByGroup.flashcards
        : taskGroup === 'notebooks'
          ? taskOptionsByGroup.notebooks
          : taskGroup === 'missions'
            ? taskOptionsByGroup.missions
            : []
      : [];
  const selectedTaskOption =
    activeTaskOptions.find((option) => option.id === selectedTaskOptionId) ?? null;
  const editingCard = editingTaskId
    ? [...(board?.todo ?? []), ...(board?.inProgress ?? []), ...(board?.completed ?? [])].find(
        (card) => card.id === editingTaskId
      ) ?? null
    : null;
  const inProgressReadyCount = useMemo(
    () => (board?.inProgress ?? []).filter((card) => isCardReadyToComplete(card)).length,
    [board?.inProgress]
  );
  const scopeType = scopeValue === 'all' ? 'all_remaining' : 'count';
  const requestedCount = scopeValue === 'all' ? null : Number(scopeValue);

  const preview = useMemo(
    () => {
      if (taskType === 'task') {
        if (selectedTaskOption) {
          return {
            title: `Complete ${selectedTaskOption.title}`,
            description: 'Apply your learning through guided practical work.'
          };
        }

        return {
          title: 'No available items right now',
          description: 'Complete pending or active items first, then create a new task.'
        };
      }

      if (isSpecificTheorySelection) {
        if (selectedTheoryModules.length === 1) {
          return {
            title: `Complete ${selectedTheoryModules[0].title}`,
            description: 'Continue through this theory module in your track.'
          };
        }

        if (selectedTheoryModules.length > 1) {
          return {
            title: `Complete ${selectedTheoryModules.length} selected modules`,
            description: 'Continue through these selected theory modules in your track.'
          };
        }

        if (completedTheoryModules.length > 0) {
          return {
            title: 'All modules in this track are finished',
            description: 'Finished modules are listed below. Choose another track to create a new commitment.'
          };
        }

        return {
          title: 'No available modules right now',
          description: 'Complete pending or active items first, then create a new task.'
        };
      }

      return (
      resolveCopyPreview({
        taskType,
        taskGroup,
        scopeType,
        requestedCount,
        trackTitle: taskGroup === 'missions' ? null : activeTrack?.title ?? null
      })
      );
    },
    [
      activeTrack?.title,
      completedTheoryModules.length,
      isSpecificTheorySelection,
      requestedCount,
      selectedTheoryModules,
      scopeType,
      selectedTaskOption,
      taskGroup,
      taskType
    ]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/activation-board', {
          method: 'GET',
          credentials: 'include'
        });
        const payload = (await response.json()) as {
          data?: ActivationBoardPayload;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to load activation board.');
        }

        if (!cancelled) {
          setBoard(payload.data ?? null);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Failed to load activation board.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [refreshNonce]);

  const startTask = async (taskId: string) => {
    setStartPendingTaskId(taskId);
    try {
      const response = await fetch(`/api/activation-tasks/${taskId}/start`, {
        method: 'PATCH',
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
        setBoard(payload.data.board);
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
    setStartPendingTaskId(taskId);
    try {
      const response = await fetch(`/api/activation-tasks/${taskId}/todo`, {
        method: 'PATCH',
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
        setBoard(payload.data.board);
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
      setStartPendingTaskId(null);
    }
  };

  const moveTaskToCompleted = async (taskId: string) => {
    setStartPendingTaskId(taskId);
    try {
      const response = await fetch(`/api/activation-tasks/${taskId}/completed`, {
        method: 'PATCH',
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
        setBoard(payload.data.board);
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
      setStartPendingTaskId(null);
    }
  };

  const persistTaskReorder = async (state: TaskCardState, orderedTaskIds: string[]) => {
    try {
      const response = await fetch('/api/activation-tasks/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: ACTIVATION_STATUS_BY_STATE[state],
          orderedTaskIds
        })
      });
      const payload = (await response.json()) as {
        data?: { board?: ActivationBoardPayload };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to reorder tasks.');
      }

      if (payload.data?.board) {
        setBoard(payload.data.board);
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
    const previousBoard = board;

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
      const previousBoard = board;
      applyOptimisticTaskMove(sourceTask.id, 'todo', 'in-progress');
      const started = await startTask(sourceTask.id);
      if (!started && previousBoard) {
        setBoard(previousBoard);
      }
      return;
    }

    if (sourceTask.state === 'in-progress' && targetState === 'todo') {
      const previousBoard = board;
      applyOptimisticTaskMove(sourceTask.id, 'in-progress', 'todo');
      const moved = await moveTaskToTodo(sourceTask.id);
      if (!moved && previousBoard) {
        setBoard(previousBoard);
      }
      return;
    }

    if (sourceTask.state === 'in-progress' && targetState === 'completed') {
      const previousBoard = board;
      applyOptimisticTaskMove(sourceTask.id, 'in-progress', 'completed');
      const moved = await moveTaskToCompleted(sourceTask.id);
      if (!moved && previousBoard) {
        setBoard(previousBoard);
      }
      return;
    }

    setError('Tasks can move between To Do and In Progress, then into Completed once unlocked.');
  };

  const resetTaskForm = () => {
    setTaskType('theory');
    setTaskGroup('theory');
    setTrackSlug('pyspark');
    setSubjectTrackSlug('full-stack');
    setSelectedTaskOptionId('');
    setSelectedTheoryModuleIds([]);
    setShowFinishedTheoryModules(false);
    setScopeValue('1');
  };

  const openCreate = () => {
    setEditingTaskId(null);
    resetTaskForm();
    setError(null);
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const openEdit = (card: ActivationBoardCard) => {
    if (card.status === 'completed') {
      setError('Completed tasks cannot be edited.');
      return;
    }

    setEditingTaskId(card.id);
    setTaskType(card.taskType);
    setTaskGroup(card.taskGroup);
    if (card.trackSlug) {
      setTrackSlug(card.trackSlug);
    } else if (tracks[0]) {
      setTrackSlug(tracks[0].slug);
    }
    setSubjectTrackSlug('full-stack');
    setSelectedTaskOptionId(card.primaryContentItemId ?? '');
    setSelectedTheoryModuleIds(
      card.taskType === 'theory' && card.primaryContentItemId
        ? [card.primaryContentItemId]
        : []
    );
    setShowFinishedTheoryModules(false);
    setScopeValue(
      card.scopeType === 'all_remaining'
        ? 'all'
        : (String(card.requestedCount ?? 1) as '1' | '2' | '3')
    );
    setError(null);
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    if (createSubmitting) return;
    setIsCreateOpen(false);
    setCreateError(null);
    setEditingTaskId(null);
    resetTaskForm();
  };

  const submitTaskForm = async () => {
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      const payload: Record<string, unknown> = {
        taskType,
        taskGroup
      };

      if (taskType === 'task') {
        if (!selectedTaskOptionId) {
          throw new Error('Select one item to continue.');
        }
        payload.contentItemId = selectedTaskOptionId;
        payload.scopeType = 'count';
        payload.requestedCount = 1;
      } else {
        if (selectedTheoryModuleIds.length > 0) {
          payload.contentItemIds = selectedTheoryModuleIds;
          payload.scopeType = 'count';
          payload.requestedCount = selectedTheoryModuleIds.length;
          payload.trackSlug = trackSlug;
        } else {
          payload.scopeType = scopeType;
          payload.trackSlug = trackSlug;
          if (scopeType === 'count') {
            payload.requestedCount = requestedCount;
          }
        }
      }

      const isEditing = editingTaskId !== null;
      const response = await fetch(
        isEditing ? `/api/activation-tasks/${editingTaskId}` : '/api/activation-tasks',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        }
      );
      const responsePayload = (await response.json()) as {
        data?: { board?: ActivationBoardPayload };
        error?: string;
        remainingCount?: number;
      };

      if (!response.ok) {
        if (response.status === 422 && typeof responsePayload.remainingCount === 'number') {
          throw new Error(
            `${responsePayload.error ?? 'Not enough eligible items.'} Remaining: ${responsePayload.remainingCount}.`
          );
        }
        throw new Error(
          responsePayload.error ?? (isEditing ? 'Failed to edit task.' : 'Failed to create task.')
        );
      }

      if (responsePayload.data?.board) {
        setBoard(responsePayload.data.board);
      } else {
        setRefreshNonce((value) => value + 1);
      }
      setIsCreateOpen(false);
      setEditingTaskId(null);
      resetTaskForm();
    } catch (submitError) {
      setCreateError(
        submitError instanceof Error
          ? submitError.message
          : editingTaskId
            ? 'Failed to edit task.'
            : 'Failed to create task.'
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    const isEditingTask = editingTaskId === taskId;
    setDeletePendingTaskId(taskId);
    setError(null);
    if (isEditingTask) {
      setCreateError(null);
    }
    try {
      const response = await fetch(`/api/activation-tasks/${taskId}`, {
        method: 'DELETE',
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
        setBoard(payload.data.board);
      } else {
        setRefreshNonce((value) => value + 1);
      }
      return true;
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Failed to delete task.';
      if (isEditingTask) {
        setCreateError(message);
      } else {
        setError(message);
      }
      return false;
    } finally {
      setDeletePendingTaskId(null);
    }
  };

  const requestDeleteTask = (card: ActivationBoardCard) => {
    setError(null);
    setDeleteConfirmTask({
      id: card.id,
      title: card.title
    });
  };

  const closeDeleteConfirm = () => {
    if (deleteConfirmTask && deletePendingTaskId === deleteConfirmTask.id) {
      return;
    }
    setDeleteConfirmTask(null);
  };

  useEffect(() => {
    if (!isCreateOpen && !deleteConfirmTask) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
      }

      if (deleteConfirmTask) {
        closeDeleteConfirm();
        return;
      }

      closeCreate();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeDeleteConfirm, closeCreate, deleteConfirmTask, isCreateOpen]);

  const confirmDeleteTask = async () => {
    if (!deleteConfirmTask) return;
    const taskId = deleteConfirmTask.id;
    const deleted = await deleteTask(taskId);
    setDeleteConfirmTask(null);
    if (deleted && editingTaskId === taskId) {
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
      actionLabel: card.status === 'todo' ? undefined : card.actionLabel ?? undefined,
      onAction: null,
      actionDisabled: startPendingTaskId === card.id,
      onEdit: card.status !== 'completed' ? () => openEdit(card) : null,
      editDisabled: createSubmitting || deletePendingTaskId === card.id
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

  useEffect(() => {
    if (taskType === 'theory') {
      setTaskGroup('theory');
      return;
    }

    if (taskGroup === 'theory') {
      setTaskGroup('flashcards');
    }
  }, [taskGroup, taskType]);

  useEffect(() => {
    if (taskType !== 'theory') {
      return;
    }
    if (!tracks.length) return;
    const selectedExists = tracks.some((track) => track.slug === trackSlug);
    if (!selectedExists) {
      setTrackSlug(tracks[0].slug);
    }
  }, [taskType, trackSlug, tracks]);

  useEffect(() => {
    if (taskType !== 'theory') return;
    setShowFinishedTheoryModules(false);
  }, [taskType, trackSlug]);

  useEffect(() => {
    if (taskType !== 'theory') return;
    if (!subjectTracks.length) return;
    const selectedExists = subjectTracks.some((track) => track.slug === subjectTrackSlug);
    if (!selectedExists) {
      setSubjectTrackSlug(subjectTracks[0].slug);
    }
  }, [subjectTrackSlug, subjectTracks, taskType]);

  useEffect(() => {
    if (taskType !== 'task') return;
    if (!activeTaskOptions.length) {
      setSelectedTaskOptionId('');
      return;
    }
    const selectedExists = activeTaskOptions.some((item) => item.id === selectedTaskOptionId);
    if (!selectedExists) {
      setSelectedTaskOptionId(activeTaskOptions[0].id);
    }
  }, [activeTaskOptions, selectedTaskOptionId, taskType]);

  useEffect(() => {
    if (taskType !== 'theory') {
      return;
    }
    if (selectedTheoryModuleIds.length === 0) {
      return;
    }
    const availableIds = new Set(availableTheoryModules.map((module) => module.id));
    setSelectedTheoryModuleIds((current) => current.filter((id) => availableIds.has(id)));
  }, [availableTheoryModules, selectedTheoryModuleIds.length, taskType]);

  return (
    <section
      data-testid="home-activation-table"
      className="mx-auto w-full max-w-[1240px]"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[#2b322f] bg-[linear-gradient(180deg,rgba(5,7,7,0.96),rgba(3,4,4,0.95))] px-5 py-6 shadow-[0_30px_80px_-52px_rgba(0,0,0,0.82)] sm:px-7 sm:py-7 lg:px-9 lg:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(154,167,161,0.36) 1px, transparent 1px), linear-gradient(90deg, rgba(154,167,161,0.36) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/28 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(121,208,171,0.12),transparent_38%)]"
        />
        <div className="pointer-events-none absolute bottom-8 left-6 top-24 hidden sm:block">
          <div className="relative h-full w-px bg-gradient-to-b from-[#45524c] via-[#2b322f] to-transparent">
            <span className="absolute -left-[2px] top-[5%] h-1.5 w-1.5 rounded-full bg-[#9aa7a1] shadow-[0_0_10px_rgba(154,167,161,0.28)]" />
            <span className="absolute -left-[2px] top-[48%] h-1.5 w-1.5 rounded-full bg-[#5d6964]" />
            <span className="absolute -left-[2px] top-[82%] h-1.5 w-1.5 rounded-full bg-[#5d6964]" />
          </div>
        </div>

        <header className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl sm:pl-6">
            <h2 className="text-[clamp(1.125rem,2.2vw,1.9rem)] font-semibold uppercase tracking-[0.18em] text-[#9db2a7]">
              Activation Table
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <div className="rounded-[14px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,27,36,0.62),rgba(10,15,21,0.54))] px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#90a3be]">
                  Time Needed
                </p>
                <p className="mt-1 text-sm font-semibold text-[#edf3fd]">
                  {formatDuration(commitmentEstimates.minutes)}
                </p>
              </div>
              <div className="rounded-[14px] border border-white/12 bg-[linear-gradient(180deg,rgba(19,30,30,0.62),rgba(10,17,17,0.54))] px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8bbbaa]">
                  kWh Gain
                </p>
                <p className="mt-1 text-sm font-semibold text-[#e6f6ef]">
                  +{commitmentEstimates.kwh} kWh
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="w-fit rounded-[11px] border border-[#98a39d] bg-[#a7b0ab] px-4 py-2 text-xs font-semibold text-[#0b0f0e] shadow-[0_12px_28px_-16px_rgba(128,146,136,0.75)] transition-all hover:border-[#b5bfba] hover:bg-[#b7c1bc] hover:shadow-[0_14px_32px_-16px_rgba(157,177,166,0.64)]"
          >
            Create task
          </button>
        </header>
        <div
          aria-hidden
          className="relative mt-4 h-px bg-gradient-to-r from-[#49574f]/55 via-[#2f3733]/48 to-transparent sm:ml-6"
        />

        {loading ? (
          <ActivationBoardLoadingState />
        ) : error ? (
          <p className="relative mt-7 text-sm text-[#d6a0a0] sm:pl-6">{error}</p>
        ) : (
          <LayoutGroup id="activation-task-board">
            <div className="relative mt-7 grid grid-cols-1 gap-4 sm:pl-6 md:grid-flow-col md:auto-cols-[minmax(18.5rem,1fr)] md:overflow-x-auto md:pb-1 md:snap-x md:snap-mandatory lg:grid-cols-3 lg:grid-flow-row lg:auto-cols-auto lg:overflow-visible">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070c]/84 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[42rem] overflow-hidden rounded-[20px] border border-[#2b322f] bg-[linear-gradient(180deg,rgba(5,7,7,0.985),rgba(3,4,4,0.975))] shadow-[0_34px_100px_-42px_rgba(0,0,0,0.9)]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(154,167,161,0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(154,167,161,0.32) 1px, transparent 1px)',
                backgroundSize: '44px 44px'
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/28 to-transparent"
            />
            <div className="relative max-h-[88vh] overflow-y-auto p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9db2a7]">
                    {editingTaskId ? 'Edit task' : 'Create task'}
                  </p>
                  <h3 className="mt-1.5 text-[1.75rem] font-semibold leading-[1.1] text-[#edf3ef]">
                    {editingTaskId ? 'Update activation commitment' : 'New activation commitment'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeCreate}
                  className="rounded-md px-2 py-1 text-xs text-[#9ca7a2] transition-colors hover:text-[#edf3ef]"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className={MODAL_LABEL_CLASS}>What do you want to work on?</span>
                  <select
                    value={taskType}
                    onChange={(event) => setTaskType(event.target.value as ActivationTaskType)}
                    className={MODAL_FIELD_CLASS}
                  >
                    <option value="theory">Theory</option>
                    <option value="task">Task</option>
                  </select>
                </label>

                {taskType === 'task' ? (
                  <label className="block">
                    <span className={MODAL_LABEL_CLASS}>Choose task group</span>
                    <select
                      value={taskGroup}
                      onChange={(event) =>
                        setTaskGroup(event.target.value as Exclude<ActivationTaskGroup, 'theory'>)
                      }
                      className={MODAL_FIELD_CLASS}
                    >
                      <option value="flashcards">Flashcards</option>
                      <option value="notebooks">Notebooks</option>
                      <option value="missions">Missions</option>
                    </select>
                  </label>
                ) : null}

                {taskType === 'theory' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className={MODAL_LABEL_CLASS}>Choose subject</span>
                      <select
                        value={trackSlug}
                        onChange={(event) => setTrackSlug(event.target.value)}
                        className={MODAL_FIELD_CLASS}
                      >
                        {tracks.map((track) => (
                          <option
                            key={track.slug}
                            value={track.slug}
                          >
                            {track.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className={MODAL_LABEL_CLASS}>Choose track</span>
                      <select
                        value={subjectTrackSlug}
                        onChange={(event) => setSubjectTrackSlug(event.target.value)}
                        className={MODAL_FIELD_CLASS}
                      >
                        {subjectTracks.map((subjectTrack) => (
                          <option
                            key={`${trackSlug}-${subjectTrack.slug}`}
                            value={subjectTrack.slug}
                          >
                            {subjectTrack.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}

                {taskType === 'task' ? (
                  <label className="block">
                    <span className={MODAL_LABEL_CLASS}>
                      {taskGroup === 'notebooks'
                        ? 'Choose notebook'
                        : taskGroup === 'flashcards'
                          ? 'Choose flashcard'
                          : 'Choose mission'}
                    </span>
                    <select
                      value={selectedTaskOptionId}
                      onChange={(event) => setSelectedTaskOptionId(event.target.value)}
                      className={MODAL_FIELD_CLASS}
                    >
                      {activeTaskOptions.length === 0 ? (
                        <option value="">No available items</option>
                      ) : (
                        activeTaskOptions.map((option) => (
                          <option
                            key={option.id}
                            value={option.id}
                          >
                            {option.label}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                ) : (
                  <>
                    <label className="block">
                      <span className={MODAL_LABEL_CLASS}>Choose module (optional)</span>
                      <div className="mt-1 rounded-[11px] border border-[#2f3c50] bg-[#1a2436] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-[#9fb0c7]">
                            {selectedTheoryModuleIds.length === 0
                              ? 'Auto-select next modules'
                              : `${selectedTheoryModuleIds.length} module${selectedTheoryModuleIds.length > 1 ? 's' : ''} selected`}
                          </p>
                          {selectedTheoryModuleIds.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setSelectedTheoryModuleIds([])}
                              className="text-[11px] text-[#c3cedd] transition-colors hover:text-[#ecf2fb]"
                            >
                              Clear
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-2 max-h-28 space-y-0.5 overflow-y-auto pr-1">
                          {availableTheoryModules.length > 0 ? (
                            availableTheoryModules.map((option) => {
                              const checked = selectedTheoryModuleIds.includes(option.id);
                              return (
                                <label
                                  key={option.id}
                                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-[#1f2a3e]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) => {
                                      setSelectedTheoryModuleIds((current) => {
                                        if (event.target.checked) {
                                          return [...current, option.id];
                                        }
                                        return current.filter((id) => id !== option.id);
                                      });
                                    }}
                                    className="h-3.5 w-3.5 accent-[#9fb2c9]"
                                  />
                                  <span className="text-xs text-[#d8e2f0]">{option.title}</span>
                                </label>
                              );
                            })
                          ) : (
                            <p className="px-2 py-1 text-xs text-[#8fa0b6]">No available modules</p>
                          )}
                        </div>

                        {completedTheoryModules.length > 0 ? (
                          <div className="mt-2 border-t border-[#2f3c50] pt-2">
                            <button
                              type="button"
                              onClick={() =>
                                setShowFinishedTheoryModules((current) => !current)
                              }
                              className="px-2 text-[11px] text-[#8fa0b6] transition-colors hover:text-[#c4cfde]"
                            >
                              {showFinishedTheoryModules
                                ? `Hide finished modules (${completedTheoryModules.length})`
                                : `Show finished modules (${completedTheoryModules.length})`}
                            </button>
                            {showFinishedTheoryModules ? (
                              <div className="mt-1 max-h-24 space-y-0.5 overflow-y-auto pr-1">
                                {completedTheoryModules.map((option) => (
                                  <div
                                    key={`done-${option.id}`}
                                    className="rounded-md px-2 py-1 text-xs text-[#6f7d92]"
                                  >
                                    {option.title}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </label>
                  </>
                )}

                <div className="rounded-[11px] border border-[#2f3c50] bg-[#1a2436] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#95a6bf]">Preview</p>
                  <p className="mt-1 text-sm font-medium text-[#ecf2fb]">{preview.title}</p>
                  <p className="mt-0.5 text-xs text-[#aab7ca]">{preview.description}</p>
                </div>

                {createError ? <p className="text-xs text-[#e0a9a9]">{createError}</p> : null}

                <div className="flex items-center justify-end gap-2 pt-0.5">
                  {editingCard ? (
                    <button
                      type="button"
                      onClick={() => requestDeleteTask(editingCard)}
                      disabled={createSubmitting || deletePendingTaskId === editingCard.id}
                      className="mr-auto rounded-[11px] border border-[#5a3b3b] bg-[#171011] px-3.5 py-2 text-xs font-medium text-[#d6b2b2] transition-colors hover:border-[#7a5252] hover:bg-[#1d1415] hover:text-[#f0d2d2] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete task
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={closeCreate}
                    className="rounded-[11px] border border-[#2f3633] bg-[#0b0f0f] px-3.5 py-2 text-xs font-medium text-[#a8b6b0] transition-colors hover:border-[#4c655a] hover:bg-[#111615] hover:text-[#e4ece8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitTaskForm()}
                    disabled={
                      createSubmitting ||
                      (taskType === 'task' && !selectedTaskOptionId)
                    }
                    className="inline-flex items-center gap-1.5 rounded-[11px] border border-[#98a39d] bg-[#a7b0ab] px-3.5 py-2 text-xs font-semibold text-[#0b0f0e] shadow-[0_12px_28px_-16px_rgba(128,146,136,0.75)] transition-all hover:border-[#b5bfba] hover:bg-[#b7c1bc] hover:shadow-[0_14px_32px_-16px_rgba(157,177,166,0.64)] disabled:cursor-not-allowed disabled:border-[#2a312e] disabled:bg-[#161b19] disabled:text-[#6c7671] disabled:shadow-none"
                  >
                    {createSubmitting ? (
                      editingTaskId ? 'Saving...' : 'Creating...'
                    ) : (
                      <>
                        {editingTaskId ? 'Save task' : 'Create task'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmTask ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#05070c]/84 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[20px] border border-[#2b322f] bg-[linear-gradient(180deg,rgba(5,7,7,0.98),rgba(3,4,4,0.97))] p-5 shadow-[0_30px_90px_-44px_rgba(0,0,0,0.9)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9db2a7]">
              Delete
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[#edf3ef]">Delete task?</h3>
            <p className="mt-2 text-sm text-[#9ba7a2]">
              This will remove <span className="font-medium text-[#dce8e3]">{deleteConfirmTask.title}</span>{' '}
              from your Activation Table.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deletePendingTaskId === deleteConfirmTask.id}
                className="rounded-[11px] border border-[#2f3633] bg-[#0b0f0f] px-3.5 py-2 text-xs font-medium text-[#a8b6b0] transition-colors hover:border-[#4c655a] hover:bg-[#111615] hover:text-[#e4ece8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteTask()}
                disabled={deletePendingTaskId === deleteConfirmTask.id}
                className="rounded-[11px] border border-[#a98b8b] bg-[#bca3a3] px-3.5 py-2 text-xs font-semibold text-[#1a1111] transition-all hover:border-[#c0a0a0] hover:bg-[#c9afaf] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletePendingTaskId === deleteConfirmTask.id ? 'Deleting...' : 'Confirm delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
