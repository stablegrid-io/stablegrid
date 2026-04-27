'use client';

import { useEffect, useState } from 'react';
import type { TheoryChapter } from '@/types/theory';

interface CheckpointInterstitialProps {
  chapter: TheoryChapter;
  /** Total questions in the upcoming checkpoint, for the status footer. */
  questionCount: number;
  /**
   * Called when the user presses Skip / Enter / Space / Escape, or
   * automatically when prefers-reduced-motion is set. Omit to render the
   * interstitial without a skip affordance (legacy callers).
   */
  onSkip?: () => void;
}

const STATUS_LINES = [
  'scanning question bank',
  'shuffling order',
  'calibrating threshold',
  'preparing checkpoint',
];

const STATUS_INTERVAL_MS = 480;

const stripModulePrefix = (title: string) =>
  title.replace(/^module\s*\d+\s*:\s*/i, '').trim();

export function CheckpointInterstitial({
  chapter,
  questionCount,
  onSkip,
}: CheckpointInterstitialProps) {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_LINES.length);
    }, STATUS_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  // Auto-skip for users who opted out of motion. The animated loader has no
  // informational value for them, and a 3s wait with no signal of progress is
  // an accessibility regression for that audience.
  useEffect(() => {
    if (!onSkip) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) onSkip();
  }, [onSkip]);

  // Keyboard: Space / Enter / Escape all skip the interstitial.
  useEffect(() => {
    if (!onSkip) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSkip]);

  const moduleNumber = String(chapter.number).padStart(2, '0');
  const title = stripModulePrefix(chapter.title) || chapter.title;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#0a0c0e', color: '#ffffff' }}
      role="status"
      aria-live="polite"
    >
      {/* Subtle radial vignette for depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 55%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 65%)',
        }}
      />

      <div
        className="relative flex flex-col items-center text-center"
        style={{ opacity: 0, animation: 'sg-checkpoint-fade .35s ease-out forwards' }}
      >
        {/* Module eyebrow */}
        <span className="font-mono text-[10px] font-bold tracking-[0.32em] uppercase text-white/40 mb-4">
          Module {moduleNumber} · Checkpoint
        </span>

        {/* Module title */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-12 max-w-xl px-4">
          {title}
        </h1>

        {/* Loader — 3×3 grid, L-charge sequence, white */}
        <svg
          className="sg-checkpoint-loader"
          viewBox="0 0 100 100"
          width="96"
          height="96"
          aria-hidden="true"
        >
          <g fill="none" stroke="#ffffff" strokeWidth="2.5">
            <rect x="15" y="15" width="22" height="22" rx="3" />
            <rect x="41" y="15" width="22" height="22" rx="3" />
            <rect x="67" y="15" width="22" height="22" rx="3" />
            <rect x="15" y="41" width="22" height="22" rx="3" />
            <rect className="sg-empty" x="41" y="41" width="22" height="22" rx="3" />
            <rect className="sg-empty" x="67" y="41" width="22" height="22" rx="3" />
            <rect className="sg-empty" x="15" y="67" width="22" height="22" rx="3" />
            <rect className="sg-empty" x="41" y="67" width="22" height="22" rx="3" />
            <rect className="sg-empty" x="67" y="67" width="22" height="22" rx="3" />
          </g>
          <g fill="#ffffff">
            <rect className="sg-f0" x="19" y="19" width="14" height="14" rx="2" opacity="0" />
            <rect className="sg-f1" x="45" y="19" width="14" height="14" rx="2" opacity="0" />
            <rect className="sg-f2" x="71" y="19" width="14" height="14" rx="2" opacity="0" />
            <rect className="sg-f3" x="19" y="45" width="14" height="14" rx="2" opacity="0" />
          </g>
        </svg>

        {/* Rotating status line */}
        <div className="mt-10 h-5 flex items-center justify-center">
          <span className="font-mono text-[12px] tracking-[0.04em] text-white/55">
            <span className="text-white/35 mr-2">&gt;</span>
            <span key={statusIdx} className="sg-checkpoint-status">
              {STATUS_LINES[statusIdx]}
            </span>
          </span>
        </div>

        {/* Footer mono caption */}
        <p className="mt-3 font-mono text-[10px] tracking-[0.28em] uppercase text-white/25">
          {questionCount} questions · 90% to pass
        </p>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white/75 hover:bg-white/[0.04] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
            aria-label="Skip intro and start checkpoint"
          >
            Skip intro
            <span className="text-white/25">·</span>
            <kbd className="font-sans text-[9px] text-white/35">Space</kbd>
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes sg-checkpoint-fade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sg-checkpoint-fill {
          0%, 92%, 100% { opacity: 0; }
          18%, 70%      { opacity: 1; }
        }
        @keyframes sg-checkpoint-breathe {
          0%, 100% { opacity: 0.18; }
          50%      { opacity: 0.32; }
        }
        @keyframes sg-checkpoint-status-in {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sg-checkpoint-loader .sg-f0 { animation: sg-checkpoint-fill 2.4s infinite ease-in-out; animation-delay: 0s; }
        .sg-checkpoint-loader .sg-f1 { animation: sg-checkpoint-fill 2.4s infinite ease-in-out; animation-delay: 0.15s; }
        .sg-checkpoint-loader .sg-f2 { animation: sg-checkpoint-fill 2.4s infinite ease-in-out; animation-delay: 0.3s; }
        .sg-checkpoint-loader .sg-f3 { animation: sg-checkpoint-fill 2.4s infinite ease-in-out; animation-delay: 0.45s; }
        .sg-checkpoint-loader .sg-empty { animation: sg-checkpoint-breathe 2.4s infinite ease-in-out; }
        .sg-checkpoint-status { animation: sg-checkpoint-status-in .25s ease-out; display: inline-block; }
      `}</style>
    </div>
  );
}
