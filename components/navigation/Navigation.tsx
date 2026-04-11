'use client';

import { Suspense, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useReadingModeStore } from '@/lib/stores/useReadingModeStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { UnifiedMiniPlayer } from '@/components/session/UnifiedMiniPlayer';
import { isCompactDesktopNavPath, isPracticeSessionPath, shouldHideNav } from './navigation-config';

/**
 * Inner shell that reads search params — must be wrapped in Suspense
 * so Next.js can prerender pages that import Navigation statically.
 */
const NavigationShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams ? `?${searchParams.toString()}` : '';
  const { user } = useAuthStore();
  const focusMode = useReadingModeStore((s) => s.focusMode);
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const isPracticePage = isPracticeSessionPath(pathname, search);
  const isCompact = isCompactDesktopNavPath(pathname);

  const isTheoryPage = pathname.includes('/theory/') && !isPracticePage;
  const hideForFocus = focusMode && (isTheoryPage || isPracticePage);

  return (
    <>
      {/* Background overlays */}
      {!hideForFocus && (
        <>
          <div className="fixed inset-0 grid-overlay pointer-events-none z-0" />
          <div className="fixed inset-0 scanline pointer-events-none z-0 opacity-20" />
        </>
      )}

      {!hideForFocus && <Sidebar />}
      {!hideForFocus && <TopBar />}

      <div
        data-testid="navigation-shell-content"
        className={`pb-16 lg:pb-0 transition-[padding,margin] duration-200 ${
          hideForFocus ? '!p-0 !m-0' : hideNav ? '' : isCompact ? 'lg:ml-16 pt-14' : 'lg:ml-48 pt-14'
        }`}
        style={{ isolation: 'isolate' }}
      >
        {children}
      </div>

      {!hideForFocus && <BottomNav />}
      <UnifiedMiniPlayer />
    </>
  );
};

export const Navigation = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<div className="min-h-screen">{children}</div>}>
    <NavigationShell>{children}</NavigationShell>
  </Suspense>
);
