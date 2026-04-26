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

const importMiddleware = async () => {
  const { middleware } = await import('@/middleware');
  return middleware;
};

describe('learn / theory middleware (anonymous public access)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://stablegrid.test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('anonymous user', () => {
    beforeEach(() => {
      getUserMock.mockResolvedValue({ data: { user: null } });
    });

    it('allows /theory through (no redirect)', async () => {
      const middleware = await importMiddleware();
      const response = await middleware(
        new NextRequest('http://localhost:3000/theory')
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('allows /learn/pyspark/theory through', async () => {
      const middleware = await importMiddleware();
      const response = await middleware(
        new NextRequest('http://localhost:3000/learn/pyspark/theory')
      );
      expect(response.status).toBe(200);
    });

    it.each(['junior', 'mid', 'senior'])(
      'allows /learn/pyspark/theory/%s through',
      async (level) => {
        const middleware = await importMiddleware();
        const response = await middleware(
          new NextRequest(`http://localhost:3000/learn/pyspark/theory/${level}`)
        );
        expect(response.status).toBe(200);
      }
    );

    it.each(['chapter', 'practice', 'capstone'])(
      'redirects /learn/pyspark/theory/junior?%s=… to /login',
      async (param) => {
        const middleware = await importMiddleware();
        const response = await middleware(
          new NextRequest(
            `http://localhost:3000/learn/pyspark/theory/junior?${param}=module-PS1`
          )
        );
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(
          'http://localhost:3000/login'
        );
      }
    );

    it('still redirects /home to /login (regression)', async () => {
      const middleware = await importMiddleware();
      const response = await middleware(
        new NextRequest('http://localhost:3000/home')
      );
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/login'
      );
    });

    it.each(['/settings', '/stats', '/practice', '/operations', '/workspace/abc'])(
      'still redirects %s to /login (regression)',
      async (path) => {
        const middleware = await importMiddleware();
        const response = await middleware(
          new NextRequest(`http://localhost:3000${path}`)
        );
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(
          'http://localhost:3000/login'
        );
      }
    );
  });

  describe('authenticated user with completed onboarding', () => {
    beforeEach(() => {
      getUserMock.mockResolvedValue({
        data: { user: { id: 'user-1' } }
      });
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [{ onboarding_completed: true }]
      } as Response);
    });

    it('passes through /learn/pyspark/theory', async () => {
      const middleware = await importMiddleware();
      const response = await middleware(
        new NextRequest('http://localhost:3000/learn/pyspark/theory')
      );
      expect(response.status).toBe(200);
    });

    it('passes through /learn/pyspark/theory/junior?chapter=…', async () => {
      const middleware = await importMiddleware();
      const response = await middleware(
        new NextRequest(
          'http://localhost:3000/learn/pyspark/theory/junior?chapter=module-PS1'
        )
      );
      expect(response.status).toBe(200);
    });
  });

  describe('authenticated user without completed onboarding', () => {
    beforeEach(() => {
      getUserMock.mockResolvedValue({
        data: { user: { id: 'user-2' } }
      });
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [{ onboarding_completed: false }]
      } as Response);
    });

    it('does NOT redirect /learn/pyspark/theory to onboarding (public landing)', async () => {
      const middleware = await importMiddleware();
      const response = await middleware(
        new NextRequest('http://localhost:3000/learn/pyspark/theory')
      );
      expect(response.status).toBe(200);
    });

    it('does NOT redirect /learn/pyspark/theory/junior to onboarding (public level)', async () => {
      const middleware = await importMiddleware();
      const response = await middleware(
        new NextRequest('http://localhost:3000/learn/pyspark/theory/junior')
      );
      expect(response.status).toBe(200);
    });

    it('redirects /learn/pyspark/theory/junior?chapter=… to /onboarding', async () => {
      const middleware = await importMiddleware();
      const response = await middleware(
        new NextRequest(
          'http://localhost:3000/learn/pyspark/theory/junior?chapter=module-PS1'
        )
      );
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/onboarding'
      );
    });

    it('redirects /learn/pyspark/theory/junior?practice=… to /onboarding', async () => {
      const middleware = await importMiddleware();
      const response = await middleware(
        new NextRequest(
          'http://localhost:3000/learn/pyspark/theory/junior?practice=module-PS1'
        )
      );
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/onboarding'
      );
    });

    it('still redirects /home to /onboarding (regression)', async () => {
      const middleware = await importMiddleware();
      const response = await middleware(
        new NextRequest('http://localhost:3000/home')
      );
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/onboarding'
      );
    });
  });
});
