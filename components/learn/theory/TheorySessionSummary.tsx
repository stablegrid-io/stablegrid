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
      className="absolute inset-0 z-40 flex items-center justify-center bg-on-surface/40 px-6 py-10 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-xl border border-on-surface/15 bg-surface shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]"
      >
        {/* Top accent */}
        <div aria-hidden className="h-[2px] w-full bg-primary" />

        <div className="px-8 pt-8 pb-7">
          <div className="font-data-mono text-[11px] uppercase tracking-[0.22em] text-primary">
            Session complete
          </div>
          <h2 className="mt-3 font-serif text-[26px] leading-tight text-on-surface">
            {lessonTitle}
          </h2>

          <dl className="mt-7 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="border border-surface-dim px-4 py-4"
              >
                <dt className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                  {stat.label}
                </dt>
                <dd className="mt-2 font-serif text-[22px] tabular-nums text-on-surface">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex justify-end gap-2 border-t border-surface-dim px-8 py-4 bg-surface-container-low/40">
          <button
            type="button"
            onClick={onDone}
            className="font-data-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant border border-on-surface/15 px-5 py-2.5 transition-colors hover:text-on-surface hover:border-on-surface/40"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onNewSession}
            className="font-data-mono text-[11px] uppercase tracking-[0.18em] text-on-primary bg-primary px-5 py-2.5 transition-colors hover:bg-primary-dim"
          >
            New session
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
