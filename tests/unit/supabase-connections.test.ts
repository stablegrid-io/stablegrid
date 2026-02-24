import { beforeEach, describe, expect, it, vi } from 'vitest';

const createBrowserClientMock = vi.fn((..._args: unknown[]) => ({ kind: 'browser' }));
const createServerClientMock = vi.fn((..._args: unknown[]) => ({ kind: 'server' }));

const cookieStore = {
  get: vi.fn(),
  set: vi.fn()
};

const cookiesMock = vi.fn(() => cookieStore);
const nextCookiesSetMock = vi.fn();
const nextResponseNextMock = vi.fn(() => ({
  cookies: {
    set: nextCookiesSetMock
  }
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: createBrowserClientMock,
  createServerClient: createServerClientMock
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock
}));

vi.mock('next/server', () => ({
  NextResponse: {
    next: nextResponseNextMock
  }
}));

describe('supabase connection factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('creates browser Supabase client when env vars exist', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    const { createClient } = await import('@/lib/supabase/client');
    const client = createClient();

    expect(createBrowserClientMock).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'anon-key'
    );
    expect(client).toEqual({ kind: 'browser' });
  });

  it('throws for browser client when env vars are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    const { createClient } = await import('@/lib/supabase/client');

    expect(() => createClient()).toThrow('Missing Supabase environment variables.');
  });

  it('creates server Supabase client with cookie adapter', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    cookieStore.get.mockReturnValue({ value: 'cookie-value' });

    const { createClient } = await import('@/lib/supabase/server');
    const client = createClient();

    expect(cookiesMock).toHaveBeenCalledTimes(1);
    expect(createServerClientMock).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'anon-key',
      expect.objectContaining({
        cookies: expect.any(Object)
      })
    );
    expect(client).toEqual({ kind: 'server' });

    const lastCreateServerCall = createServerClientMock.mock.calls.at(-1) as
      | unknown[]
      | undefined;
    const adapter = (
      lastCreateServerCall?.[2] as
        | {
            cookies: {
              get: (name: string) => string | undefined;
              set: (name: string, value: string, options?: Record<string, unknown>) => void;
              remove: (name: string, options?: Record<string, unknown>) => void;
            };
          }
        | undefined
    )?.cookies;
    if (!adapter) {
      throw new Error('Expected cookie adapter');
    }
    expect(adapter.get('sb-token')).toBe('cookie-value');
    adapter.set('sb-token', 'new-value', { path: '/' });
    adapter.remove('sb-token', { path: '/' });

    expect(cookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sb-token', value: 'new-value' })
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sb-token', value: '' })
    );
  });

  it('creates middleware Supabase client with request/response cookies', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    const request = {
      headers: new Headers({ 'x-test': '1' }),
      cookies: {
        get: vi.fn().mockReturnValue({ value: 'request-cookie' })
      }
    } as any;

    const { createMiddlewareClient } = await import('@/lib/supabase/middleware');
    const { supabase, response } = createMiddlewareClient(request);

    expect(nextResponseNextMock).toHaveBeenCalledTimes(1);
    expect(createServerClientMock).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'anon-key',
      expect.objectContaining({
        cookies: expect.any(Object)
      })
    );
    expect(supabase).toEqual({ kind: 'server' });
    expect(response).toEqual({
      cookies: {
        set: nextCookiesSetMock
      }
    });

    const lastCreateServerCall = createServerClientMock.mock.calls.at(-1) as
      | unknown[]
      | undefined;
    const adapter = (
      lastCreateServerCall?.[2] as
        | {
            cookies: {
              get: (name: string) => string | undefined;
              set: (name: string, value: string, options?: Record<string, unknown>) => void;
              remove: (name: string, options?: Record<string, unknown>) => void;
            };
          }
        | undefined
    )?.cookies;
    if (!adapter) {
      throw new Error('Expected cookie adapter');
    }
    expect(adapter.get('sb-token')).toBe('request-cookie');

    adapter.set('sb-token', 'middleware-value', { path: '/' });
    adapter.remove('sb-token', { path: '/' });

    expect(nextCookiesSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sb-token', value: 'middleware-value' })
    );
    expect(nextCookiesSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sb-token', value: '' })
    );
  });

  it('throws for middleware client when env vars are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    const request = {
      headers: new Headers(),
      cookies: {
        get: vi.fn()
      }
    } as any;

    const { createMiddlewareClient } = await import('@/lib/supabase/middleware');

    expect(() => createMiddlewareClient(request)).toThrow(
      'Missing Supabase environment variables.'
    );
  });
});
