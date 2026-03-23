'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { StableGridBrand } from '@/components/brand/StableGridLogo';
import { isCompactDesktopNavPath, shouldHideNav } from './navigation-config';

export const TopBar = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const isCompact = isCompactDesktopNavPath(pathname);

  if (hideNav) return null;

  return (
    <header className={`fixed top-0 right-0 left-0 z-50 flex items-center justify-between h-14 px-6 bg-[#0c0e10]/70 backdrop-blur-2xl border-b border-white/[0.06] transition-[left] duration-200 ${
      isCompact ? 'lg:left-16' : 'lg:left-48'
    }`}>
      {/* Left: Brand */}
      <Link href="/home" className="flex items-center">
        <StableGridBrand className="text-xl" />
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <div className="flex items-center gap-2 h-8 rounded-lg bg-white/[0.06] px-3 text-[13px] text-on-surface-variant/50 transition-colors hover:bg-white/[0.09] cursor-pointer">
            <Search className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Search</span>
            <kbd className="hidden lg:inline-flex ml-4 h-5 items-center rounded bg-white/[0.06] px-1.5 font-mono text-[10px] text-on-surface-variant/40">⌘K</kbd>
          </div>
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant/50 transition-colors hover:bg-white/[0.06] hover:text-on-surface-variant"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
};
