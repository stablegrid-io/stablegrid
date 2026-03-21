'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { StableGridBrand } from '@/components/brand/StableGridLogo';
import { NeuralInput } from '@/components/ui/NeuralInput';
import { shouldHideNav } from './navigation-config';

export const TopBar = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));

  if (hideNav) return null;

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-50 flex justify-between items-center px-6 h-14 bg-[#0c0e10]/80 backdrop-blur-xl border-b border-[#99f7ff]/10 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
      <div className="flex items-center gap-4">
        <Link href="/home">
          <StableGridBrand className="text-xl" />
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {/* Search (visual only for now) */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Search className="h-3 w-3 text-primary/40" />
          </div>
          <NeuralInput
            placeholder="Search..."
            className="w-48"
          />
        </div>

        <div className="flex gap-4 items-center">
          <Link
            href="/settings"
            className="text-slate-500 hover:text-[#99f7ff] transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
