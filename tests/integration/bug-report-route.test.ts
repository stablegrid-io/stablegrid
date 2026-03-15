import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock
}));

interface IdempotencyRecord {
  keyHash: string;
  lockedUntil: string;
  ownerHash: string;
  requestHash: string;
  responseBody: Record<string, unknown> | null;
  responseStatus: number | null;
  scope: string;
  status: 'processing' | 'completed' | 'failed';
}

interface AdminState {
  idempotencyRecords: Map<string, IdempotencyRecord>;
  rateLimitCalls: number;
}

interface BugReportState {
  insertCount: number;
}

const createEqChain = (
  callback: (filters: Record<string, string>) => Promise<{ data?: unknown; error: null | { message: string } }>
) => {
  const filters: Record<string, string> = {};
  const chain: any = {};

  chain.eq = vi.fn((column: string, value: string) => {
    filters[column] = value;
    return chain;
  });
  chain.maybeSingle = vi.fn(async () => callback(filters));

  return chain;
};

const createUpdateEqChain = (
  callback: (filters: Record<string, string>) => Promise<{ error: null | { message: string } }>
) => {
  const filters: Record<string, string> = {};
  const chain: any = {};

  chain.eq = vi.fn((column: string, value: string) => {
    filters[column] = value;
    return chain;
  });

  return {
    chain,
    filters
  };
};

const createAdminClient = (state: AdminState) => ({
  rpc: vi.fn(async () => {
    state.rateLimitCalls += 1;
    return {
      data: [
        {
          allowed: true,
          request_count: state.rateLimitCalls,
          retry_after_seconds: 0,
          window_started_at: '2026-03-15T12:00:00.000Z',
          resets_at: '2026-03-15T13:00:00.000Z'
        }
      ],
      error: null
    };
  }),
  from: vi.fn((table: string) => {
    if (table !== 'api_idempotency_keys') {
      throw new Error(`Unexpected admin table: ${table}`);
    }

    return {
      insert: vi.fn(async (payload: Record<string, unknown>) => {
        const compositeKey = `${payload.scope}:${payload.owner_hash}:${payload.key_hash}`;
        if (state.idempotencyRecords.has(compositeKey)) {
          return {
            error: {
              code: '23505',
              message: 'duplicate key value violates unique constraint'
            }
          };
        }

        state.idempotencyRecords.set(compositeKey, {
          keyHash: payload.key_hash as string,
          lockedUntil: payload.locked_until as string,
          ownerHash: payload.owner_hash as string,
          requestHash: payload.request_hash as string,
          responseBody: null,
          responseStatus: null,
          scope: payload.scope as string,
          status: 'processing'
        });

        return { error: null };
      }),
      select: vi.fn(() =>
        createEqChain(async (filters) => {
          const compositeKey = `${filters.scope}:${filters.owner_hash}:${filters.key_hash}`;
          const record = state.idempotencyRecords.get(compositeKey) ?? null;
          return {
            data: record
              ? {
                  status: record.status,
                  request_hash: record.requestHash,
                  response_status: record.responseStatus,
                  response_body: record.responseBody,
                  locked_until: record.lockedUntil
                }
              : null,
            error: null
          };
        })
      ),
      update: vi.fn((payload: Record<string, unknown>) => {
        const { chain, filters } = createUpdateEqChain(async () => ({ error: null }));
        chain.eq = vi.fn((column: string, value: string) => {
          filters[column] = value;
          if (Object.keys(filters).length === 3) {
            const compositeKey = `${filters.scope}:${filters.owner_hash}:${filters.key_hash}`;
            const existing = state.idempotencyRecords.get(compositeKey);
            if (existing) {
              state.idempotencyRecords.set(compositeKey, {
                ...existing,
                lockedUntil:
                  typeof payload.locked_until === 'string'
                    ? payload.locked_until
                    : existing.lockedUntil,
                responseBody:
                  (payload.response_body as Record<string, unknown> | null | undefined) ??
                  existing.responseBody,
                responseStatus:
                  (payload.response_status as number | null | undefined) ??
                  existing.responseStatus,
                status: (payload.status as IdempotencyRecord['status']) ?? existing.status
              });
            }
          }
          return chain;
        });

        return chain;
      })
    };
  })
});

const createBugReportClient = (state: BugReportState) => ({
  auth: {
    getUser: vi.fn(async () => ({
      data: {
        user: {
          id: 'user-1',
          email: 'ops@stablegrid.io'
        }
      },
      error: null
    }))
  },
  from: vi.fn((table: string) => {
    if (table !== 'bug_reports') {
      throw new Error(`Unexpected table: ${table}`);
    }

    return {
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => {
            state.insertCount += 1;
            return {
              data: { id: `bug-${state.insertCount}` },
              error: null
            };
          })
        }))
      }))
    };
  })
});

const makeRequest = (idempotencyKey: string) =>
  new Request('http://localhost/api/support/bug-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'x-forwarded-for': '203.0.113.4'
    },
    body: JSON.stringify({
      title: 'Theory page freezes',
      details: 'The lesson page freezes after I open the third chapter.',
      pageUrl: '/learn/theory',
      context: {
        category: 'performance',
        area: 'theory'
      }
    })
  });

describe('bug report route', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
  });

  it('replays the first successful response for duplicate idempotency keys', async () => {
    const adminState: AdminState = {
      idempotencyRecords: new Map(),
      rateLimitCalls: 0
    };
    const bugReportState: BugReportState = {
      insertCount: 0
    };

    createAdminClientMock.mockReturnValue(createAdminClient(adminState));
    createClientMock.mockReturnValue(createBugReportClient(bugReportState));

    const { POST } = await import('@/app/api/support/bug-report/route');

    const firstResponse = await POST(makeRequest('bug-report-key-1234'));
    const secondResponse = await POST(makeRequest('bug-report-key-1234'));

    expect(firstResponse.status).toBe(200);
    await expect(firstResponse.json()).resolves.toEqual({
      reported: true,
      id: 'bug-1'
    });

    expect(secondResponse.status).toBe(200);
    await expect(secondResponse.json()).resolves.toEqual({
      reported: true,
      id: 'bug-1'
    });

    expect(bugReportState.insertCount).toBe(1);
  });
});
