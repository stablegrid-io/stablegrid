'use client';

import { Suspense, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useReadingModeStore } from '@/lib/stores/useReadingModeStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { UnifiedMiniPlayer } from '@/components/session/UnifiedMiniPlayer';
import { LandingFooter } from '@/components/home/landing/LandingFooter';
import {
  hasCustomBackground,
  isCompactDesktopNavPath,
  isPracticeSessionPath,
  isTheoryLessonPath,
  shouldHideNav,
  shouldShowLandingFooter
} from './navigation-config';

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
  const customBackground = hasCustomBackground(pathname);

  const isTheoryPage = pathname.includes('/theory/') && !isPracticePage;
  const hideForFocus = focusMode && (isTheoryPage || isPracticePage);
  // Hide the TopBar on lesson + practice-session pages so the reading /
  // coding surface gets the full vertical space. The Sidebar still
  // shows (provides nav back out); the TopBar is just chrome on these
  // pages and the in-page header already carries the title + actions.
  const isImmersiveSurface =
    isTheoryLessonPath(pathname) || isPracticeSessionPath(pathname, search);
  const hideTopBar = hideForFocus || isImmersiveSurface;
  const showLandingFooter = !hideForFocus && shouldShowLandingFooter(pathname);

  return (
    <>
      {/* Background overlays — skipped on pages that provide their own full-bleed imagery (hideNav or customBackground). */}
      {!hideForFocus && !hideNav && !customBackground && (
        <div className="fixed inset-0 scanline pointer-events-none z-0 opacity-20" />
      )}

      {!hideForFocus && <Sidebar />}
      {!hideTopBar && <TopBar />}

      <div
        data-testid="navigation-shell-content"
        className={`pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0 transition-[padding,margin] duration-200 ${
          hideForFocus
            ? '!p-0 !m-0'
            : hideNav
              ? ''
              : isCompact
                ? `lg:ml-16${hideTopBar ? '' : ' pt-14'}`
                : `lg:ml-48${hideTopBar ? '' : ' pt-14'}`
        }`}
        style={{ isolation: 'isolate' }}
      >
        {children}
        {showLandingFooter && <LandingFooter />}
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
