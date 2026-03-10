import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTEBOOKS } from '@/data/notebooks';

interface StoredUserProgressRow {
  user_id: string;
  topic_progress: Record<string, unknown> | null;
}

interface StoredUserMissionRow {
  user_id: string;
  mission_slug: string;
  state: 'not_started' | 'in_progress' | 'completed';
  updated_at: string | null;
}

const createClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock
}));

const makeSupabaseClient = ({
  userId,
  userProgressRows,
  userMissionRows
}: {
  userId: string | null;
  userProgressRows: StoredUserProgressRow[];
  userMissionRows: StoredUserMissionRow[];
}) => {
  const progressEqMock = vi.fn((column: string, scopedUserId: string) => {
    if (column !== 'user_id') {
      throw new Error(`Unexpected user_progress column: ${column}`);
    }

    return {
      maybeSingle: vi.fn(async () => ({
        data: userProgressRows.find((row) => row.user_id === scopedUserId) ?? null,
        error: null
      }))
    };
  });

  const missionNeqMock = vi.fn(
    async (scopedUserId: string, filterColumn: string, filterValue: string) => {
      if (filterColumn !== 'state') {
        throw new Error(`Unexpected user_missions filter column: ${filterColumn}`);
      }

      return {
        data: userMissionRows.filter(
          (row) => row.user_id === scopedUserId && row.state !== filterValue
        ),
        error: null
      };
    }
  );

  const missionEqMock = vi.fn((column: string, scopedUserId: string) => {
    if (column !== 'user_id') {
      throw new Error(`Unexpected user_missions column: ${column}`);
    }

    return {
      neq: vi.fn((filterColumn: string, filterValue: string) =>
        missionNeqMock(scopedUserId, filterColumn, filterValue)
      )
    };
  });

  const fromMock = vi.fn((table: string) => {
    if (table === 'user_progress') {
      return {
        select: vi.fn(() => ({
          eq: progressEqMock
        }))
      };
    }

    if (table === 'user_missions') {
      return {
        select: vi.fn(() => ({
          eq: missionEqMock
        }))
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: userId ? { id: userId } : null },
          error: null
        })
      },
      from: fromMock
    },
    progressEqMock,
    missionEqMock,
    missionNeqMock,
    fromMock
  };
};

