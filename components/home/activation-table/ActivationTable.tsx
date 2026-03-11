'use client';

import { useEffect, useMemo, useState } from 'react';
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
      flashcards: ActivationCatalogTaskOption[];
      notebooks: ActivationCatalogTaskOption[];
      missions: ActivationCatalogTaskOption[];
    };
  };
}

const FALLBACK_TRACKS = [
  { slug: 'pyspark', title: 'PySpark' },
  { slug: 'fabric', title: 'Microsoft Fabric' }
] as const;

const SUBJECT_TRACK_OPTIONS_BY_SLUG: Record<string, Array<{ slug: string; label: string }>> = {
  pyspark: [{ slug: 'full-stack', label: 'PySpark: The Full Stack' }],
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
  'mt-1.5 h-12 w-full rounded-[12px] border border-[#2f3c50] bg-[#1a2436] px-3.5 text-sm text-[#e9eff8] outline-none transition-all focus:border-[#7f8fa8] focus:ring-2 focus:ring-[#8f99a3]/20';

const MODAL_LABEL_CLASS = 'text-xs font-medium text-[#a9b6c8]';

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
  } | null>(null);
  const [dropColumn, setDropColumn] = useState<TaskCardState | null>(null);

  const [taskType, setTaskType] = useState<ActivationTaskType>('theory');
  const [taskGroup, setTaskGroup] = useState<ActivationTaskGroup>('theory');
  const [trackSlug, setTrackSlug] = useState<string>('pyspark');
  const [subjectTrackSlug, setSubjectTrackSlug] = useState<string>('full-stack');
  const [selectedTaskOptionId, setSelectedTaskOptionId] = useState<string>('');
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
    flashcards: [],
    notebooks: [],
    missions: []
  };
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
      requestedCount,
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
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Failed to start task.');
    } finally {
      setStartPendingTaskId(null);
    }
  };

  const clearDragState = () => {
    setDraggedTask(null);
    setDropColumn(null);
  };

  const handleTaskDrop = async (targetState: TaskCardState) => {
    if (!draggedTask) return;
    const sourceTask = draggedTask;
    clearDragState();

    if (sourceTask.state === targetState) return;

    if (sourceTask.state === 'todo' && targetState === 'in-progress') {
      await startTask(sourceTask.id);
      return;
    }

    setError('Only To Do tasks can be dragged into In Progress.');
  };

  const resetTaskForm = () => {
    setTaskType('theory');
    setTaskGroup('theory');
    setTrackSlug('pyspark');
    setSubjectTrackSlug('full-stack');
    setSelectedTaskOptionId('');
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
    if (card.status !== 'todo') {
      setError('Only To Do tasks can be edited.');
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
        payload.scopeType = scopeType;
        payload.trackSlug = trackSlug;
        if (scopeType === 'count') {
          payload.requestedCount = requestedCount;
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
    setDeletePendingTaskId(taskId);
    setError(null);
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
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete task.');
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

  const confirmDeleteTask = async () => {
    if (!deleteConfirmTask) return;
    const taskId = deleteConfirmTask.id;
    await deleteTask(taskId);
    setDeleteConfirmTask(null);
  };

  const toCardData = (cards: ActivationBoardCard[]): TaskCardData[] =>
    cards.map((card) => ({
      id: card.id,
      title: card.title,
      subtitle: card.description,
      statusLabel: card.statusLabel ?? undefined,
      actionLabel: card.actionLabel ?? undefined,
      onAction: card.status === 'todo' ? () => void startTask(card.id) : null,
      actionDisabled: startPendingTaskId === card.id,
      onEdit: card.status === 'todo' ? () => openEdit(card) : null,
      onDelete: () => requestDeleteTask(card),
      editDisabled: createSubmitting || deletePendingTaskId === card.id,
      deleteDisabled: createSubmitting || deletePendingTaskId === card.id
    }));

  const todoCards = toCardData(board?.todo ?? []);
  const inProgressCards = toCardData(board?.inProgress ?? []);
  const completedCards = toCardData(board?.completed ?? []);

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
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="w-fit rounded-[11px] border border-[#98a39d] bg-[#a7b0ab] px-4 py-2 text-xs font-semibold text-[#0b0f0e] shadow-[0_12px_28px_-16px_rgba(128,146,136,0.75)] transition-all hover:border-[#b5bfba] hover:bg-[#b7c1bc] hover:shadow-[0_14px_32px_-16px_rgba(157,177,166,0.64)]"
          >
            Create task
          </button>
        </header>

        {loading ? (
          <p className="relative mt-7 text-sm text-[#8f9a95] sm:pl-6">Loading activation board...</p>
        ) : error ? (
          <p className="relative mt-7 text-sm text-[#d6a0a0] sm:pl-6">{error}</p>
        ) : (
          <div className="relative mt-7 grid grid-cols-1 gap-4 sm:pl-6 md:grid-flow-col md:auto-cols-[minmax(18.5rem,1fr)] md:overflow-x-auto md:pb-1 md:snap-x md:snap-mandatory lg:grid-cols-3 lg:grid-flow-row lg:auto-cols-auto lg:overflow-visible">
            <BoardColumn
              title="To Do"
              state="todo"
              tasks={todoCards}
              dropEnabled={false}
              dropActive={dropColumn === 'todo' && draggedTask !== null}
              onDropTask={(state) => {
                void handleTaskDrop(state);
              }}
              onColumnDragOver={(state) => setDropColumn(state)}
              onTaskDragStart={(taskId, state) => {
                setDraggedTask({ id: taskId, state });
                setDropColumn(null);
              }}
              onTaskDragEnd={clearDragState}
            />
            <BoardColumn
              title="In Progress"
              state="in-progress"
              tasks={inProgressCards}
              dropEnabled={draggedTask?.state === 'todo'}
              dropActive={dropColumn === 'in-progress' && draggedTask?.state === 'todo'}
              onDropTask={(state) => {
                void handleTaskDrop(state);
              }}
              onColumnDragOver={(state) => setDropColumn(state)}
              onTaskDragStart={(taskId, state) => {
                setDraggedTask({ id: taskId, state });
                setDropColumn(null);
              }}
              onTaskDragEnd={clearDragState}
            />
            <BoardColumn
              title="Completed"
              state="completed"
              tasks={completedCards}
              dropEnabled={false}
              dropActive={dropColumn === 'completed' && draggedTask !== null}
              onDropTask={(state) => {
                void handleTaskDrop(state);
              }}
              onColumnDragOver={(state) => setDropColumn(state)}
              onTaskDragStart={(taskId, state) => {
                setDraggedTask({ id: taskId, state });
                setDropColumn(null);
              }}
              onTaskDragEnd={clearDragState}
            />
          </div>
        )}
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070c]/84 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl overflow-hidden rounded-[22px] border border-[#2b322f] bg-[linear-gradient(180deg,rgba(5,7,7,0.98),rgba(3,4,4,0.97))] shadow-[0_34px_100px_-42px_rgba(0,0,0,0.9)]">
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
            <div className="pointer-events-none absolute bottom-5 left-5 top-24 hidden sm:block">
              <div className="relative h-full w-px bg-gradient-to-b from-[#45524c] via-[#2b322f] to-transparent">
                <span className="absolute -left-[2px] top-[6%] h-1.5 w-1.5 rounded-full bg-[#9aa7a1]" />
                <span className="absolute -left-[2px] top-[50%] h-1.5 w-1.5 rounded-full bg-[#5d6964]" />
                <span className="absolute -left-[2px] top-[84%] h-1.5 w-1.5 rounded-full bg-[#5d6964]" />
              </div>
            </div>

            <div className="relative p-5 sm:p-6 sm:pl-12">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9db2a7]">
                    {editingTaskId ? 'Edit task' : 'Create task'}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-[#edf3ef]">
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

              <div className="mt-5 space-y-4">
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
                ) : null}

                {taskType === 'theory' ? (
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
                  <label className="block">
                    <span className={MODAL_LABEL_CLASS}>How much do you want to complete?</span>
                    <select
                      value={scopeValue}
                      onChange={(event) =>
                        setScopeValue(event.target.value as '1' | '2' | '3' | 'all')
                      }
                      className={MODAL_FIELD_CLASS}
                    >
                      <option value="1">1 module</option>
                      <option value="2">2 modules</option>
                      <option value="3">3 modules</option>
                      <option value="all">All remaining modules</option>
                    </select>
                  </label>
                )}

                <div className="rounded-[12px] border border-[#2f3c50] bg-[#1a2436] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#95a6bf]">Preview</p>
                  <p className="mt-1.5 text-sm font-medium text-[#ecf2fb]">{preview.title}</p>
                  <p className="mt-1 text-xs text-[#aab7ca]">{preview.description}</p>
                </div>

                {createError ? <p className="text-xs text-[#e0a9a9]">{createError}</p> : null}

                <div className="flex items-center justify-end gap-2 pt-1">
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
                    disabled={createSubmitting || (taskType === 'task' && !selectedTaskOptionId)}
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
                {deletePendingTaskId === deleteConfirmTask.id ? 'Deleting...' : 'Delete task'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
