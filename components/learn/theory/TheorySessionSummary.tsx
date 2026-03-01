'use client';

import { motion } from 'framer-motion';
import { formatTheorySessionDuration } from '@/lib/learn/theorySession';

interface TheorySessionSummaryProps {
  lessonTitle: string;
  totalElapsedSeconds: number;
  focusElapsedSeconds: number;
  breakElapsedSeconds: number;
  onNewSession: () => void;
  onDone: () => void;
}

export const TheorySessionSummary = ({
  lessonTitle,
  totalElapsedSeconds,
  focusElapsedSeconds,
  breakElapsedSeconds,
  onNewSession,
  onDone
}: TheorySessionSummaryProps) => {
  const stats = [
    { label: 'Total time', value: formatTheorySessionDuration(totalElapsedSeconds) },
    { label: 'Focus time', value: formatTheorySessionDuration(focusElapsedSeconds) },
    { label: 'Break time', value: formatTheorySessionDuration(breakElapsedSeconds) }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-light-bg/80 px-6 py-10 backdrop-blur-sm dark:bg-dark-bg/80"
    >
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-xl rounded-[2rem] border border-light-border bg-light-surface p-8 shadow-[0_24px_80px_rgba(17,17,17,0.08)] dark:border-dark-border dark:bg-dark-surface dark:shadow-none"
      >
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
          Session Complete
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
          {lessonTitle}
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-light-border bg-light-bg px-4 py-4 dark:border-dark-border dark:bg-dark-bg"
            >
              <div className="text-[11px] uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
                {stat.label}
              </div>
              <div className="mt-2 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onDone}
            className="rounded-full border border-light-border px-4 py-2 text-sm font-medium text-text-light-secondary transition-colors hover:border-text-light-primary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-text-dark-primary dark:hover:text-text-dark-primary"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onNewSession}
            className="rounded-full bg-text-light-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-text-dark-primary dark:text-dark-bg dark:hover:bg-neutral-200"
          >
            New session
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
