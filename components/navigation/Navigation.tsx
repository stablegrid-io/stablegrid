'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { isCompactDesktopNavPath, shouldHideNav } from './navigation-config';

export const Navigation = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const isCompact = isCompactDesktopNavPath(pathname);

  return (
    <>
      {/* Background overlays */}
      <div className="fixed inset-0 grid-overlay pointer-events-none z-0" />
      <div className="fixed inset-0 scanline pointer-events-none z-0 opacity-20" />

      <Sidebar />
      <TopBar />

      <div
        data-testid="navigation-shell-content"
        className={`relative z-10 pb-16 lg:pb-0 transition-[padding] duration-200 ${
          hideNav ? '' : isCompact ? 'lg:pl-16 pt-14' : 'lg:pl-48 pt-14'
        }`}
      >
        {children}
      </div>

      <BottomNav />
    </>
  );
};
