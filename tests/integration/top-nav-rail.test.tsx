import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
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
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    currentPathname = '/';
    cleanup();
  });

  it('renders the desktop rail in default mode on regular pages', () => {
    render(<TopNav />);

    const rail = screen.getByTestId('desktop-nav-rail');
    expect(rail).toHaveAttribute('data-nav-mode', 'default');
    expect(within(rail).getByText('stableGrid')).toBeInTheDocument();
    expect(within(rail).queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Rail')).not.toBeInTheDocument();
    expect(within(rail).getByTestId('desktop-nav-brand-divider')).toBeInTheDocument();
    expect(within(rail).getByTestId('desktop-nav-divider')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-nav-actions').className).toContain('justify-center');
    expect(screen.getAllByTestId('user-menu')).toHaveLength(2);
    expect(
      screen.getAllByTestId('user-menu').some((node) => node.getAttribute('data-placement') === 'right')
    ).toBe(true);
    expect(
      screen.getAllByTestId('user-menu').some((node) => node.getAttribute('data-appearance') === 'rail')
    ).toBe(true);
  });

  it('compresses the desktop rail when a theory lesson page is open', () => {
    currentPathname = '/learn/pyspark/theory/full-stack';

    render(<TopNav />);

    expect(screen.getByTestId('desktop-nav-rail')).toHaveAttribute('data-nav-mode', 'lesson');
    expect(
      screen.getAllByTestId('user-menu').some((node) => node.getAttribute('data-align') === 'start')
    ).toBe(true);
    expect(
      screen.getAllByTestId('user-menu').some((node) => node.getAttribute('data-placement') === 'right')
    ).toBe(true);
    expect(
      screen.getAllByTestId('user-menu').some((node) => node.getAttribute('data-appearance') === 'rail')
    ).toBe(true);
  });
});
