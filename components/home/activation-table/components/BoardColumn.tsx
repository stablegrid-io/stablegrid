import { TaskCard, type TaskCardData, type TaskCardState } from '@/components/home/activation-table/components/TaskCard';
import { AnimatePresence, motion } from 'framer-motion';

type TaskReorderPlacement = 'before' | 'after';

interface BoardColumnProps {
  title: 'To Do' | 'In Progress' | 'Completed';
  state: TaskCardState;
  tasks: TaskCardData[];
  ambientHighlight?: boolean;
  ambientHint?: string;
  dropEnabled?: boolean;
  dropBlocked?: boolean;
  dropActive?: boolean;
  showDropSlot?: boolean;
  dropSlotLabel?: string;
  blockedHint?: string;
  onDropTask?: ((state: TaskCardState) => void) | null;
  onBlockedDrop?: ((state: TaskCardState) => void) | null;
  onColumnDragOver?: ((state: TaskCardState) => void) | null;
  onColumnDragLeave?: ((state: TaskCardState) => void) | null;
  onTaskDragStart?: ((taskId: string, state: TaskCardState) => void) | null;
  onTaskDragEnd?: (() => void) | null;
  draggedTaskId?: string | null;
  reorderTarget?: { taskId: string; placement: TaskReorderPlacement } | null;
  onTaskReorderPreview?: ((
    state: TaskCardState,
    targetTaskId: string,
    placement: TaskReorderPlacement
  ) => void) | null;
  onTaskReorderDrop?: ((
    state: TaskCardState,
    targetTaskId: string,
    placement: TaskReorderPlacement
  ) => void) | null;
}

const countToneByState: Record<TaskCardState, string> = {
  todo: 'text-[#8a7a5a]',
  'in-progress': 'text-[#f0a030]',
  completed: 'text-[#5aaa7a]'
};

const sectionDotByState: Record<TaskCardState, string> = {
  todo: 'bg-[#6a5a3a]',
  'in-progress': 'bg-[#f0a030]',
  completed: 'bg-[#4a9a6a]'
};

const columnTitleByState: Record<TaskCardState, string> = {
  todo: 'TO DO',
  'in-progress': 'IN PROGRESS',
  completed: 'COMPLETED'
};

const columnBorderByState: Record<TaskCardState, string> = {
  todo: 'border-[#2a2010]',
  'in-progress': 'border-[#f0a030]/35',
  completed: 'border-[#1a3020]'
};

const columnGlowByState: Record<TaskCardState, string> = {
  todo: '',
  'in-progress': 'shadow-[inset_0_1px_0_rgba(240,160,48,0.08),0_0_30px_-10px_rgba(240,160,48,0.12)]',
  completed: 'shadow-[inset_0_1px_0_rgba(74,154,106,0.06)]'
};

export const BOARD_COLUMN_SURFACE_CLASS =
  'relative overflow-hidden border bg-[#0a0b0d] p-5 sm:p-7';

export const BOARD_COLUMN_TITLE_CLASS =
  'font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#c8bfa8]';

