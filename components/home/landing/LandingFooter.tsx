'use client';

import Link from 'next/link';
import { StableGridWordmark } from '@/components/brand/StableGridLogo';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';
import { openCookiePreferencesDialog } from '@/lib/cookies/cookie-consent';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-[#1a2a22] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <StableGridWordmark
            size="sm"
            titleClassName="text-[#e3efe8]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#6f8f7d]">
          {[
            { label: 'Journey', href: '#grid-flow' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Support', href: '/support' },
            { label: 'Login', href: '/login' },
            { label: 'Start free', href: '/signup' }
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
              className="transition-colors hover:text-[#9ab8a9]"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={openCookiePreferencesDialog}
            className="transition-colors hover:text-[#9ab8a9]"
          >
            Cookie settings
          </button>
        </div>

        <p className="text-xs text-[#6f8f7d]">(c) 2026 StableGrid.io</p>
      </div>
    </footer>
  );
};
