'use client';

import Link from 'next/link';
import { StableGridWordmark } from '@/components/brand/StableGridLogo';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

export const LandingNav = () => {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#1e3a2d] bg-[#090b0a]/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <StableGridWordmark
            size="sm"
            titleClassName="text-brand-50"
          />
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0b110e]/88 p-1">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm text-[#9ab8a9] transition-colors hover:text-[#e3efe8]"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            onClick={() => {
              void trackProductEvent('landing_cta', {
                source: 'nav_primary'
              });
            }}
            className="rounded-full bg-[#22b999] px-4 py-2 text-sm font-medium text-[#08110b] transition-colors hover:bg-[#6fe89a]"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
};
