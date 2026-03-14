import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUserMock = vi.fn();
const createMiddlewareClientMock = vi.fn((request: NextRequest) => ({
  supabase: {
    auth: {
      getUser: getUserMock
    }
  },
  response: new NextResponse(null, {
    status: 200,
    headers: {
      'x-test-pathname': request.nextUrl.pathname
    }
  })
}));

vi.mock('@/lib/supabase/middleware', () => ({
  createMiddlewareClient: createMiddlewareClientMock
}));

describe('admin middleware access', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://stablegrid.test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    vi.stubGlobal('fetch', vi.fn());
  });

  it('redirects unauthenticated /admin requests to login', async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: null
      }
    });

    const { middleware } = await import('@/middleware');
    const response = await middleware(new NextRequest('http://localhost:3000/admin'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns a real 403 for authenticated non-admin /admin requests', async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1'
        }
      }
    });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    } as Response);

    const { middleware } = await import('@/middleware');
    const response = await middleware(new NextRequest('http://localhost:3000/admin'));

    expect(response.status).toBe(403);
    expect(await response.text()).toBe('Forbidden');
  });

  it('allows authenticated admins through /admin', async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'admin-1'
        }
      }
    });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ user_id: 'admin-1' }]
    } as Response);

    const { middleware } = await import('@/middleware');
    const response = await middleware(new NextRequest('http://localhost:3000/admin'));

    expect(response.status).toBe(200);
  });
});
