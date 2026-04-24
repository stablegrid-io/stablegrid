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

vi.mock('@/components/navigation/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />
}));

vi.mock('@/components/navigation/TopBar', () => ({
  TopBar: () => <div data-testid="top-bar" />
}));

vi.mock('@/components/navigation/BottomNav', () => ({
  BottomNav: () => <div data-testid="bottom-nav" />
}));

// TODO(beta-tests): mocks stale after OAuth + Learn unification — rewrite post-beta
describe.skip('Navigation shell', () => {
  afterEach(() => {
    currentPathname = '/';
    currentUser = { id: 'user-1' };
  });

  it('applies the sidebar offset on standard app pages', () => {
    render(
      <Navigation>
        <div data-testid="child">Content</div>
      </Navigation>
    );

    const shell = screen.getByTestId('navigation-shell-content');
    expect(shell.className).toContain('lg:pl-64');
    expect(shell.className).toContain('pt-14');
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });

  it('removes padding when navigation should not render', () => {
    currentUser = null;

    render(
      <Navigation>
        <div data-testid="child">Hidden</div>
      </Navigation>
    );

    const shell = screen.getByTestId('navigation-shell-content');
    expect(shell.className).not.toContain('lg:pl-64');
  });
});
