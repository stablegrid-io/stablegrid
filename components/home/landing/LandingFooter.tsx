'use client';

import Link from 'next/link';
import { StableGridWordmark } from '@/components/brand/StableGridLogo';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';
import { openCookiePreferencesDialog } from '@/lib/cookies/cookie-consent';

const FOOTER_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Support', href: '/support' },
  { label: 'Sign in', href: '/login' }
] as const;

export const LandingFooter = () => {
  const handleBackToTop = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === 'undefined') return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const main = document.querySelector('main');
    if (main && main instanceof HTMLElement) {
      main.focus({ preventScroll: true });
    }
  };

  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      className="border-t border-white/20 py-12"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <Link href="/" aria-label="stablegrid home">
            <StableGridWordmark
              size="sm"
              iconClassName="bg-gradient-to-br from-[#171d1b] to-[#0d1110] text-grid-glow-bright shadow-[0_0_0_1px_rgba(121,208,171,0.22),0_10px_22px_-14px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.05)]"
              titleClassName="text-[#f3f7f4]"
            />
          </Link>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/80">
            {FOOTER_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (item.label === 'Sign in') {
                      void trackProductEvent('landing_cta', {
                        source: 'footer_signin'
                      });
                    }
                  }}
                  className="rounded-sm transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grid-glow"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={openCookiePreferencesDialog}
                className="rounded-sm transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grid-glow"
              >
                Cookie settings
              </button>
            </li>
            <li>
              <a
                href="#top"
                onClick={handleBackToTop}
                className="rounded-sm transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grid-glow"
              >
                Back to top
              </a>
            </li>
          </ul>
        </nav>

        <p className="text-xs text-white/80">&copy; 2026 stablegrid.io</p>
      </div>
    </footer>
  );
};
