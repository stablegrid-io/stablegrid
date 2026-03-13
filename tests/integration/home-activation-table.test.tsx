import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeActivationTable } from '@/components/home/activation-table/HomeActivationTable';
import type { HomeActivationTableProps } from '@/components/home/activation-table/HomeActivationTable';

const buildProps = (): HomeActivationTableProps => ({
  featureEnabled: true,
  data: {
    greeting: {
      title: 'unused',
      subtitle: 'unused'
    },
    categories: []
  }
});

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
      completedAt: null
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

describe('HomeActivationTable', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders API-backed board columns and task card content', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: baseBoard }));

    render(<HomeActivationTable {...buildProps()} />);

    expect(await screen.findByRole('heading', { name: 'To Do' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'In Progress' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Completed' })).toBeInTheDocument();
    expect(screen.getByText('Complete 2 PySpark modules')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/activation-board', {
      method: 'GET',
      credentials: 'include'
    });
  });

  it('renders a quiet distinction between theory and task cards', async () => {
    const mixedBoard = {
      ...baseBoard,
      inProgress: [
        {
          ...baseBoard.todo[0],
          id: 'task-2',
          title: 'Complete 1 Microsoft Fabric notebook',
          description: 'Apply your learning through guided practical work.',
          status: 'in_progress',
          taskType: 'task',
          taskGroup: 'notebooks',
          trackSlug: 'fabric',
          trackTitle: 'Microsoft Fabric',
          requestedCount: 1,
          progress: { completed: 0, total: 1 },
          statusLabel: '0/1 complete',
          actionLabel: 'Open'
        }
      ]
    };

    fetchMock.mockResolvedValueOnce(jsonResponse({ data: mixedBoard }));

    render(<HomeActivationTable {...buildProps()} />);

    await screen.findByText('Complete 2 PySpark modules');
    expect(screen.getByText('Theory')).toBeInTheDocument();
    expect(screen.getByText('PySpark')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Notebook')).toBeInTheDocument();
  });

  it('submits create task flow to POST endpoint', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: baseBoard }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            board: {
              ...baseBoard,
              todo: [
                ...baseBoard.todo,
                {
                  ...baseBoard.todo[0],
                  id: 'task-2',
                  title: 'Complete 1 PySpark module',
                  progress: { completed: 0, total: 1 },
                  statusLabel: '1 linked item'
                }
              ]
            }
          }
        }, 201)
      );

    render(<HomeActivationTable {...buildProps()} />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(screen.getByText('New activation commitment')).toBeInTheDocument();

    const createButtons = screen.getAllByRole('button', { name: /^create task$/i });
    fireEvent.click(createButtons[createButtons.length - 1]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const createCall = fetchMock.mock.calls[1];
    expect(createCall[0]).toBe('/api/activation-tasks');
    expect(createCall[1]?.method).toBe('POST');
    expect(String(createCall[1]?.body)).toContain('"taskType":"theory"');
    expect(String(createCall[1]?.body)).toContain('"scopeType":"count"');
  });

  it('submits explicit theory module selection with contentItemIds', async () => {
    const boardWithTheoryOptions = {
      ...baseBoard,
      catalog: {
        ...baseBoard.catalog,
        taskOptions: {
          theory: [
            {
              id: 'module-3',
              title: 'Module 3',
              label: 'PySpark: Module 3',
              trackSlug: 'pyspark',
              trackTitle: 'PySpark'
            },
            {
              id: 'module-2',
              title: 'Module 2',
              label: 'PySpark: Module 2',
              trackSlug: 'pyspark',
              trackTitle: 'PySpark'
            }
          ],
          theoryCompleted: [
            {
              id: 'module-1',
              title: 'Module 1',
              label: 'PySpark: Module 1',
              trackSlug: 'pyspark',
              trackTitle: 'PySpark'
            }
          ],
          flashcards: [],
          notebooks: [],
          missions: []
        }
      }
    };

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: boardWithTheoryOptions }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            data: {
              board: boardWithTheoryOptions
            }
          },
          201
        )
      );

    render(<HomeActivationTable {...buildProps()} />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    fireEvent.click(screen.getByLabelText('Module 2'));
    fireEvent.click(screen.getByLabelText('Module 3'));
    const createButtons = screen.getAllByRole('button', { name: /^create task$/i });
    fireEvent.click(createButtons[createButtons.length - 1]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const createCall = fetchMock.mock.calls[1];
    expect(createCall[0]).toBe('/api/activation-tasks');
    expect(String(createCall[1]?.body)).toContain('"taskType":"theory"');
    expect(String(createCall[1]?.body)).toContain('"contentItemIds":["module-2","module-3"]');
  });

  it('closes the create task modal when Escape is pressed', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: baseBoard }));

    render(<HomeActivationTable {...buildProps()} />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(screen.getByText('New activation commitment')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByText('New activation commitment')).not.toBeInTheDocument()
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps only edit on todo cards', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: baseBoard }));

    render(<HomeActivationTable {...buildProps()} />);
    await screen.findByText('Complete 2 PySpark modules');

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('supports dragging a todo task into In Progress to start it', async () => {
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
                  statusLabel: '1/2 complete',
                  actionLabel: 'Open'
                }
              ]
            }
          }
        })
      );

    render(<HomeActivationTable {...buildProps()} />);
    await screen.findByText('Complete 2 PySpark modules');

    const taskCard = screen.getByText('Complete 2 PySpark modules').closest('article');
    expect(taskCard).not.toBeNull();

    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: vi.fn(),
      getData: vi.fn()
    } as unknown as DataTransfer;

    fireEvent.dragStart(taskCard!, { dataTransfer });
    fireEvent.dragOver(screen.getByTestId('activation-column-in-progress'), { dataTransfer });
    fireEvent.drop(screen.getByTestId('activation-column-in-progress'), { dataTransfer });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1/start');
    expect(fetchMock.mock.calls[1][1]?.method).toBe('PATCH');
  });

  it('supports dragging an in-progress task back into To Do', async () => {
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
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            board: {
              ...baseBoard,
              todo: [
                {
                  ...baseBoard.todo[0],
                  status: 'todo',
                  statusLabel: '2 linked items',
                  actionLabel: 'Start'
                }
              ],
              inProgress: []
            }
          }
        })
      );

    render(<HomeActivationTable {...buildProps()} />);
    await screen.findByText('Complete 2 PySpark modules');

    const taskCard = screen.getByText('Complete 2 PySpark modules').closest('article');
    expect(taskCard).not.toBeNull();

    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: vi.fn(),
      getData: vi.fn()
    } as unknown as DataTransfer;

    fireEvent.dragStart(taskCard!, { dataTransfer });
    fireEvent.dragOver(screen.getByTestId('activation-column-todo'), { dataTransfer });
    fireEvent.drop(screen.getByTestId('activation-column-todo'), { dataTransfer });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1/todo');
    expect(fetchMock.mock.calls[1][1]?.method).toBe('PATCH');
  });

  it('does not allow dragging unfinished tasks into Completed', async () => {
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

    fetchMock.mockResolvedValueOnce(jsonResponse({ data: inProgressBoard }));

    render(<HomeActivationTable {...buildProps()} />);
    await screen.findByText('Complete 2 PySpark modules');

    const taskCard = screen.getByText('Complete 2 PySpark modules').closest('article');
    expect(taskCard).not.toBeNull();

    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: vi.fn(),
      getData: vi.fn()
    } as unknown as DataTransfer;

    fireEvent.dragStart(taskCard!, { dataTransfer });
    fireEvent.dragOver(screen.getByTestId('activation-column-completed'), { dataTransfer });
    fireEvent.drop(screen.getByTestId('activation-column-completed'), { dataTransfer });

    await waitFor(() =>
      expect(screen.getByText('Finish all linked items to unlock Completed.')).toBeInTheDocument()
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('unlocks finished in-progress tasks for drag to Completed', async () => {
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

    render(<HomeActivationTable {...buildProps()} />);
    await screen.findByText('Complete 2 PySpark modules');

    expect(screen.getByText('Ready to complete')).toBeInTheDocument();
    expect(screen.getByText('1 task unlocked. Drag into Completed.')).toBeInTheDocument();

    const taskCard = screen.getByText('Complete 2 PySpark modules').closest('article');
    expect(taskCard).not.toBeNull();

    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: vi.fn(),
      getData: vi.fn()
    } as unknown as DataTransfer;

    fireEvent.dragStart(taskCard!, { dataTransfer });
    fireEvent.dragOver(screen.getByTestId('activation-column-completed'), { dataTransfer });
    fireEvent.drop(screen.getByTestId('activation-column-completed'), { dataTransfer });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1/completed');
    expect(fetchMock.mock.calls[1][1]?.method).toBe('PATCH');
  });

  it('edits a todo task via PATCH endpoint', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: baseBoard }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            board: {
              ...baseBoard,
              todo: [
                {
                  ...baseBoard.todo[0],
                  title: 'Complete 1 PySpark module',
                  requestedCount: 1,
                  progress: { completed: 0, total: 1 },
                  statusLabel: '1 linked item'
                }
              ]
            }
          }
        })
      );

    render(<HomeActivationTable {...buildProps()} />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Update activation commitment')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save task' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1');
    expect(fetchMock.mock.calls[1][1]?.method).toBe('PATCH');
  });

  it('edits an in-progress task via PATCH endpoint', async () => {
    const inProgressBoard = {
      ...baseBoard,
      todo: [],
      inProgress: [
        {
          ...baseBoard.todo[0],
          status: 'in_progress',
          statusLabel: '0/1 complete',
          actionLabel: 'Open',
          requestedCount: 1,
          progress: { completed: 0, total: 1 }
        }
      ]
    };

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: inProgressBoard }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            board: {
              ...inProgressBoard,
              inProgress: [
                {
                  ...inProgressBoard.inProgress[0],
                  title: 'Complete 2 PySpark modules',
                  requestedCount: 2,
                  statusLabel: '0/2 complete',
                  progress: { completed: 0, total: 2 }
                }
              ]
            }
          }
        })
      );

    render(<HomeActivationTable {...buildProps()} />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Update activation commitment')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save task' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1');
    expect(fetchMock.mock.calls[1][1]?.method).toBe('PATCH');
  });

  it('deletes a task from the edit flow via DELETE endpoint', async () => {
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

    render(<HomeActivationTable {...buildProps()} />);
    await screen.findByText('Complete 2 PySpark modules');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Update activation commitment')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }));
    expect(screen.getByRole('heading', { name: 'Delete task?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1');
    expect(fetchMock.mock.calls[1][1]?.method).toBe('DELETE');
  });

  it('returns null when feature flag is disabled', () => {
    render(
      <HomeActivationTable
        {...buildProps()}
        featureEnabled={false}
      />
    );

    expect(screen.queryByTestId('home-activation-table')).not.toBeInTheDocument();
  });
});