export function BoardColumn({
  title,
  state,
  tasks,
  ambientHighlight = false,
  ambientHint = '',
  dropEnabled = false,
  dropBlocked = false,
  dropActive = false,
  showDropSlot = false,
  dropSlotLabel = '',
  blockedHint = '',
  onDropTask = null,
  onBlockedDrop = null,
  onColumnDragOver = null,
  onColumnDragLeave = null,
  onTaskDragStart = null,
  onTaskDragEnd = null,
  draggedTaskId = null,
  reorderTarget = null,
  onTaskReorderPreview = null,
  onTaskReorderDrop = null
}: BoardColumnProps) {
  const canReceiveDrag = dropEnabled || dropBlocked;

  return (
    <motion.section
      layout
      transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.68 }}
      data-testid={`activation-column-${state}`}
      onDragOver={(event) => {
        if (!canReceiveDrag) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = dropEnabled ? 'move' : 'none';
        if (!dropActive) {
          onColumnDragOver?.(state);
        }
      }}
      onDragLeave={(event) => {
        if (!canReceiveDrag) return;
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
          return;
        }
        onColumnDragLeave?.(state);
      }}
      onDrop={(event) => {
        if (!canReceiveDrag) return;
        event.preventDefault();
        if (dropEnabled) {
          onDropTask?.(state);
          return;
        }
        onBlockedDrop?.(state);
      }}
      className={`${BOARD_COLUMN_SURFACE_CLASS} ${columnBorderByState[state]} ${columnGlowByState[state]} transition-[border-color,box-shadow,background-color] duration-220 ease-out md:snap-start ${
        dropActive
          ? dropEnabled
            ? 'border-[#f0a030]/60 shadow-[0_0_24px_-8px_rgba(240,160,48,0.2)]'
            : 'border-[#5f6764]'
          : ambientHighlight
            ? 'border-[#f0a030]/25 shadow-[0_0_20px_-10px_rgba(240,160,48,0.15)]'
          : ''
      }`}
    >
      {/* Top accent stripe per column state */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] ${
          state === 'in-progress'
            ? 'bg-gradient-to-r from-transparent via-[#f0a030]/70 to-transparent'
            : state === 'completed'
              ? 'bg-gradient-to-r from-transparent via-[#4a9a6a]/50 to-transparent'
              : 'bg-gradient-to-r from-transparent via-[#6a5a3a]/40 to-transparent'
        }`}
      />
      <header className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <span className={`h-1.5 w-1.5 ${sectionDotByState[state]}`} />
          <h3 className={BOARD_COLUMN_TITLE_CLASS}>{columnTitleByState[state]}</h3>
        </div>
        <motion.span
          className={`border bg-[#0a0b0d] px-2 py-0.5 font-mono text-[10px] font-bold ${countToneByState[state]}`}
          style={{ borderColor: state === 'in-progress' ? 'rgba(240,160,48,0.25)' : state === 'completed' ? 'rgba(74,154,106,0.2)' : 'rgba(60,50,30,0.6)' }}
          animate={
            ambientHighlight
              ? {
                  borderColor: ['rgba(240,160,48,0.25)', 'rgba(240,160,48,0.6)', 'rgba(240,160,48,0.25)'],
                  boxShadow: [
                    '0 0 0 rgba(240,160,48,0)',
                    '0 0 0.6rem rgba(240,160,48,0.2)',
                    '0 0 0 rgba(240,160,48,0)'
                  ]
                }
              : undefined
          }
          transition={
            ambientHighlight
              ? { duration: 2.1, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }
              : undefined
          }
        >
          [{tasks.length}]
        </motion.span>
      </header>
      {dropBlocked && dropActive && blockedHint ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#6a5a3a]">{blockedHint}</p>
      ) : ambientHint ? (
        <motion.div
          className="relative mt-2 overflow-hidden border border-[#f0a030]/25 bg-[#0c0d09] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#f0a030]/70"
          animate={{
            borderColor: ['rgba(240,160,48,0.25)', 'rgba(240,160,48,0.55)', 'rgba(240,160,48,0.25)']
          }}
          transition={{ duration: 2.2, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(108deg,transparent_0%,rgba(221,255,241,0.2)_48%,transparent_76%)]"
            initial={{ x: '-120%', opacity: 0 }}
            animate={{ x: ['-120%', '155%'], opacity: [0.08, 0.45, 0.08] }}
            transition={{ duration: 2.1, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
          />
          <p className="relative">{ambientHint}</p>
        </motion.div>
      ) : null}

      <div className="mt-5 space-y-4">
        <AnimatePresence initial={false}>
          {showDropSlot ? (
            <motion.div
              key="drop-slot"
              aria-hidden
              initial={{ height: 0, opacity: 0, marginBottom: 0, y: -4 }}
              animate={{ height: 68, opacity: 1, marginBottom: 12, y: 0 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0, y: -4 }}
              transition={{ type: 'spring', stiffness: 290, damping: 32, mass: 0.55 }}
              className="overflow-hidden"
            >
              <motion.div
                className={`relative h-full border bg-[#0c0d09] transition-colors duration-150 ${
                  dropActive
                    ? dropEnabled
                      ? 'border-[#f0a030]/50'
                      : 'border-[#5b6661]/78'
                    : 'border-[#f0a030]/20'
                }`}
              >
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(223,236,230,0.14)_48%,transparent_75%)]"
                  initial={{ x: '-120%', opacity: 0 }}
                  animate={{
                    x: ['-120%', '155%'],
                    opacity: dropActive ? (dropEnabled ? 1 : 0.5) : 0.6
                  }}
                  transition={{
                    duration: 1.45,
                    ease: 'easeInOut',
                    repeat: Number.POSITIVE_INFINITY
                  }}
                />
                {dropSlotLabel ? (
                  <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                    <p
                      className={`font-mono text-[10px] font-bold uppercase tracking-[0.15em] ${
                        dropEnabled ? 'text-[#f0a030]/80' : 'text-[#6a5a3a]'
                      }`}
                    >
                      {dropSlotLabel}
                    </p>
                  </div>
                ) : null}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout="position"
            layoutId={`activation-task-${task.id}`}
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.75 }}
            onDragOver={(event) => {
              if (!draggedTaskId || draggedTaskId === task.id) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();

              const bounds = event.currentTarget.getBoundingClientRect();
              const placement: TaskReorderPlacement =
                event.clientY <= bounds.top + bounds.height / 2 ? 'before' : 'after';

              onTaskReorderPreview?.(state, task.id, placement);
            }}
            onDrop={(event) => {
              if (!draggedTaskId || draggedTaskId === task.id) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();

              const bounds = event.currentTarget.getBoundingClientRect();
              const placement: TaskReorderPlacement =
                event.clientY <= bounds.top + bounds.height / 2 ? 'before' : 'after';

              onTaskReorderDrop?.(state, task.id, placement);
            }}
          >
            <AnimatePresence initial={false}>
              {reorderTarget?.taskId === task.id && reorderTarget.placement === 'before' ? (
                <motion.div
                  key={`${task.id}-before`}
                  aria-hidden
                  initial={{ opacity: 0, scaleX: 0.92, y: 4 }}
                  animate={{ opacity: 1, scaleX: 1, y: 0 }}
                  exit={{ opacity: 0, scaleX: 0.92, y: 4 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="mb-2 overflow-hidden rounded-full"
                >
                  <div className="h-[2px] bg-[linear-gradient(90deg,rgba(240,160,48,0.08),rgba(240,160,48,0.9),rgba(240,160,48,0.08))] shadow-[0_0_12px_rgba(240,160,48,0.35)]" />
                </motion.div>
              ) : null}
            </AnimatePresence>
            <TaskCard
              task={{
                ...task,
                draggable: true,
                onDragStart: () => onTaskDragStart?.(task.id, state),
                onDragEnd: () => onTaskDragEnd?.()
              }}
              state={state}
            />
            <AnimatePresence initial={false}>
              {reorderTarget?.taskId === task.id && reorderTarget.placement === 'after' ? (
                <motion.div
                  key={`${task.id}-after`}
                  aria-hidden
                  initial={{ opacity: 0, scaleX: 0.92, y: -4 }}
                  animate={{ opacity: 1, scaleX: 1, y: 0 }}
                  exit={{ opacity: 0, scaleX: 0.92, y: -4 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="mt-2 overflow-hidden rounded-full"
                >
                  <div className="h-[2px] bg-[linear-gradient(90deg,rgba(240,160,48,0.08),rgba(240,160,48,0.9),rgba(240,160,48,0.08))] shadow-[0_0_12px_rgba(240,160,48,0.35)]" />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
