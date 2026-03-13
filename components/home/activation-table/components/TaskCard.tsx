import { motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';

export type TaskCardState = 'todo' | 'in-progress' | 'completed';
export type TaskCardKind = 'theory' | 'task';

export interface TaskCardData {
  id: string;
  title: string;
  subtitle: string;
  kind?: TaskCardKind;
  kindLabel?: string;
  contextLabel?: string;
  statusLabel?: string;
  readyToComplete?: boolean;
  actionLabel?: string;
  onAction?: (() => void) | null;
  actionDisabled?: boolean;
  onEdit?: (() => void) | null;
  editDisabled?: boolean;
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

const kindChipToneByKind: Record<TaskCardKind, string> = {
  theory:
    'border-[#314354] bg-[rgba(17,28,39,0.86)] text-[#cad7eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
  task:
    'border-[#30463d] bg-[rgba(14,27,22,0.88)] text-[#cfe2d8] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
};

const kindDotToneByKind: Record<TaskCardKind, string> = {
  theory: 'bg-[#88a9d8]',
  task: 'bg-[#8cc6a9]'
};

const kindAuraByKind: Record<TaskCardKind, string> = {
  theory:
    'bg-[radial-gradient(circle_at_14%_0%,rgba(97,125,170,0.16),transparent_36%)]',
  task:
    'bg-[radial-gradient(circle_at_14%_0%,rgba(100,151,126,0.14),transparent_36%)]'
};

export const TASK_CARD_BASE_CLASS =
  'group relative overflow-hidden rounded-[14px] border border-[#2d3531] bg-[linear-gradient(180deg,#0a1011_0%,#070a0b_100%)] px-4 py-3.5 transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#43524b] hover:bg-[linear-gradient(180deg,#0c1315_0%,#090d0f_100%)] hover:shadow-[0_18px_30px_-22px_rgba(0,0,0,0.8)]';

export function TaskCard({ task, state }: TaskCardProps) {
  const isDraggable = Boolean(task.draggable);
  const [isDragging, setIsDragging] = useState(false);
  const cardKind = task.kind ?? 'theory';

  return (
    <article
      aria-grabbed={isDraggable ? isDragging : undefined}
      draggable={isDraggable}
      onDragStart={(event) => {
        if (!isDraggable) return;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', task.id);
        setIsDragging(true);
        task.onDragStart?.();
      }}
      onDragEnd={() => {
        if (!isDraggable) return;
        setIsDragging(false);
        task.onDragEnd?.();
      }}
      className={`${TASK_CARD_BASE_CLASS} ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        task.readyToComplete
          ? 'border-[#4e6d61] bg-[linear-gradient(180deg,#0a1212_0%,#07100d_100%)] shadow-[0_22px_44px_-34px_rgba(67,119,100,0.62)]'
          : ''
      } ${
        isDragging
          ? 'scale-[0.988] border-[#5a6f63] bg-[linear-gradient(180deg,#0c1415_0%,#090d0e_100%)] shadow-[0_30px_52px_-36px_rgba(0,0,0,0.95)]'
          : ''
      }`}
    >
      {edgeToneByState[state]}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 opacity-90 ${kindAuraByKind[cardKind]}`}
      />
      {task.readyToComplete ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(112deg,transparent_0%,rgba(146,232,196,0.14)_45%,transparent_72%)]"
          initial={{ x: '-140%', opacity: 0 }}
          animate={{ x: ['-140%', '185%'], opacity: [0.08, 0.42, 0.08] }}
          transition={{ duration: 2.4, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY, repeatDelay: 1.1 }}
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {task.kindLabel || task.contextLabel ? (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {task.kindLabel ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[0.08em] ${kindChipToneByKind[cardKind]}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${kindDotToneByKind[cardKind]}`} />
                  <span>{task.kindLabel}</span>
                </span>
              ) : null}
              {task.contextLabel ? (
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#7b8984]">
                  {task.contextLabel}
                </span>
              ) : null}
            </div>
          ) : null}
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

          {task.readyToComplete || task.onEdit ? (
            <div className="inline-flex flex-wrap items-center justify-end gap-2">
              {task.readyToComplete ? (
                <motion.span
                  className="relative overflow-hidden rounded-full border border-[#47685b] bg-[#0b1612] px-2 py-1 text-[10px] font-medium text-[#c0ebd8]"
                  animate={{
                    borderColor: ['rgba(71,104,91,0.9)', 'rgba(123,193,163,0.95)', 'rgba(71,104,91,0.9)'],
                    boxShadow: [
                      '0 0 0 rgba(121,208,171,0)',
                      '0 0 0.8rem rgba(121,208,171,0.18)',
                      '0 0 0 rgba(121,208,171,0)'
                    ]
                  }}
                  transition={{ duration: 1.8, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
                >
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(108deg,transparent_0%,rgba(219,255,238,0.22)_48%,transparent_76%)]"
                    initial={{ x: '-120%', opacity: 0 }}
                    animate={{ x: ['-120%', '160%'], opacity: [0.1, 0.55, 0.1] }}
                    transition={{ duration: 1.9, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
                  />
                  <span className="relative">Ready to complete</span>
                </motion.span>
              ) : null}
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
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
