'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, Brain, Clock3, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const DURATION_MS = 4000;

const METHOD_META: Record<string, { label: string; icon: typeof Zap }> = {
  sprint: { label: 'Sprint', icon: Zap },
  pomodoro: { label: 'Pomodoro', icon: Clock3 },
  'deep-focus': { label: 'Deep Focus', icon: Brain },
  'free-read': { label: 'Free Read', icon: BookOpen }
};

interface SessionEndedToastProps {
  methodId: string;
  focusElapsedSeconds: number;
  plannedFocusMinutes: number;
  onDismiss: () => void;
}

const formatClock = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const SessionEndedToast = ({
  methodId,
  focusElapsedSeconds,
  plannedFocusMinutes,
  onDismiss
}: SessionEndedToastProps) => {
  const meta = METHOD_META[methodId] ?? METHOD_META['free-read'];
  const Icon = meta.icon;
  const isFreeRead = methodId === 'free-read' || plannedFocusMinutes <= 0;

  const plannedSeconds = plannedFocusMinutes * 60;
  const completionPct = isFreeRead
    ? null
    : Math.min(100, Math.round((focusElapsedSeconds / Math.max(1, plannedSeconds)) * 100));

  const isCongrats = isFreeRead || (completionPct !== null && completionPct >= 100);
  const eyebrowSuffix = isFreeRead ? 'Ended' : isCongrats ? 'Complete' : 'Ended early';
  const headline = isCongrats ? 'Energy banked.' : 'Off the grid for now.';
  const subline = isCongrats
    ? 'Session complete — onward.'
    : 'Come back when you’re charged.';

  const [progressActive, setProgressActive] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const startId = window.requestAnimationFrame(() => setProgressActive(true));
    const dismissId = window.setTimeout(() => onDismissRef.current(), DURATION_MS);
    return () => {
      window.cancelAnimationFrame(startId);
      window.clearTimeout(dismissId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto w-[min(34rem,100%)]"
      >
        <div className="relative overflow-hidden border border-on-surface/15 bg-surface shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
          {/* Top accent line */}
          <div
            aria-hidden
            className={`absolute top-0 inset-x-0 h-[2px] ${
              isCongrats ? 'bg-primary' : 'bg-on-surface/30'
            }`}
          />

          {/* Dismiss */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-7 pt-8 pb-7">
            {/* Method badge */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="flex h-7 w-7 items-center justify-center border border-on-surface/15">
                <Icon className="h-3.5 w-3.5 text-on-surface" strokeWidth={1.5} />
              </span>
              <span className="font-data-mono text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface">
                {meta.label} &middot;{' '}
                <span className={isCongrats ? 'text-primary' : 'text-on-surface-variant'}>
                  {eyebrowSuffix}
                </span>
              </span>
            </div>

            {/* Stats — two-column compact grid */}
            <div className="grid grid-cols-2 gap-3 max-w-[24rem] mx-auto mb-6">
              <div className="border border-surface-dim px-4 py-3 text-center">
                <div className="font-data-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant mb-1">
                  Focus logged
                </div>
                <div className="font-serif text-[20px] tabular-nums text-on-surface">
                  {formatClock(focusElapsedSeconds)}
                </div>
              </div>

              <div className="border border-surface-dim px-4 py-3 text-center">
                <div className="font-data-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant mb-1">
                  {isFreeRead ? 'Planned' : 'Of planned'}
                </div>
                <div
                  className={`font-serif text-[20px] tabular-nums ${
                    isCongrats ? 'text-primary' : 'text-on-surface'
                  }`}
                >
                  {isFreeRead ? '—' : `${completionPct}%`}
                </div>
              </div>
            </div>

            {/* Headline */}
            <p className="text-center font-serif text-[18px] text-on-surface mb-1">
              {headline}
            </p>
            {/* Subline */}
            <p className="text-center font-body text-[13px] text-on-surface-variant">
              {subline}
            </p>
          </div>

          {/* Drain bar — fills full, then collapses left → right over the dismiss window */}
          <div
            aria-hidden
            className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden bg-on-surface/[0.06]"
          >
            <div
              className={`h-full w-full ${isCongrats ? 'bg-primary' : 'bg-on-surface/40'}`}
              style={{
                transformOrigin: 'right center',
                transform: progressActive ? 'scaleX(0)' : 'scaleX(1)',
                transition: `transform ${DURATION_MS}ms linear`
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
