import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Navigation } from '@/components/navigation/Navigation';

let currentPathname = '/';
let currentUser: { id: string } | null = { id: 'user-1' };

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname
}));

vi.mock('@/lib/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: currentUser
  })
}));

vi.mock('@/components/navigation/TopNav', () => ({
  TopNav: () => <div data-testid="top-nav" />
}));

vi.mock('@/components/navigation/BottomNav', () => ({
  BottomNav: () => <div data-testid="bottom-nav" />
}));

describe('Navigation shell', () => {
  afterEach(() => {
    currentPathname = '/';
    currentUser = { id: 'user-1' };
  });

  it('applies the default desktop rail offset on standard app pages', () => {
    render(
      <Navigation>
        <div data-testid="child">Content</div>
      </Navigation>
    );

    const shell = screen.getByTestId('navigation-shell-content');
    expect(shell).toHaveAttribute('data-nav-mode', 'default');
    expect(shell.className).toContain('lg:pl-[9rem]');
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });

  it('switches to compact lesson spacing when a theory lesson is open', () => {
    currentPathname = '/learn/pyspark/theory/full-stack';

    render(
      <Navigation>
        <div data-testid="child">Lesson</div>
      </Navigation>
    );

    const shell = screen.getByTestId('navigation-shell-content');
    expect(shell).toHaveAttribute('data-nav-mode', 'lesson');
    expect(shell.className).toContain('lg:pl-[6.35rem]');
  });

  it('marks the shell as hidden when navigation should not render', () => {
    currentUser = null;

    render(
      <Navigation>
        <div data-testid="child">Hidden</div>
      </Navigation>
    );

    const shell = screen.getByTestId('navigation-shell-content');
    expect(shell).toHaveAttribute('data-nav-mode', 'hidden');
    expect(shell.className).not.toContain('lg:pl-[9rem]');
  });
});