describe('tasks page backend auth + user scoping', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders safe default task lanes for unauthenticated users without querying user tables', async () => {
    const fromMock = vi.fn(() => {
      throw new Error('TasksPage should not query user tables when user is unauthenticated');
    });

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null
        })
      },
      from: fromMock
    });

    const { default: TasksPage } = await import('@/app/tasks/page');
    render(await TasksPage());

    expect(
      screen.getByRole('heading', { name: 'Continue from your active task lanes' })
    ).toBeInTheDocument();
    expect(screen.getByText('Open notebooks').closest('a')).toHaveAttribute(
      'href',
      '/practice/notebooks'
    );
    expect(screen.getByText('Open missions').closest('a')).toHaveAttribute(
      'href',
      '/missions'
    );
    expect(screen.getByText('Open flashcards').closest('a')).toHaveAttribute(
      'href',
      '/flashcards'
    );
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('scopes tasks data to the authenticated user and routes to that user latest mission', async () => {
    const supabaseMocks = makeSupabaseClient({
      userId: 'user-1',
      userProgressRows: [
        {
          user_id: 'user-1',
          topic_progress: {
            notebooks: {
              completed_notebook_ids: ['nb-001'],
              completed_notebooks_count: 1,
              total_notebooks_count: 2
            },
            pyspark: {
              lastAttempted: '2026-03-10T08:00:00.000Z',
              total: 14,
              completionPct: 70
            }
          }
        },
        {
          user_id: 'user-2',
          topic_progress: {
            notebooks: {
              completed_notebooks_count: 99
            },
            fabric: {
              lastAttempted: '2026-03-10T09:00:00.000Z',
              total: 250,
              completionPct: 100
            }
          }
        }
      ],
      userMissionRows: [
        {
          user_id: 'user-1',
          mission_slug: 'solar-surge',
          state: 'in_progress',
          updated_at: '2026-03-10T07:00:00.000Z'
        },
        {
          user_id: 'user-2',
          mission_slug: 'ghost-regulator',
          state: 'in_progress',
          updated_at: '2026-03-10T10:00:00.000Z'
        }
      ]
    });

    createClientMock.mockReturnValue(supabaseMocks.client);

    const { default: TasksPage } = await import('@/app/tasks/page');
    render(await TasksPage());

    expect(supabaseMocks.fromMock).toHaveBeenCalledWith('user_progress');
    expect(supabaseMocks.fromMock).toHaveBeenCalledWith('user_missions');
    expect(supabaseMocks.progressEqMock).toHaveBeenCalledWith('user_id', 'user-1');
    expect(supabaseMocks.missionEqMock).toHaveBeenCalledWith('user_id', 'user-1');
    expect(supabaseMocks.missionNeqMock).toHaveBeenCalledWith(
      'user-1',
      'state',
      'not_started'
    );

    expect(screen.getByText('Resume mission').closest('a')).toHaveAttribute(
      'href',
      '/missions/solar-surge'
    );
    expect(document.querySelector('a[href="/missions/ghost-regulator"]')).toBeNull();
    expect(screen.getByText('Resume flashcards').closest('a')).toHaveAttribute(
      'href',
      '/practice/pyspark'
    );
  });

  it('selects the latest mission by updated_at after excluding not_started missions', async () => {
    const supabaseMocks = makeSupabaseClient({
      userId: 'user-1',
      userProgressRows: [
        {
          user_id: 'user-1',
          topic_progress: null
        }
      ],
      userMissionRows: [
        {
          user_id: 'user-1',
          mission_slug: 'solar-surge',
          state: 'in_progress',
          updated_at: '2026-03-10T07:00:00.000Z'
        },
        {
          user_id: 'user-1',
          mission_slug: 'blackout-berlin',
          state: 'not_started',
          updated_at: '2026-03-10T10:00:00.000Z'
        },
        {
          user_id: 'user-1',
          mission_slug: 'ghost-regulator',
          state: 'completed',
          updated_at: '2026-03-10T09:30:00.000Z'
        }
      ]
    });

    createClientMock.mockReturnValue(supabaseMocks.client);

    const { default: TasksPage } = await import('@/app/tasks/page');
    render(await TasksPage());

    expect(supabaseMocks.missionNeqMock).toHaveBeenCalledWith(
      'user-1',
      'state',
      'not_started'
    );
    expect(screen.getByText('Replay mission').closest('a')).toHaveAttribute(
      'href',
      '/missions/ghost-regulator'
    );
    expect(document.querySelector('a[href="/missions/blackout-berlin"]')).toBeNull();
  });

  it('chooses latest flashcard track from valid timestamps and ignores invalid lastAttempted values', async () => {
    const supabaseMocks = makeSupabaseClient({
      userId: 'user-1',
      userProgressRows: [
        {
          user_id: 'user-1',
          topic_progress: {
            pyspark: {
              lastAttempted: 'not-a-date',
              total: 44,
              completionPct: 88
            },
            fabric: {
              lastAttempted: '2026-03-10T09:15:00.000Z',
              total: 12,
              completionPct: 60
            }
          }
        }
      ],
      userMissionRows: []
    });

    createClientMock.mockReturnValue(supabaseMocks.client);

    const { default: TasksPage } = await import('@/app/tasks/page');
    render(await TasksPage());

    expect(screen.getByText('Resume flashcards').closest('a')).toHaveAttribute(
      'href',
      '/practice/fabric'
    );
    expect(screen.getAllByText('12 attempted').length).toBeGreaterThan(0);
  });

  it('derives notebook progress from mixed persisted fields and keeps progress bounded', async () => {
    const expectedTotal = NOTEBOOKS.length + 2;
    const expectedCompleted = 2;
    const expectedPct = Math.round((expectedCompleted / expectedTotal) * 100);

    const supabaseMocks = makeSupabaseClient({
      userId: 'user-1',
      userProgressRows: [
        {
          user_id: 'user-1',
          topic_progress: {
            notebooks: {
              completed_notebook_ids: ['nb-001'],
              completed_notebooks_count: 2,
              notebooks_total: expectedTotal
            }
          }
        }
      ],
      userMissionRows: []
    });

    createClientMock.mockReturnValue(supabaseMocks.client);

    const { default: TasksPage } = await import('@/app/tasks/page');
    render(await TasksPage());

    const notebooksCard = screen.getByText('Notebooks').closest('a');
    expect(notebooksCard).not.toBeNull();

    const notebooksScope = within(notebooksCard as HTMLElement);
    expect(notebooksScope.getByText(`${expectedPct}%`)).toBeInTheDocument();
    expect(notebooksScope.getAllByText(`${expectedCompleted}/${expectedTotal} reviewed`).length).toBeGreaterThan(0);
  });

  it('handles malformed topic_progress payload with safe fallback links and no runtime failure', async () => {
    const supabaseMocks = makeSupabaseClient({
      userId: 'user-1',
      userProgressRows: [
        {
          user_id: 'user-1',
          topic_progress: 'corrupted-json-payload' as unknown as Record<string, unknown>
        }
      ],
      userMissionRows: []
    });

    createClientMock.mockReturnValue(supabaseMocks.client);

    const { default: TasksPage } = await import('@/app/tasks/page');
    render(await TasksPage());

    expect(
      screen.getByRole('heading', { name: 'Continue from your active task lanes' })
    ).toBeInTheDocument();
    expect(screen.getByText('Open notebooks').closest('a')).toHaveAttribute(
      'href',
      '/practice/notebooks'
    );
    expect(screen.getByText('Open missions').closest('a')).toHaveAttribute(
      'href',
      '/missions'
    );
    expect(screen.getByText('Open flashcards').closest('a')).toHaveAttribute(
      'href',
      '/flashcards'
    );
    expect(screen.getAllByText(`0/${NOTEBOOKS.length} reviewed`).length).toBeGreaterThan(0);
  });
});
