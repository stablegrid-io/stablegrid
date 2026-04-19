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
      {/* Left: Brand + Slogan */}
      <div className="flex items-center gap-4">
        <Link href="/home" className="flex items-center">
          <StableGridBrand className="text-xl" />
        </Link>
        <span className="hidden lg:block text-[11px] font-medium tracking-wide text-white/70">
          Understanding data is your edge.
        </span>
      </div>

      <div />
    </header>
  );
};
