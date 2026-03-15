import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTEBOOKS } from '@/data/notebooks';
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

vi.mock('@/lib/activation/service', () => ({
  reconcileActivationTasksSafely: reconcileActivationTasksSafelyMock
}));

type JsonRecord = Record<string, unknown>;

interface UserProgressRow {
  topic_progress: JsonRecord | null;
  user_id: string;
}

interface NotebookState {
  row: UserProgressRow | null;
  selectCount: number;
  upsertCount: number;
}

const createNotebookClient = (state: NotebookState) => ({
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
    if (table !== 'user_progress') {
      throw new Error(`Unexpected table: ${table}`);
    }

    return {
      select: vi.fn((columns: string) => {
        if (columns !== 'topic_progress') {
          throw new Error(`Unexpected select columns: ${columns}`);
        }

        return {
          eq: vi.fn((_column: string, userId: string) => ({
            maybeSingle: vi.fn(async () => {
              state.selectCount += 1;
              const row =
                state.row && state.row.user_id === userId ? state.row : null;

              return {
                data: row
                  ? {
                      topic_progress: row.topic_progress
                    }
                  : null,
                error: null
              };
            })
          }))
        };
      }),
      upsert: vi.fn(async (payload: Record<string, unknown>) => {
        state.upsertCount += 1;
        state.row = {
          topic_progress: (payload.topic_progress as JsonRecord | null | undefined) ?? null,
          user_id: payload.user_id as string
        };

        return { error: null };
      })
    };
  })
});

const makeRequest = (idempotencyKey: string) =>
  new Request('http://localhost/api/practice/notebooks/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'x-forwarded-for': '203.0.113.11'
    },
    body: JSON.stringify({
      completedNotebookIds: ['nb-002', 'nb-001', 'invalid', 'nb-001']
    })
  });

describe('notebooks progress route', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
    reconcileActivationTasksSafelyMock.mockReset();
    reconcileActivationTasksSafelyMock.mockResolvedValue(undefined);
  });

  it('replays notebook progress writes for duplicate idempotency keys', async () => {
    const adminState = createApiProtectionAdminState();
    const notebookState: NotebookState = {
      row: null,
      selectCount: 0,
      upsertCount: 0
    };

    createAdminClientMock.mockReturnValue(createApiProtectionAdminClient(adminState));
    createClientMock.mockReturnValue(createNotebookClient(notebookState));

    const { POST } = await import('@/app/api/practice/notebooks/progress/route');

    const firstResponse = await POST(makeRequest('notebooks-progress-key-1234'));
    const secondResponse = await POST(makeRequest('notebooks-progress-key-1234'));

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);

    const firstPayload = (await firstResponse.json()) as {
      data: {
        completedNotebookIds: string[];
        completedNotebooksCount: number;
        notebooksTotal: number;
        updatedAt: string | null;
      };
    };
    const secondPayload = (await secondResponse.json()) as {
      data: {
        completedNotebookIds: string[];
        completedNotebooksCount: number;
        notebooksTotal: number;
        updatedAt: string | null;
      };
    };

    expect(firstPayload).toEqual(secondPayload);
    expect(firstPayload.data).toEqual({
      completedNotebookIds: ['nb-001', 'nb-002'],
      completedNotebooksCount: 2,
      notebooksTotal: NOTEBOOKS.length,
      updatedAt: expect.any(String)
    });
    expect(notebookState.selectCount).toBe(1);
    expect(notebookState.upsertCount).toBe(1);
    expect(reconcileActivationTasksSafelyMock).toHaveBeenCalledTimes(1);
  });
});
