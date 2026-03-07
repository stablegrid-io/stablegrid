'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { StableGridWordmark } from '@/components/brand/StableGridLogo';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

const NAV_ITEMS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Topics', href: '#topics' },
  { label: 'Pricing', href: '#pricing' }
] as const;

export const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#1e3a2d] bg-[#090b0a]/92 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <StableGridWordmark
            size="sm"
            titleClassName="text-brand-50"
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-[#9ab8a9] transition-colors hover:text-[#e3efe8]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-[#9ab8a9] transition-colors hover:text-[#e3efe8] sm:inline-flex"
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
            className="rounded-lg bg-[#22b999] px-4 py-2 text-sm font-medium text-[#08110b] transition-colors hover:bg-[#6fe89a]"
          >
            Start free
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#1f3629] bg-[#0d1410]/90 text-[#e3efe8] transition-colors hover:border-[#2b4f3a] md:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-[#1e3a2d] bg-[#090b0a]/98 px-6 py-4 shadow-2xl md:hidden">
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl border border-transparent px-3 py-3 text-sm font-medium text-[#c8ddd0] transition-colors hover:border-[#1f3629] hover:bg-[#0d1410]"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 border-t border-[#1f3629] pt-4">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-[#9ab8a9] transition-colors hover:text-[#e3efe8]"
            >
              Sign in
            </Link>
            <span className="text-xs text-[#506559]">Jump to any section, then start free.</span>
          </div>
        </div>
      ) : null}
    </nav>
  );
};
