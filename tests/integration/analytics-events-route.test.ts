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

interface AnalyticsState {
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
          resets_at: '2026-03-15T12:05:00.000Z'
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
        const filters: Record<string, string> = {};
        const chain: any = {};

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

const createAnalyticsClient = (state: AnalyticsState) => ({
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: null },
      error: null
    }))
  },
  from: vi.fn((table: string) => {
    if (table !== 'product_funnel_events') {
      throw new Error(`Unexpected table: ${table}`);
    }

    return {
      insert: vi.fn(async () => {
        state.insertCount += 1;
        return { error: null };
      })
    };
  })
});

const makeRequest = (idempotencyKey: string) =>
  new Request('http://localhost/api/analytics/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'x-forwarded-for': '203.0.113.9'
    },
    body: JSON.stringify({
      eventName: 'landing_cta',
      sessionId: 'session-12345678',
      path: '/',
      metadata: {
        source: 'hero'
      }
    })
  });

describe('analytics events route', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
  });

  it('replays the same response without reinserting analytics events', async () => {
    const adminState: AdminState = {
      idempotencyRecords: new Map(),
      rateLimitCalls: 0
    };
    const analyticsState: AnalyticsState = {
      insertCount: 0
    };

    createAdminClientMock.mockReturnValue(createAdminClient(adminState));
    createClientMock.mockReturnValue(createAnalyticsClient(analyticsState));

    const { POST } = await import('@/app/api/analytics/events/route');

    const firstResponse = await POST(makeRequest('analytics-once-key'));
    const secondResponse = await POST(makeRequest('analytics-once-key'));

    expect(firstResponse.status).toBe(201);
    await expect(firstResponse.json()).resolves.toEqual({
      accepted: true,
      stored: true
    });

    expect(secondResponse.status).toBe(201);
    await expect(secondResponse.json()).resolves.toEqual({
      accepted: true,
      stored: true
    });

    expect(analyticsState.insertCount).toBe(1);
  });
});
