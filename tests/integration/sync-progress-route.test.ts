import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createApiProtectionAdminClient,
  createApiProtectionAdminState
} from './support/apiProtectionAdmin';

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const reconcileActivationTasksSafelyMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock
}));

vi.mock('@/lib/activation/service', async () => {
  const actual = await vi.importActual<typeof import('@/lib/activation/service')>(
    '@/lib/activation/service'
  );

  return {
    ...actual,
    reconcileActivationTasksSafely: reconcileActivationTasksSafelyMock
  };
});

type JsonRecord = Record<string, unknown>;

interface UserProgressRow {
  completed_questions: Array<number | string>;
  deployed_node_ids?: string[];
  last_activity?: string;
  last_deployed_node_id?: string | null;
  streak: number;
  topic_progress: JsonRecord;
  updated_at?: string;
  user_id: string;
  xp: number;
}

interface GridOpsStateRow {
  deployed_asset_ids: string[];
  last_deployed_asset_id: string | null;
  scenario_id: string;
  user_id: string;
}

interface SyncProgressState {
  gridOpsStateRow: GridOpsStateRow | null;
  upsertCount: number;
  userProgressRows: UserProgressRow[];
}

const createSyncProgressClient = (state: SyncProgressState) => ({
  auth: {
    getUser: vi.fn(async () => ({
      data: {
        user: {
          id: 'user-1'
        }
      },
      error: null
    }))
  },
  from: vi.fn((table: string) => {
    if (table === 'grid_ops_state') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_column: string, userId: string) => ({
            eq: vi.fn((_scenarioColumn: string, scenarioId: string) => ({
              maybeSingle: vi.fn(async () => ({
                data:
                  state.gridOpsStateRow &&
                  state.gridOpsStateRow.user_id === userId &&
                  state.gridOpsStateRow.scenario_id === scenarioId
                    ? state.gridOpsStateRow
                    : null,
                error: null
              }))
            }))
          }))
        }))
      };
    }

    if (table !== 'user_progress') {
      throw new Error(`Unexpected table: ${table}`);
    }

    return {
      select: vi.fn((_columns: string) => ({
        eq: vi.fn((_column: string, userId: string) => ({
          maybeSingle: vi.fn(async () => ({
            data:
              state.userProgressRows.find((row) => row.user_id === userId) ?? null,
            error: null
          }))
        }))
      })),
      upsert: vi.fn((payload: Record<string, unknown>) => {
        state.upsertCount += 1;

        const nextRow: UserProgressRow = {
          completed_questions: Array.isArray(payload.completed_questions)
            ? (payload.completed_questions as Array<number | string>)
            : [],
          deployed_node_ids: Array.isArray(payload.deployed_node_ids)
            ? (payload.deployed_node_ids as string[])
            : undefined,
          last_activity:
            typeof payload.last_activity === 'string' ? payload.last_activity : undefined,
          last_deployed_node_id:
            typeof payload.last_deployed_node_id === 'string'
              ? payload.last_deployed_node_id
              : null,
          streak: Number(payload.streak ?? 0),
          topic_progress:
            (payload.topic_progress as JsonRecord | null | undefined) ?? {},
          updated_at:
            typeof payload.updated_at === 'string' ? payload.updated_at : undefined,
          user_id: payload.user_id as string,
          xp: Number(payload.xp ?? 0)
        };

        const existingIndex = state.userProgressRows.findIndex(
          (row) => row.user_id === nextRow.user_id
        );

        if (existingIndex >= 0) {
          state.userProgressRows[existingIndex] = {
            ...state.userProgressRows[existingIndex],
            ...nextRow
          };
        } else {
          state.userProgressRows.push(nextRow);
        }

        return {
          error: null,
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: nextRow,
              error: null
            }))
          }))
        };
      })
    };
  })
});

describe('sync progress route', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
    reconcileActivationTasksSafelyMock.mockReset();
    reconcileActivationTasksSafelyMock.mockResolvedValue(undefined);
  });

  it('GET upserts a missing progress row and returns it', async () => {
    const adminState = createApiProtectionAdminState();
    const state: SyncProgressState = {
      gridOpsStateRow: null,
      upsertCount: 0,
      userProgressRows: []
    };

    createAdminClientMock.mockReturnValue(createApiProtectionAdminClient(adminState));
    createClientMock.mockReturnValue(createSyncProgressClient(state));

    const { GET } = await import('@/app/api/auth/sync-progress/route');
    const response = await GET(
      new Request('http://localhost/api/auth/sync-progress', {
        headers: {
          'x-forwarded-for': '203.0.113.30'
        }
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { data: UserProgressRow };
    expect(payload.data.user_id).toBe('user-1');
    expect(state.upsertCount).toBe(1);
    expect(state.userProgressRows).toHaveLength(1);
  });

  it('replays duplicate POST syncs without writing progress twice', async () => {
    const adminState = createApiProtectionAdminState();
    const state: SyncProgressState = {
      gridOpsStateRow: null,
      upsertCount: 0,
      userProgressRows: [
        {
          user_id: 'user-1',
          xp: 100,
          streak: 1,
          completed_questions: ['q-1'],
          topic_progress: {
            notebooks: {
              completed_notebook_ids: ['nb-001']
            }
          }
        }
      ]
    };

    createAdminClientMock.mockReturnValue(createApiProtectionAdminClient(adminState));
    createClientMock.mockReturnValue(createSyncProgressClient(state));

    const { POST } = await import('@/app/api/auth/sync-progress/route');
    const request = () =>
      new Request('http://localhost/api/auth/sync-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'sync-progress-key-1234',
          'x-forwarded-for': '203.0.113.31'
        },
        body: JSON.stringify({
          xp: 200,
          streak: 3,
          completedQuestions: ['q-1', 'q-2'],
          topicProgress: {
            pyspark: {
              correct: 2,
              total: 3
            }
          }
        })
      });

    const firstResponse = await POST(request());
    const secondResponse = await POST(request());

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(await firstResponse.json()).toEqual(await secondResponse.json());
    expect(state.upsertCount).toBe(1);
    expect(reconcileActivationTasksSafelyMock).toHaveBeenCalledTimes(1);
    expect(state.userProgressRows[0]).toMatchObject({
      xp: 200,
      streak: 3,
      completed_questions: ['q-1', 'q-2']
    });
    expect(state.userProgressRows[0].topic_progress).toMatchObject({
      notebooks: {
        completed_notebook_ids: ['nb-001']
      },
      pyspark: {
        correct: 2,
        total: 3
      }
    });
  });
});
