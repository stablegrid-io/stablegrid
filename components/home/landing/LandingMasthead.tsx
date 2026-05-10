'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StableGridMark } from '@/components/brand/StableGridLogo';

interface LandingMastheadProps {
  issueDate: string;
}

/**
 * Sticky top masthead that's hidden on the first viewport (the cover) and
 * slides into view once the reader has scrolled past it. Uses a coarse
 * 70%-of-viewport threshold so the bar appears when the cover is mostly
 * out of frame, not at the first pixel of scroll.
 */
export function LandingMasthead({ issueDate }: LandingMastheadProps) {
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
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <StableGridMark className="h-5 w-5 text-on-surface" />
          <span className="font-serif text-[18px] lowercase tracking-tight text-on-surface">
            stable<span className="text-primary">grid</span>
            <span className="text-on-surface-variant">.io</span>
          </span>
        </Link>
        <span className="hidden lg:inline-flex items-baseline gap-2 min-w-0 truncate font-serif italic text-[15px] text-on-surface-variant">
          <svg
            viewBox="0 0 30 30"
            aria-hidden
            className="text-primary shrink-0 self-center"
            style={{ width: '0.95em', height: '0.95em' }}
          >
            <circle cx="15" cy="15" r="11.2" fill="currentColor" fillOpacity="0.12" />
            <path
              d="M15 7.1L17.2 12.1L22.6 12.6L18.5 16L19.8 21.2L15 18.4L10.2 21.2L11.5 16L7.4 12.6L12.8 12.1L15 7.1Z"
              fill="currentColor"
            />
          </svg>
          <span className="truncate">
            Vol I · Beta · {issueDate}
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
