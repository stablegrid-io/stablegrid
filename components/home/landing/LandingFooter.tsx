'use client';

import Link from 'next/link';
import { StableGridWordmark } from '@/components/brand/StableGridLogo';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';
import { openCookiePreferencesDialog } from '@/lib/cookies/cookie-consent';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-white/20 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <StableGridWordmark
            size="sm"
            iconClassName="bg-gradient-to-br from-[#171d1b] to-[#0d1110] text-[#79d0ab] shadow-[0_0_0_1px_rgba(121,208,171,0.22),0_10px_22px_-14px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.05)]"
            titleClassName="text-[#f3f7f4]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
          {[
            { label: 'Journey', href: '#grid-flow' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Support', href: '/support' },
            { label: 'Login', href: '/login' },
            { label: 'Start free', href: '/login' }
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                if (item.href === '/signup') {
                  void trackProductEvent('landing_cta', {
                    source: 'footer_primary'
                  });
                }
              }}
              className="transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={openCookiePreferencesDialog}
            className="transition-colors hover:text-white"
          >
            Cookie settings
          </button>
        </div>

        <p className="text-xs text-white/80">(c) 2026 stableGrid.io</p>
      </div>
    </footer>
  );
};
