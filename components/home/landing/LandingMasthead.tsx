'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandCell } from '@/components/brand/BrandCell';

interface LandingMastheadProps {
  // Kept for API compatibility; not currently rendered in the masthead now
  // that the bar shows the cover tagline instead of issue metadata.
  issueDate?: string;
}

/**
 * Sticky top masthead that's hidden on the first viewport (the cover) and
 * slides into view once the reader has scrolled past it. Uses a coarse
 * 70%-of-viewport threshold so the bar appears when the cover is mostly
 * out of frame, not at the first pixel of scroll.
 */
export function LandingMasthead(_props: LandingMastheadProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.7);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      aria-hidden={!visible}
      className={`fixed top-0 left-0 right-0 z-40 bg-surface border-b-2 border-on-surface transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-3 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
          <BrandCell size={20} marker="self" className="shrink-0" />
          <span className="font-serif text-[16px] sm:text-[18px] lowercase tracking-tight text-on-surface flex flex-col sm:block leading-tight">
            <span>
              stable<span className="text-primary">grid</span>
              <span className="text-on-surface-variant">.io</span>
            </span>
            {/* Mobile-only tagline — replaces the hidden lg+ italic on
                phones so users see *what* the site is, not just the wordmark.
                Truncates on the rare narrow phone instead of wrapping. */}
            <span className="lg:hidden font-data-mono uppercase text-[9px] tracking-[0.16em] text-on-surface-variant truncate">
              Learn PySpark
            </span>
          </span>
        </Link>
        <span className="hidden lg:inline-flex items-baseline gap-2 min-w-0 truncate font-serif italic text-[15px] text-on-surface-variant">
          <span className="truncate">
            Handle big data with ease — learn{' '}
            <span className="text-primary not-italic">PySpark</span>.
          </span>
        </span>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary border border-primary hover:bg-primary-dim hover:border-primary-dim transition-colors font-data-mono uppercase text-[11px] tracking-wider shrink-0"
        >
          Sign in <span aria-hidden>→</span>
        </Link>
      </div>
    </header>
  );
}
