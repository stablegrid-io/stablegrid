import { beforeEach, describe, expect, it, vi } from 'vitest';

const createAdminClientMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock
}));

describe('api protection helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
  });

  it('throws a 429 ApiRouteError when rate limit is exceeded', async () => {
    createAdminClientMock.mockReturnValue({
      rpc: vi.fn(async () => ({
        data: [
          {
            allowed: false,
            request_count: 6,
            retry_after_seconds: 42,
            window_started_at: '2026-03-15T12:00:00.000Z',
            resets_at: '2026-03-15T12:05:00.000Z'
          }
        ],
        error: null
      }))
    });

    const { ApiRouteError } = await import('@/lib/api/http');
    const { enforceRateLimit } = await import('@/lib/api/protection');

    await expect(
      enforceRateLimit({
        scope: 'analytics_events_session',
        key: 'session-12345678',
        limit: 5,
        windowSeconds: 300
      })
    ).rejects.toBeInstanceOf(ApiRouteError);

    await expect(
      enforceRateLimit({
        scope: 'analytics_events_session',
        key: 'session-12345678',
        limit: 5,
        windowSeconds: 300
      })
    ).rejects.toMatchObject({
      status: 429,
      details: {
        retryAfterSeconds: 42
      }
    });
  });
});
