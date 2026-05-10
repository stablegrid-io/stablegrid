'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, Brain, Clock3, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const DURATION_MS = 2000;

const METHOD_META: Record<string, { label: string; icon: typeof Zap }> = {
  sprint: { label: 'Sprint', icon: Zap },
  pomodoro: { label: 'Pomodoro', icon: Clock3 },
  'deep-focus': { label: 'Deep Focus', icon: Brain },
  'free-read': { label: 'Free Read', icon: BookOpen }
};

interface SessionStartedToastProps {
  methodId: string;
  focusMinutes: number;
  breakMinutes: number;
  onDismiss: () => void;
}

const formatDuration = (focus: number, brk: number) => {
  if (!focus) return 'Untimed · read at your own pace';
  if (!brk) return `${focus} min focus`;
  return `${focus} min focus · ${brk} min break`;
};

export const SessionStartedToast = ({
  methodId,
  focusMinutes,
  breakMinutes,
  onDismiss
}: SessionStartedToastProps) => {
  const meta = METHOD_META[methodId] ?? METHOD_META['free-read'];
  const Icon = meta.icon;
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
        <div className="relative overflow-hidden border border-on-surface bg-surface shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
          {/* Top accent line */}
          <div aria-hidden className="absolute top-0 inset-x-0 h-[2px] bg-primary" />

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
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="flex h-7 w-7 items-center justify-center border border-on-surface">
                <Icon className="h-3.5 w-3.5 text-on-surface" strokeWidth={1.5} />
              </span>
              <span className="font-data-mono text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface">
                {meta.label} &middot; <span className="text-primary">Started</span>
              </span>
            </div>

            {/* Duration */}
            <p className="text-center font-data-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant mb-5">
              {formatDuration(focusMinutes, breakMinutes)}
            </p>

            {/* Wish */}
            <p className="text-center font-serif text-[18px] text-on-surface">
              Good luck &mdash; stay focused.
            </p>
          </div>

          {/* Countdown bar — fills left → right over 2s, then dismisses */}
          <div
            aria-hidden
            className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden bg-on-surface/[0.06]"
          >
            <div
              className="h-full w-full bg-primary"
              style={{
                transformOrigin: 'left center',
                transform: progressActive ? 'scaleX(1)' : 'scaleX(0)',
                transition: `transform ${DURATION_MS}ms linear`
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
