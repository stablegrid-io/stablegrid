import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock
}));

interface CookieConsentRow {
  user_id: string;
  version: number;
  source: string;
  consent: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
  };
  consented_at: string;
}

const makeSupabaseClient = ({
  userId = 'user-1',
  initialRow = null,
  missingTable = false
}: {
  userId?: string | null;
  initialRow?: CookieConsentRow | null;
  missingTable?: boolean;
}) => {
  let row = initialRow;

  const missingTableResponse = {
    data: null,
    error: { message: 'relation "cookie_consents" does not exist' }
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null
      })
    },
    from: vi.fn((table: string) => {
      if (table !== 'cookie_consents') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn((_column: string, value: string) => ({
            maybeSingle: vi.fn(async () => {
              if (missingTable) {
                return missingTableResponse;
              }

              if (!row || row.user_id !== value) {
                return { data: null, error: null };
              }

              return {
                data: {
                  version: row.version,
                  source: row.source,
                  consent: row.consent,
                  consented_at: row.consented_at
                },
                error: null
              };
            })
          }))
        })),
        upsert: vi.fn((payload: CookieConsentRow) => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              if (missingTable) {
                return missingTableResponse;
              }

              row = {
                ...payload
              };

              return {
                data: {
                  version: row.version,
                  source: row.source,
                  consent: row.consent,
                  consented_at: row.consented_at
                },
                error: null
              };
            })
          }))
        }))
      };
    })
  };
};

describe('cookie consent route', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
  });

  it('returns 401 when unauthenticated', async () => {
    createClientMock.mockReturnValue(
      makeSupabaseClient({
        userId: null
      })
    );

    const { GET } = await import('@/app/api/cookies/consent/route');
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('upserts consent record and returns it from GET', async () => {
    createClientMock.mockReturnValue(makeSupabaseClient({}));

    const { GET, PUT } = await import('@/app/api/cookies/consent/route');

    const putResponse = await PUT(
      new Request('http://localhost/api/cookies/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: 1,
          timestamp: '2026-03-09T12:00:00.000Z',
          source: 'preferences_save',
          consent: {
            necessary: true,
            analytics: true,
            marketing: false,
            preferences: true
          }
        })
      })
    );

    expect(putResponse.status).toBe(200);
    await expect(putResponse.json()).resolves.toMatchObject({
      stored: true,
      data: {
        source: 'preferences_save',
        timestamp: '2026-03-09T12:00:00.000Z',
        consent: {
          necessary: true,
          analytics: true,
          marketing: false,
          preferences: true
        }
      }
    });

    const getResponse = await GET();
    expect(getResponse.status).toBe(200);
    await expect(getResponse.json()).resolves.toMatchObject({
      stored: true,
      data: {
        source: 'preferences_save',
        timestamp: '2026-03-09T12:00:00.000Z'
      }
    });
  });

  it('returns 400 for invalid consent payload', async () => {
    createClientMock.mockReturnValue(makeSupabaseClient({}));

    const { PUT } = await import('@/app/api/cookies/consent/route');
    const response = await PUT(
      new Request('http://localhost/api/cookies/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'not_a_valid_source'
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid consent record.' });
  });

  it('returns soft success when cookie_consents table is missing', async () => {
    createClientMock.mockReturnValue(
      makeSupabaseClient({
        missingTable: true
      })
    );

    const { GET, PUT } = await import('@/app/api/cookies/consent/route');

    const getResponse = await GET();
    expect(getResponse.status).toBe(200);
    await expect(getResponse.json()).resolves.toEqual({ data: null, stored: false });

    const putResponse = await PUT(
      new Request('http://localhost/api/cookies/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: 1,
          timestamp: '2026-03-09T12:00:00.000Z',
          source: 'banner_reject_all',
          consent: {
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false
          }
        })
      })
    );

    expect(putResponse.status).toBe(202);
    await expect(putResponse.json()).resolves.toMatchObject({
      stored: false
    });
  });
});
