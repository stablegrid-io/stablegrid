import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivationTable } from '@/components/home/activation-table/ActivationTable';
import { createPayloadRequestKey } from '@/lib/api/requestKeys';

const FRAMER_MOTION_PROPS = new Set([
  'animate',
  'exit',
  'initial',
  'layout',
  'layoutId',
  'transition',
  'variants',
  'viewport',
  'whileDrag',
  'whileHover',
  'whileInView',
  'whileTap'
]);

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const componentCache = new Map<string, any>();

  const toDomProps = (props: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(props).filter(([key]) => !FRAMER_MOTION_PROPS.has(key))
    );

  const createMotionComponent = (tagName: string) =>
    React.forwardRef<any, Record<string, unknown> & { children?: ReactNode }>(
      ({ children, ...props }, ref) =>
      React.createElement(tagName, { ...toDomProps(props), ref }, children)
    );

  const FragmentWrapper = ({ children }: { children?: ReactNode }) =>
    React.createElement(React.Fragment, null, children);

  return {
    AnimatePresence: FragmentWrapper,
    LayoutGroup: FragmentWrapper,
    motion: new Proxy(
      {},
      {
        get: (_target, key) => {
          if (
            typeof key !== 'string' ||
            key === 'then' ||
            key === 'catch' ||
            key === 'finally'
          ) {
            return undefined;
          }

          if (!componentCache.has(key)) {
            componentCache.set(key, createMotionComponent(key));
          }

          return componentCache.get(key);
        }
      }
    )
  };
});

vi.mock('@/components/home/activation-table/components/BoardColumn', () => ({
  BoardColumn: ({
    title,
    state,
    tasks,
    dropEnabled,
    dropBlocked,
    onBlockedDrop,
    onDropTask,
    onTaskDragStart
  }: {
    title: string;
    state: 'todo' | 'in-progress' | 'completed';
    tasks: Array<{
      id: string;
      title: string;
      onEdit?: (() => void) | null;
    }>;
    dropEnabled?: boolean;
    dropBlocked?: boolean;
    onBlockedDrop?: ((state: 'todo' | 'in-progress' | 'completed') => void) | null;
    onDropTask?: ((state: 'todo' | 'in-progress' | 'completed') => void) | null;
    onTaskDragStart?: ((
      taskId: string,
      state: 'todo' | 'in-progress' | 'completed'
    ) => void) | null;
  }) => (
    <section data-testid={`activation-column-${state}`}>
      <h3>{title}</h3>
      <button
        type="button"
        onClick={() => {
          if (dropEnabled) {
            onDropTask?.(state);
            return;
          }

          if (dropBlocked) {
            onBlockedDrop?.(state);
          }
        }}
      >
        {`Drop on ${title}`}
      </button>
      {tasks.map((task) => (
        <article key={task.id}>
          <h4>{task.title}</h4>
          <button
            type="button"
            onClick={() => onTaskDragStart?.(task.id, state)}
          >
            {`Drag ${task.id}`}
          </button>
          {task.onEdit ? (
            <button
              type="button"
              onClick={task.onEdit}
            >
              Edit
            </button>
          ) : null}
        </article>
      ))}
    </section>
  )
}));

