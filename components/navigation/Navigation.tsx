'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { isCompactDesktopNavPath, shouldHideNav } from './navigation-config';

export const Navigation = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const isLessonMode = isCompactDesktopNavPath(pathname);

  return (
    <>
      <TopNav />
      <div
        data-testid="navigation-shell-content"
        data-nav-mode={hideNav ? 'hidden' : isLessonMode ? 'lesson' : 'default'}
        className={`pb-16 transition-[padding] duration-300 lg:pb-0 ${
          hideNav ? '' : isLessonMode ? 'lg:pl-[6.35rem]' : 'lg:pl-[9rem]'
        }`}
      >
        {children}
      </div>
      <BottomNav />
    </>
  );
};
