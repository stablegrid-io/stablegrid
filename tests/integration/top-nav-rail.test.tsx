import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TopNav } from '@/components/navigation/TopNav';

let currentPathname = '/';
const prefetchMock = vi.fn();

vi.mock('next/dynamic', () => ({
  default: () => {
    return function MockUserMenu(props: {
      align?: 'start' | 'end';
      placement?: 'bottom' | 'right';
      appearance?: 'default' | 'rail';
    }) {
      return (
        <div
          data-testid="user-menu"
          data-align={props.align ?? 'end'}
          data-placement={props.placement ?? 'bottom'}
          data-appearance={props.appearance ?? 'default'}
        />
      );
    };
  }
}));

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({
    prefetch: prefetchMock
  })
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock('@/lib/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1' }
  })
}));

describe('TopNav desktop rail', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    prefetchMock.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        if (url.endsWith('/api/admin/access')) {
          return new Response(JSON.stringify({ data: { enabled: false } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (url.endsWith('/api/profile/avatar')) {
          return new Response(JSON.stringify({ data: { avatarUrl: null } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    currentPathname = '/';
    cleanup();
  });

  it('renders the desktop rail in default mode on regular pages', () => {
    render(<TopNav />);

    const rail = screen.getByTestId('desktop-nav-rail');
    expect(rail).toHaveAttribute('data-nav-mode', 'default');
    expect(screen.queryByText('Rail')).not.toBeInTheDocument();
    expect(screen.getByTestId('desktop-nav-actions').className).toContain('justify-center');
    expect(screen.getAllByTestId('user-menu').length).toBeGreaterThan(0);
  });

  it('compresses the desktop rail when a theory lesson page is open', () => {
    currentPathname = '/learn/pyspark/theory/full-stack';

    render(<TopNav />);

    expect(screen.getByTestId('desktop-nav-rail')).toHaveAttribute('data-nav-mode', 'lesson');
    expect(screen.getAllByTestId('user-menu').length).toBeGreaterThan(0);
  });
});
