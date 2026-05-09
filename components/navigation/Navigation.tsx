'use client';

import { Suspense, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useReadingModeStore } from '@/lib/stores/useReadingModeStore';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { UnifiedMiniPlayer } from '@/components/session/UnifiedMiniPlayer';
import { LandingFooter } from '@/components/home/landing/LandingFooter';
import {
  isPracticeSessionPath,
  isTheoryLessonPath,
  shouldHideNav,
  shouldShowLandingFooter
} from './navigation-config';

const NavigationShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams ? `?${searchParams.toString()}` : '';
  const { user } = useAuthStore();
  const focusMode = useReadingModeStore((s) => s.focusMode);
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const isPracticePage = isPracticeSessionPath(pathname, search);

  const isTheoryPage = pathname.includes('/theory/') && !isPracticePage;
  const hideForFocus = focusMode && (isTheoryPage || isPracticePage);
  const isImmersiveSurface =
    isTheoryLessonPath(pathname) || isPracticeSessionPath(pathname, search);
  const hideTopBar = hideForFocus || isImmersiveSurface;
  const showLandingFooter = !hideForFocus && shouldShowLandingFooter(pathname);

  return (
    <>
      {!hideTopBar && <TopBar />}

      <div
        data-testid="navigation-shell-content"
        className={`pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0 transition-[padding] duration-200 ${
          hideForFocus
            ? '!p-0 !m-0'
            : hideNav
              ? ''
              : hideTopBar
                ? ''
                : 'pt-16'
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