const baseBoard = {
  todo: [
    {
      id: 'task-1',
      title: 'Complete 2 PySpark modules',
      description: 'Continue through the next theory units in this track.',
      status: 'todo',
      taskType: 'theory',
      taskGroup: 'theory',
      trackSlug: 'pyspark',
      trackTitle: 'PySpark',
      scopeType: 'count',
      requestedCount: 2,
      progress: { completed: 0, total: 2 },
      statusLabel: '2 linked items',
      actionLabel: 'Start',
      createdAt: '2026-03-11T10:00:00.000Z',
      startedAt: null,
      completedAt: null,
      primaryContentItemId: null
    }
  ],
  inProgress: [],
  completed: [],
  catalog: {
    tracks: [
      { slug: 'pyspark', title: 'PySpark' },
      { slug: 'fabric', title: 'Microsoft Fabric' }
    ]
  }
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const getRequestHeaders = (
  fetchMock: ReturnType<typeof vi.fn>,
  callIndex: number
) =>
  new Headers(
    (fetchMock.mock.calls[callIndex]?.[1] as RequestInit | undefined)?.headers
  );

describe('ActivationTable client requests', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads board data from the activation board endpoint', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: baseBoard }));

    render(<ActivationTable />);

    expect(await screen.findByRole('heading', { name: 'To Do' })).toBeInTheDocument();
    expect(screen.getByText('Complete 2 PySpark modules')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/activation-board', {
      method: 'GET',
      credentials: 'include'
    });
  });

  it('sends an idempotency key when creating a task', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: baseBoard }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            data: {
              board: baseBoard
            }
          },
          201
        )
      );

    render(<ActivationTable />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    const createButtons = screen.getAllByRole('button', { name: /^create task$/i });
    fireEvent.click(createButtons[createButtons.length - 1]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks');
    expect(getRequestHeaders(fetchMock, 1).get('Idempotency-Key')).toBe(
      createPayloadRequestKey('activation_task_create', {
        taskId: null,
        taskType: 'theory',
        taskGroup: 'theory',
        scopeType: 'count',
        trackSlug: 'pyspark',
        requestedCount: 1
      })
    );
  });

  it('sends an idempotency key when starting a task', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: baseBoard }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            board: {
              ...baseBoard,
              todo: [],
              inProgress: [
                {
                  ...baseBoard.todo[0],
                  status: 'in_progress',
                  statusLabel: '0/2 complete',
                  actionLabel: 'Open'
                }
              ]
            }
          }
        })
      );

    render(<ActivationTable />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: 'Drag task-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drop on In Progress' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1/start');
    expect(getRequestHeaders(fetchMock, 1).get('Idempotency-Key')).toBe(
      createPayloadRequestKey('activation_task_start', {
        taskId: 'task-1',
        action: 'start'
      })
    );
  });

  it('sends an idempotency key when moving a task back to To Do', async () => {
    const inProgressBoard = {
      ...baseBoard,
      todo: [],
      inProgress: [
        {
          ...baseBoard.todo[0],
          status: 'in_progress',
          statusLabel: '0/2 complete',
          actionLabel: 'Open'
        }
      ]
    };

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: inProgressBoard }))
      .mockResolvedValueOnce(jsonResponse({ data: { board: baseBoard } }));

    render(<ActivationTable />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: 'Drag task-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drop on To Do' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1/todo');
    expect(getRequestHeaders(fetchMock, 1).get('Idempotency-Key')).toBe(
      createPayloadRequestKey('activation_task_todo', {
        taskId: 'task-1',
        action: 'move_to_todo'
      })
    );
  });

  it('sends an idempotency key when completing a ready task', async () => {
    const readyBoard = {
      ...baseBoard,
      todo: [],
      inProgress: [
        {
          ...baseBoard.todo[0],
          status: 'in_progress',
          statusLabel: '1/1 complete',
          actionLabel: 'Open',
          requestedCount: 1,
          progress: { completed: 1, total: 1 }
        }
      ]
    };

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: readyBoard }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            board: {
              ...readyBoard,
              inProgress: [],
              completed: [
                {
                  ...readyBoard.inProgress[0],
                  status: 'completed',
                  actionLabel: null,
                  completedAt: '2026-03-13T09:00:00.000Z'
                }
              ]
            }
          }
        })
      );

    render(<ActivationTable />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: 'Drag task-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drop on Completed' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1/completed');
    expect(getRequestHeaders(fetchMock, 1).get('Idempotency-Key')).toBe(
      createPayloadRequestKey('activation_task_completed', {
        taskId: 'task-1',
        action: 'move_to_completed'
      })
    );
  });

  it('sends an idempotency key when editing a task', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: baseBoard }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            board: baseBoard
          }
        })
      );

    render(<ActivationTable />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save task' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1');
    expect(getRequestHeaders(fetchMock, 1).get('Idempotency-Key')).toBe(
      createPayloadRequestKey('activation_task_update', {
        taskId: 'task-1',
        taskType: 'theory',
        taskGroup: 'theory',
        scopeType: 'count',
        trackSlug: 'pyspark',
        requestedCount: 2
      })
    );
  });

  it('sends an idempotency key when deleting a task', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: baseBoard }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            board: {
              ...baseBoard,
              todo: []
            }
          }
        })
      );

    render(<ActivationTable />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1');
    expect(getRequestHeaders(fetchMock, 1).get('Idempotency-Key')).toBe(
      createPayloadRequestKey('activation_task_delete', {
        taskId: 'task-1',
        action: 'delete'
      })
    );
  });
});
