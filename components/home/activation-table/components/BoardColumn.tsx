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
  todo: 'text-[#a1aea8]',
  'in-progress': 'text-[#aec2df]',
  completed: 'text-[#8ec7ab]'
};

const sectionDotByState: Record<TaskCardState, string> = {
  todo: 'bg-[#77827d]',
  'in-progress': 'bg-[#7a96c0]',
  completed: 'bg-[#79d0ab]'
};

export const BOARD_COLUMN_SURFACE_CLASS =
  'relative overflow-hidden rounded-[18px] border border-[#2a312e] bg-[linear-gradient(180deg,#070a0b_0%,#050607_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-5';

export const BOARD_COLUMN_TITLE_CLASS =
  'text-sm font-medium tracking-[0.01em] text-[#deebe5]';

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
      className={`${BOARD_COLUMN_SURFACE_CLASS} transition-[border-color,box-shadow,background-color] duration-220 ease-out md:snap-start ${
        dropActive
          ? dropEnabled
            ? 'border-[#5c7267] bg-[linear-gradient(180deg,#081011_0%,#050809_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_26px_46px_-38px_rgba(78,103,92,0.62)]'
            : 'border-[#5f6764] bg-[linear-gradient(180deg,#080d0d_0%,#060909_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_24px_44px_-36px_rgba(57,66,63,0.54)]'
          : ambientHighlight
            ? 'border-[#3d564c] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_44px_-40px_rgba(76,125,107,0.42)]'
          : ''
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      <header className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${sectionDotByState[state]}`} />
          <h3 className={BOARD_COLUMN_TITLE_CLASS}>{title}</h3>
        </div>
        <motion.span
          className={`rounded-full border border-[#2d3531] bg-[#0c1110] px-2.5 py-0.5 text-[11px] font-medium ${countToneByState[state]}`}
          animate={
            ambientHighlight
              ? {
                  borderColor: ['rgba(45,53,49,1)', 'rgba(121,208,171,0.5)', 'rgba(45,53,49,1)'],
                  boxShadow: [
                    '0 0 0 rgba(121,208,171,0)',
                    '0 0 0.75rem rgba(121,208,171,0.18)',
                    '0 0 0 rgba(121,208,171,0)'
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
          {tasks.length}
        </motion.span>
      </header>
      {dropBlocked && dropActive && blockedHint ? (
        <p className="mt-2 text-[11px] text-[#8f9b97]">{blockedHint}</p>
      ) : ambientHint ? (
        <motion.div
          className="relative mt-2 overflow-hidden rounded-[12px] border border-[#355247] bg-[linear-gradient(180deg,rgba(7,16,13,0.92),rgba(8,18,15,0.84))] px-3 py-2 text-[11px] text-[#b6dfcf]"
          animate={{
            borderColor: ['rgba(53,82,71,0.95)', 'rgba(121,208,171,0.65)', 'rgba(53,82,71,0.95)']
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

      <div className="mt-4 space-y-3">
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
                className={`relative h-full rounded-[14px] border bg-[#0c1110]/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors duration-150 ${
                  dropActive
                    ? dropEnabled
                      ? 'border-[#5d7568]/85'
                      : 'border-[#5b6661]/78'
                    : 'border-[#32403a]/75'
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
                      className={`text-[11px] font-medium ${
                        dropEnabled ? 'text-[#d6efe4]' : 'text-[#aeb8b3]'
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
                  <div className="h-[3px] rounded-full bg-[linear-gradient(90deg,rgba(160,210,188,0.08),rgba(221,236,230,0.92),rgba(160,210,188,0.08))] shadow-[0_0_18px_rgba(177,225,203,0.18)]" />
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
                  <div className="h-[3px] rounded-full bg-[linear-gradient(90deg,rgba(160,210,188,0.08),rgba(221,236,230,0.92),rgba(160,210,188,0.08))] shadow-[0_0_18px_rgba(177,225,203,0.18)]" />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
