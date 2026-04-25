'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, Brain, Clock3, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const DURATION_MS = 2000;

const METHOD_META: Record<string, { label: string; icon: typeof Zap; rgb: string }> = {
  sprint: { label: 'Sprint', icon: Zap, rgb: '153,247,255' },
  pomodoro: { label: 'Pomodoro', icon: Clock3, rgb: '255,113,108' },
  'deep-focus': { label: 'Deep Focus', icon: Brain, rgb: '191,129,255' },
  'free-read': { label: 'Free Read', icon: BookOpen, rgb: '255,255,255' },
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
  onDismiss,
}: SessionStartedToastProps) => {
  const meta = METHOD_META[methodId] ?? METHOD_META['free-read'];
  const Icon = meta.icon;
  const [progressActive, setProgressActive] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    // Start the bar fill on the next frame so the CSS transition kicks in.
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
            borderColor: `rgba(${meta.rgb},0.22)`,
            boxShadow: `0 12px 48px rgba(0,0,0,0.55), 0 0 40px rgba(${meta.rgb},0.08)`,
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 inset-x-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent, rgba(${meta.rgb},0.75), transparent)` }}
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
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: `rgba(${meta.rgb},0.2)` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: `rgb(${meta.rgb})` }} />
              </div>
              <span
                className="text-[11px] font-mono font-bold uppercase tracking-[0.18em]"
                style={{ color: `rgb(${meta.rgb})` }}
              >
                {meta.label} &middot; Started
              </span>
            </div>

            {/* Duration */}
            <p className="text-center text-[11px] font-mono uppercase tracking-[0.12em] text-white/35 mb-4">
              {formatDuration(focusMinutes, breakMinutes)}
            </p>

            {/* Wish */}
            <p className="text-center text-[16px] font-semibold text-white/95">
              Good luck &mdash; stay focused.
            </p>
          </div>

          {/* Progress / countdown bar — fills left → right over 2s, then dismisses */}
          <div
            aria-hidden
            className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <div
              style={{
                height: '100%',
                width: '100%',
                transformOrigin: 'left center',
                transform: progressActive ? 'scaleX(1)' : 'scaleX(0)',
                transition: `transform ${DURATION_MS}ms linear`,
                background: `linear-gradient(90deg, rgba(${meta.rgb},0.4), rgb(${meta.rgb}))`,
                boxShadow: `0 0 8px rgba(${meta.rgb},0.5)`,
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
