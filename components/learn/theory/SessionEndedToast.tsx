'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, Brain, Clock3, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const DURATION_MS = 4000;

const METHOD_META: Record<string, { label: string; icon: typeof Zap; rgb: string }> = {
  sprint: { label: 'Sprint', icon: Zap, rgb: '153,247,255' },
  pomodoro: { label: 'Pomodoro', icon: Clock3, rgb: '255,113,108' },
  'deep-focus': { label: 'Deep Focus', icon: Brain, rgb: '191,129,255' },
  'free-read': { label: 'Free Read', icon: BookOpen, rgb: '255,255,255' },
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
  onDismiss,
}: SessionEndedToastProps) => {
  const meta = METHOD_META[methodId] ?? METHOD_META['free-read'];
  const Icon = meta.icon;
  const isFreeRead = methodId === 'free-read' || plannedFocusMinutes <= 0;

  const plannedSeconds = plannedFocusMinutes * 60;
  const completionPct = isFreeRead
    ? null
    : Math.min(100, Math.round((focusElapsedSeconds / Math.max(1, plannedSeconds)) * 100));

  const isCongrats = isFreeRead || (completionPct !== null && completionPct >= 100);
  const eyebrowSuffix = isFreeRead
    ? 'Ended'
    : isCongrats
      ? 'Complete'
      : 'Ended early';
  const headline = isCongrats ? 'Energy banked.' : 'Off the grid for now.';
  const subline = isCongrats
    ? 'Session complete — onward.'
    : "Come back when you’re charged.";

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
        <div
          className="relative overflow-hidden rounded-[24px] border backdrop-blur-2xl"
          style={{
            background: 'rgba(10,12,14,0.94)',
            borderColor: `rgba(${meta.rgb},0.18)`,
            boxShadow: `0 12px 48px rgba(0,0,0,0.55), 0 0 40px rgba(${meta.rgb},0.06)`,
          }}
        >
          {/* Top accent line — softer than the started toast */}
          <div
            className="absolute top-0 inset-x-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent, rgba(${meta.rgb},0.5), transparent)` }}
          />

          {/* Dismiss */}
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-lg text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-7 pt-7 pb-7">
            {/* Method badge */}
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: `rgba(${meta.rgb},0.16)` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: `rgb(${meta.rgb})` }} />
              </div>
              <span
                className="text-[11px] font-mono font-bold uppercase tracking-[0.18em]"
                style={{ color: `rgb(${meta.rgb})` }}
              >
                {meta.label} &middot; {eyebrowSuffix}
              </span>
            </div>

            {/* Stats — two-column compact grid */}
            <div className="grid grid-cols-2 gap-2 max-w-[24rem] mx-auto mb-5">
              <div
                className="px-3 py-2.5 rounded-[12px] text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/35 mb-1">
                  Focus logged
                </div>
                <div className="text-[15px] font-mono font-bold tabular-nums text-white/90">
                  {formatClock(focusElapsedSeconds)}
                </div>
              </div>

              <div
                className="px-3 py-2.5 rounded-[12px] text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/35 mb-1">
                  {isFreeRead ? 'Planned' : 'Of planned'}
                </div>
                <div className="text-[15px] font-mono font-bold tabular-nums" style={{ color: `rgb(${meta.rgb})` }}>
                  {isFreeRead ? '—' : `${completionPct}%`}
                </div>
              </div>
            </div>

            {/* Headline */}
            <p className="text-center text-[16px] font-semibold text-white/95 mb-1">
              {headline}
            </p>
            {/* Subline */}
            <p className="text-center text-[13px] text-white/45">
              {subline}
            </p>
          </div>

          {/* Drain bar — fills full, then collapses left → right over the dismiss window */}
          <div
            aria-hidden
            className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <div
              style={{
                height: '100%',
                width: '100%',
                transformOrigin: 'right center',
                transform: progressActive ? 'scaleX(0)' : 'scaleX(1)',
                transition: `transform ${DURATION_MS}ms linear`,
                background: `linear-gradient(90deg, rgba(${meta.rgb},0.4), rgba(${meta.rgb},0.7))`,
                boxShadow: `0 0 8px rgba(${meta.rgb},0.35)`,
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
