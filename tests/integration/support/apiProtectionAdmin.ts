import { vi } from 'vitest';

export interface IdempotencyRecord {
  keyHash: string;
  lockedUntil: string;
  ownerHash: string;
  requestHash: string;
  responseBody: Record<string, unknown> | null;
  responseStatus: number | null;
  scope: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface ApiProtectionAdminState {
  idempotencyRecords: Map<string, IdempotencyRecord>;
  rateLimitAllowed: boolean;
  rateLimitCalls: number;
  retryAfterSeconds: number;
}

export const createApiProtectionAdminState = (
  overrides: Partial<ApiProtectionAdminState> = {}
): ApiProtectionAdminState => ({
  idempotencyRecords: new Map(),
  rateLimitAllowed: true,
  rateLimitCalls: 0,
  retryAfterSeconds: 0,
  ...overrides
});

const createEqChain = (
  callback: (
    filters: Record<string, string>
  ) => Promise<{ data?: unknown; error: null | { message: string } }>
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

export const createApiProtectionAdminClient = (
  state: ApiProtectionAdminState
) => ({
  rpc: vi.fn(async (fnName: string) => {
    if (fnName !== 'apply_api_rate_limit') {
      return {
        data: null,
        error: { message: `Unexpected admin RPC: ${fnName}` }
      };
    }

    state.rateLimitCalls += 1;

    return {
      data: [
        {
          allowed: state.rateLimitAllowed,
          request_count: state.rateLimitCalls,
          retry_after_seconds: state.retryAfterSeconds,
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
