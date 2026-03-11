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

  it('starts a todo task via PATCH endpoint', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/activation-tasks/task-1/start');
    expect(fetchMock.mock.calls[1][1]?.method).toBe('PATCH');
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

  it('deletes a task via DELETE endpoint', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('heading', { name: 'Delete task?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }));

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
