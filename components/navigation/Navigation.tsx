'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { shouldHideNav } from './navigation-config';

export const Navigation = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));

  return (
    <>
      {/* Background overlays */}
      <div className="fixed inset-0 grid-overlay pointer-events-none z-0" />
      <div className="fixed inset-0 scanline pointer-events-none z-0 opacity-20" />

      <Sidebar />
      <TopBar />

      <div
        data-testid="navigation-shell-content"
        className={`relative z-10 pb-16 lg:pb-0 ${hideNav ? '' : 'lg:pl-64 pt-14'}`}
      >
        {children}
      </div>

      <BottomNav />
    </>
  );
};
