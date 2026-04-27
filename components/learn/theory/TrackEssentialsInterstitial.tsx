'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { TrackEssentialsPanel } from '@/components/learn/theory/TrackEssentialsPanel';

const COOKIE_NAME = 'seenTrackEssentials';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

interface TrackEssentialsInterstitialProps {
  topic: string;
  tier: string;
  trackSlug: string;
  trackLabel: string;
  accentColor: string;
  accentRgb: string;
  /** Where the back arrow goes (gallery). */
  backHref: string;
  /** Where Continue takes the user (the actual tree map). */
  continueHref: string;
}

const readSeenSlugs = (): Set<string> => {
  if (typeof document === 'undefined') return new Set();
  const match = document.cookie.match(/(?:^|;\s*)seenTrackEssentials=([^;]*)/);
  if (!match) return new Set();
  return new Set(decodeURIComponent(match[1]).split(',').filter(Boolean));
};

const writeSeenSlugs = (slugs: Set<string>) => {
  const value = Array.from(slugs).join(',');
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
};

export const TrackEssentialsInterstitial = ({
  topic,
  tier,
  trackSlug,
  trackLabel,
  accentColor,
  accentRgb,
  backHref,
  continueHref,
}: TrackEssentialsInterstitialProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);
  const cookieKey = `${topic}:${trackSlug}`;

  const handleContinue = () => {
    setClicked(true);
    const seen = readSeenSlugs();
    seen.add(cookieKey);
    writeSeenSlugs(seen);
    // Best-effort cross-device sync. Cookie write above is the synchronous
    // source of truth for this navigation; the POST persists for other devices.
    void fetch('/api/learn/track-essentials', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ topic, trackSlug }),
      cache: 'no-store',
    }).catch(() => {
      /* tolerated — cookie still suppresses on this device */
    });
    startTransition(() => {
      router.replace(continueHref);
      router.refresh();
    });
  };

  const busy = clicked || isPending;

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href={backHref}
          className="mb-8 inline-flex items-center gap-2 font-mono font-medium text-[11px] text-on-surface-variant/80 hover:text-on-surface transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="h-4 w-4" />
          Track Selection
        </Link>

        <div
          className="text-center mb-8"
          style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) forwards' }}
        >
          <div
            className="inline-block w-10 h-1.5 mb-6 rounded-full"
            style={{ backgroundColor: accentColor, boxShadow: `0 0 12px rgba(${accentRgb},0.5)` }}
          />
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-on-surface">
            {trackLabel}
          </h1>
          <p
            className="mt-3 font-mono font-medium text-[12px] tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Read this once, then you&apos;re in
          </p>
        </div>
        <div
          aria-hidden="true"
          className="h-px w-full mb-10 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />

        <TrackEssentialsPanel
          topic={topic}
          tier={tier}
          accentColor={accentColor}
          accentRgb={accentRgb}
        />

        <div
          className="flex flex-col items-center gap-4 mt-2"
          style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 200ms forwards' }}
        >
          <button
            type="button"
            onClick={handleContinue}
            disabled={busy}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[13px] font-semibold tracking-tight transition-all disabled:opacity-60 disabled:cursor-wait"
            style={{
              backgroundColor: accentColor,
              color: '#0a0c0e',
              boxShadow: `0 0 24px rgba(${accentRgb},0.35)`,
            }}
          >
            {busy ? 'Loading…' : 'Continue to learning path'}
            {!busy && (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
