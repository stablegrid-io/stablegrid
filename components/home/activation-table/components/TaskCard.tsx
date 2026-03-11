import type { ReactNode } from 'react';

export type TaskCardState = 'todo' | 'in-progress' | 'completed';

export interface TaskCardData {
  id: string;
  title: string;
  subtitle: string;
  statusLabel?: string;
  actionLabel?: string;
  onAction?: (() => void) | null;
  actionDisabled?: boolean;
  onEdit?: (() => void) | null;
  onDelete?: (() => void) | null;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  draggable?: boolean;
  onDragStart?: (() => void) | null;
  onDragEnd?: (() => void) | null;
}

interface TaskCardProps {
  task: TaskCardData;
  state: TaskCardState;
}

const titleToneByState: Record<TaskCardState, string> = {
  todo: 'text-[#e7eeeb]',
  'in-progress': 'text-[#edf3fb]',
  completed: 'text-[#c8d7cf]'
};

const subtitleToneByState: Record<TaskCardState, string> = {
  todo: 'text-[#8d9892]',
  'in-progress': 'text-[#97a8c1]',
  completed: 'text-[#7b8f84]'
};

const statusToneByState: Record<TaskCardState, string> = {
  todo: 'text-[#73807a]',
  'in-progress': 'text-[#95afd6]',
  completed: 'text-[#81ba9d]'
};

const statusDotByState: Record<TaskCardState, string> = {
  todo: 'bg-[#7b8680]',
  'in-progress': 'bg-[#7a96c0]',
  completed: 'bg-[#79d0ab]'
};

const edgeToneByState: Record<TaskCardState, ReactNode> = {
  todo: null,
  'in-progress': <div aria-hidden className="absolute inset-y-3 left-0 w-px bg-[#7a96c0]/85" />,
  completed: <div aria-hidden className="absolute inset-y-3 left-0 w-px bg-[#79d0ab]/75" />
};

export const TASK_CARD_BASE_CLASS =
  'group relative overflow-hidden rounded-[14px] border border-[#2d3531] bg-[linear-gradient(180deg,#0a1011_0%,#070a0b_100%)] px-4 py-3.5 transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#43524b] hover:bg-[linear-gradient(180deg,#0c1315_0%,#090d0f_100%)] hover:shadow-[0_18px_30px_-22px_rgba(0,0,0,0.8)]';

export function TaskCard({ task, state }: TaskCardProps) {
  const isDraggable = Boolean(task.draggable);

  return (
    <article
      draggable={isDraggable}
      onDragStart={(event) => {
        if (!isDraggable) return;
        event.dataTransfer.effectAllowed = 'move';
        task.onDragStart?.();
      }}
      onDragEnd={() => {
        if (!isDraggable) return;
        task.onDragEnd?.();
      }}
      className={`${TASK_CARD_BASE_CLASS} ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {edgeToneByState[state]}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className={`text-sm font-medium leading-snug ${titleToneByState[state]}`}>{task.title}</h4>
          <p className={`mt-1.5 text-xs leading-relaxed ${subtitleToneByState[state]}`}>{task.subtitle}</p>
        </div>

        {task.actionLabel ? (
          task.onAction ? (
            <button
              type="button"
              onClick={task.onAction}
              disabled={task.actionDisabled}
              className="mt-0.5 shrink-0 rounded-md border border-[#2d3531] bg-[#0c1012] px-2 py-1 text-[11px] font-medium text-[#a6b4ad] transition-colors duration-200 hover:border-[#495a52] hover:text-[#d0dbd5] focus-visible:ring-1 focus-visible:ring-[#7a96c0]/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {task.actionLabel}
            </button>
          ) : (
            <span className="mt-0.5 shrink-0 text-[11px] font-medium text-[#8e9b95] transition-colors duration-200 group-hover:text-[#c7d3cd]">
              {task.actionLabel}
            </span>
          )
        ) : null}
      </div>

      {task.statusLabel ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className={`inline-flex items-center gap-2 text-[11px] ${statusToneByState[state]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusDotByState[state]}`} />
            <span>{task.statusLabel}</span>
          </p>

          {task.onEdit || task.onDelete ? (
            <div className="inline-flex items-center gap-2">
              {task.onEdit ? (
                <button
                  type="button"
                  onClick={task.onEdit}
                  disabled={task.editDisabled}
                  className="rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#8da1bf] transition-colors hover:text-[#c4d4ec] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Edit
                </button>
              ) : null}
              {task.onDelete ? (
                <button
                  type="button"
                  onClick={task.onDelete}
                  disabled={task.deleteDisabled}
                  className="rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca7a2] transition-colors hover:text-[#dde5e1] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
