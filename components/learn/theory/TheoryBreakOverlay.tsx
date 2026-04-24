'use client';

import { motion } from 'framer-motion';
import { Pause, Play, SkipForward } from 'lucide-react';
import { formatTheorySessionClock } from '@/lib/learn/theorySession';

interface TheoryBreakOverlayProps {
  remainingSeconds: number;
  totalSeconds: number;
  currentRound: number;
  totalRounds: number;
  tip: string;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
}

export const TheoryBreakOverlay = ({
  remainingSeconds,
  totalSeconds,
  currentRound,
  totalRounds,
  tip,
  isPaused,
  onPause,
  onResume,
  onSkip
}: TheoryBreakOverlayProps) => {
  const progress =
    totalSeconds > 0
      ? Math.max(0, Math.min(1, (totalSeconds - remainingSeconds) / totalSeconds))
      : 0;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-x-0 bottom-0 top-12 z-30 flex items-center justify-center bg-light-bg/96 px-6 py-10 backdrop-blur-sm dark:bg-dark-bg/96"
    >
      <div className="w-full max-w-lg rounded-[2rem] border border-light-border bg-light-surface px-8 py-10 text-center shadow-[0_24px_80px_rgba(17,17,17,0.08)] dark:border-dark-border dark:bg-dark-surface dark:shadow-none">
        <div className="text-xs font-mono font-bold uppercase tracking-[0.22em] text-text-light-tertiary dark:text-text-dark-tertiary">
          Break
        </div>
        <h2 className="mt-3 text-3xl font-semibold text-text-light-primary dark:text-text-dark-primary">
          Reset your eyes for a minute
        </h2>
        <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Round {currentRound} of {totalRounds} is next.
        </p>

        <div className="mt-8 flex justify-center">
          <div className="relative h-56 w-56">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="fill-none stroke-light-border dark:stroke-dark-border"
                strokeWidth="6"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="fill-none stroke-text-light-primary transition-[stroke-dashoffset] duration-500 dark:stroke-text-dark-primary"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[11px] font-mono font-medium uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
                {isPaused ? 'Paused' : 'Remaining'}
              </div>
              <div className="mt-2 font-mono text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {formatTheorySessionClock(remainingSeconds)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-light-border bg-light-bg px-5 py-4 text-left dark:border-dark-border dark:bg-dark-bg">
          <div className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-brand-500">
            Micro-tip
          </div>
          <p className="mt-2 text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
            {tip}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={isPaused ? onResume : onPause}
            className="inline-flex items-center gap-2 rounded-full border border-light-border px-4 py-2 text-sm font-medium text-text-light-secondary transition-colors hover:border-text-light-primary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-text-dark-primary dark:hover:text-text-dark-primary"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Resume break' : 'Pause break'}
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-2 rounded-full bg-text-light-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-text-dark-primary dark:text-dark-bg dark:hover:bg-neutral-200"
          >
            <SkipForward className="h-4 w-4" />
            Skip break
          </button>
        </div>
      </div>
    </motion.div>
  );
};
