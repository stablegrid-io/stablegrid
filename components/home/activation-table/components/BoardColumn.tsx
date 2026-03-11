import { TaskCard, type TaskCardData, type TaskCardState } from '@/components/home/activation-table/components/TaskCard';

interface BoardColumnProps {
  title: 'To Do' | 'In Progress' | 'Completed';
  state: TaskCardState;
  tasks: TaskCardData[];
  dropEnabled?: boolean;
  dropActive?: boolean;
  onDropTask?: ((state: TaskCardState) => void) | null;
  onColumnDragOver?: ((state: TaskCardState) => void) | null;
  onTaskDragStart?: ((taskId: string, state: TaskCardState) => void) | null;
  onTaskDragEnd?: (() => void) | null;
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
  dropEnabled = false,
  dropActive = false,
  onDropTask = null,
  onColumnDragOver = null,
  onTaskDragStart = null,
  onTaskDragEnd = null
}: BoardColumnProps) {
  return (
    <section
      data-testid={`activation-column-${state}`}
      onDragOver={(event) => {
        if (!dropEnabled) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        onColumnDragOver?.(state);
      }}
      onDrop={(event) => {
        if (!dropEnabled) return;
        event.preventDefault();
        onDropTask?.(state);
      }}
      className={`${BOARD_COLUMN_SURFACE_CLASS} md:snap-start ${
        dropActive ? 'border-[#4a5a53]' : ''
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
        <span
          className={`rounded-full border border-[#2d3531] bg-[#0c1110] px-2.5 py-0.5 text-[11px] font-medium ${countToneByState[state]}`}
        >
          {tasks.length}
        </span>
      </header>

      <div className="mt-4 space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={{
              ...task,
              draggable: state === 'todo',
              onDragStart: () => onTaskDragStart?.(task.id, state),
              onDragEnd: () => onTaskDragEnd?.()
            }}
            state={state}
          />
        ))}
      </div>
    </section>
  );
}
