import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
  href?: string | null;
  draggable?: boolean;
  onDragStart?: (() => void) | null;
  onDragEnd?: (() => void) | null;
}

interface TaskCardProps {
  task: TaskCardData;
  state: TaskCardState;
}

const titleToneByState: Record<TaskCardState, string> = {
  todo: 'text-[#e8e0d0]',
  'in-progress': 'text-[#f5f0e8]',
  completed: 'text-[#8a9a8a]'
};

const subtitleToneByState: Record<TaskCardState, string> = {
  todo: 'text-[#6a6050]',
  'in-progress': 'text-[#8a7a5a]',
  completed: 'text-[#4a5a4a]'
};

const statusToneByState: Record<TaskCardState, string> = {
  todo: 'text-[#6a5a3a]',
  'in-progress': 'text-[#f0a030]/80',
  completed: 'text-[#4a9a6a]'
};

const statusMarkerByState: Record<TaskCardState, string> = {
  todo: '▶',
  'in-progress': '●',
  completed: '✓'
};

const edgeToneByState: Record<TaskCardState, ReactNode> = {
  todo: <div aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-[#3a2a10]/70" />,
  'in-progress': <div aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-[#f0a030]/70" style={{ boxShadow: '0 0 6px rgba(240,160,48,0.4)' }} />,
  completed: <div aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-[#4a9a6a]/60" />
};

const kindChipToneByKind: Record<TaskCardKind, string> = {
  theory:
    'border-[#f0a030]/25 bg-[rgba(20,15,5,0.9)] text-[#f0a030]/80',
  task:
    'border-[#4a9a6a]/25 bg-[rgba(5,15,10,0.9)] text-[#4a9a6a]/80'
};

const kindDotToneByKind: Record<TaskCardKind, string> = {
  theory: 'bg-[#f0a030]',
  task: 'bg-[#4a9a6a]'
};

const kindAuraByKind: Record<TaskCardKind, string> = {
  theory:
    'bg-[radial-gradient(circle_at_0%_0%,rgba(240,160,48,0.06),transparent_40%)]',
  task:
    'bg-[radial-gradient(circle_at_0%_0%,rgba(74,154,106,0.05),transparent_40%)]'
};

export const TASK_CARD_BASE_CLASS =
  'group relative overflow-hidden border border-[#1e1a12] bg-[#0a0b08] px-4 py-4 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-px hover:border-[#f0a030]/20 hover:shadow-[0_0_16px_-4px_rgba(240,160,48,0.12)]';

export function TaskCard({ task, state }: TaskCardProps) {
  const isDraggable = Boolean(task.draggable);
  const [isDragging, setIsDragging] = useState(false);
  const cardKind = task.kind ?? 'theory';
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    if (!task.href) return;
    if ((e.target as HTMLElement).closest('button, a')) return;
    router.push(task.href);
  };

  const article = (
    <article
      onClick={handleCardClick}
      draggable={isDraggable}
      aria-description={isDraggable && isDragging ? 'Being dragged' : undefined}
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
        isDraggable ? 'cursor-grab active:cursor-grabbing' : task.href ? 'cursor-pointer' : ''
      } ${
        task.readyToComplete
          ? 'border-[#f0a030]/35 bg-[#0c0d08] shadow-[0_0_20px_-6px_rgba(240,160,48,0.2)]'
          : ''
      } ${
        isDragging
          ? 'scale-[0.988] border-[#f0a030]/50 shadow-[0_0_24px_-8px_rgba(240,160,48,0.3)]'
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
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(112deg,transparent_0%,rgba(240,160,48,0.1)_45%,transparent_72%)]"
          initial={{ x: '-140%', opacity: 0 }}
          animate={{ x: ['-140%', '185%'], opacity: [0.08, 0.5, 0.08] }}
          transition={{ duration: 2.4, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY, repeatDelay: 1.1 }}
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {task.kindLabel || task.contextLabel ? (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {task.kindLabel ? (
                <span
                  className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] ${kindChipToneByKind[cardKind]}`}
                >
                  <span className={`h-1.5 w-1.5 ${kindDotToneByKind[cardKind]}`} />
                  <span>{task.kindLabel}</span>
                </span>
              ) : null}
              {task.contextLabel ? (
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#5a5040]">
                  {task.contextLabel}
                </span>
              ) : null}
            </div>
          ) : null}
          <h4 className={`font-mono text-[12px] font-bold leading-snug tracking-[0.04em] ${titleToneByState[state]}`}>{task.title}</h4>
          <p className={`mt-1.5 text-[11px] leading-relaxed tracking-[0.02em] ${subtitleToneByState[state]}`}>{task.subtitle}</p>
        </div>

        {task.actionLabel ? (
          task.onAction ? (
            <button
              type="button"
              onClick={task.onAction}
              disabled={task.actionDisabled}
              className="mt-0.5 shrink-0 border border-[#f0a030]/30 bg-[#0d0e0a] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#f0a030]/70 transition-colors duration-200 hover:border-[#f0a030]/60 hover:text-[#f0a030] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {task.actionLabel}
            </button>
          ) : (
            <span className="mt-0.5 shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#5a5040] transition-colors duration-200 group-hover:text-[#8a7a5a]">
              {task.actionLabel}
            </span>
          )
        ) : null}
      </div>

      {task.statusLabel ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className={`inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] ${statusToneByState[state]}`}>
            <span className="text-[8px]">{statusMarkerByState[state]}</span>
            <span>{task.statusLabel}</span>
          </p>

          {task.readyToComplete || task.onEdit ? (
            <div className="inline-flex flex-wrap items-center justify-end gap-2">
              {task.readyToComplete ? (
                <motion.span
                  className="relative overflow-hidden border border-[#f0a030]/40 bg-[#0d0e08] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#f0a030]"
                  animate={{
                    borderColor: ['rgba(240,160,48,0.4)', 'rgba(240,160,48,0.8)', 'rgba(240,160,48,0.4)'],
                    boxShadow: [
                      '0 0 0 rgba(240,160,48,0)',
                      '0 0 0.8rem rgba(240,160,48,0.25)',
                      '0 0 0 rgba(240,160,48,0)'
                    ]
                  }}
                  transition={{ duration: 1.8, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
                >
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(108deg,transparent_0%,rgba(240,160,48,0.12)_48%,transparent_76%)]"
                    initial={{ x: '-120%', opacity: 0 }}
                    animate={{ x: ['-120%', '160%'], opacity: [0.1, 0.6, 0.1] }}
                    transition={{ duration: 1.9, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
                  />
                  <span className="relative">✓ Ready</span>
                </motion.span>
              ) : null}
              {task.onEdit ? (
                <button
                  type="button"
                  onClick={task.onEdit}
                  disabled={task.editDisabled}
                  className="px-1 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#f0a030]/50 transition-colors hover:text-[#f0a030] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  [ Edit ]
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );

  return article;
}
