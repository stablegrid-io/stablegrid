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
    { label: 'TOTAL_TIME', value: formatTheorySessionDuration(totalElapsedSeconds) },
    { label: 'FOCUS_TIME', value: formatTheorySessionDuration(focusElapsedSeconds) },
    { label: 'BREAK_TIME', value: formatTheorySessionDuration(breakElapsedSeconds) }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-6 py-10 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-xl border border-outline-variant/30 bg-surface p-8"
      >
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
          SESSION COMPLETE
        </div>
        <h2 className="mt-3 font-headline text-2xl font-bold text-on-surface tracking-tight">
          {lessonTitle}
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border border-outline-variant/20 bg-surface-container-low px-4 py-4"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">
                {stat.label}
              </div>
              <div className="mt-2 font-headline text-lg font-bold text-on-surface">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onDone}
            className="border border-outline-variant/40 px-5 py-2 font-mono text-xs text-on-surface-variant uppercase tracking-widest transition-colors hover:border-primary/40 hover:text-primary"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onNewSession}
            className="bg-primary px-5 py-2 font-headline font-bold text-xs text-on-primary uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(153,247,255,0.4)] active:scale-[0.98]"
          >
            New Session
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
