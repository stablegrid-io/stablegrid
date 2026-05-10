'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface LessonCompletionToastProps {
  moduleTitle: string;
  moduleNumber: number;
  totalModules: number;
  completedModules: number;
  nextModuleTitle: string | null;
  onGoToNext: (() => void) | null;
  onDismiss: () => void;
  accentRgb: string;
}

export const LessonCompletionToast = ({
  moduleTitle,
  moduleNumber,
  totalModules,
  completedModules,
  nextModuleTitle,
  onGoToNext,
  onDismiss,
  accentRgb,
}: LessonCompletionToastProps) => {
  const progressPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const isTrackComplete = completedModules >= totalModules;

  // Animated progress bar
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(progressPct), 300);
    return () => clearTimeout(t);
  }, [progressPct]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[min(28rem,calc(100vw-1.5rem))]"
    >
      {/* Editorial paper — cream surface, ink hairline, vermillion accent.
          The `accentRgb` prop is kept on the API for backwards compat
          (other call sites still pass it) but the shipping styling uses
          editorial tokens directly so reading-mode swaps don't fight us. */}
      <div className="relative overflow-hidden border border-on-surface bg-surface shadow-[0_18px_40px_-22px_rgba(0,0,0,0.35)]">
        {/* Top accent — solid vermillion, no gradient fade */}
        <div aria-hidden className="absolute top-0 inset-x-0 h-[2px] bg-primary" />

        {/* Dismiss button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="px-5 pt-5 pb-4">
          {/* Completed badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-5 w-5 items-center justify-center border border-primary bg-primary/10">
              <Check className="h-3 w-3 text-primary" strokeWidth={2} />
            </span>
            <span className="font-data-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {isTrackComplete ? 'Track Complete' : 'Module Complete'}
            </span>
          </div>

          {/* Module info — serif title, ink */}
          <p className="font-serif text-[15px] leading-snug text-on-surface mb-1">
            <span className="font-data-mono text-[11px] tabular-nums text-on-surface-variant mr-1.5">
              M{moduleNumber}
            </span>
            {moduleTitle}
          </p>

          {/* Progress bar */}
          <div className="mt-3 mb-2">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="font-data-mono text-[10px] tabular-nums uppercase tracking-wider text-on-surface-variant">
                {completedModules}/{totalModules} modules
              </span>
              <span className="font-data-mono text-[11px] tabular-nums font-bold text-primary">
                {progressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-container border border-surface-dim overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${barWidth}%`,
                  transition: 'width 1.5s cubic-bezier(.16,1,.3,1)',
                }}
              />
            </div>
          </div>

          {/* Next action */}
          {nextModuleTitle && onGoToNext ? (
            <button
              type="button"
              onClick={onGoToNext}
              title={`Next: ${nextModuleTitle}`}
              className="mt-3 w-full flex items-center justify-between gap-2 py-2.5 px-4 border border-primary bg-primary/[0.06] text-primary font-data-mono uppercase text-[11px] tracking-wider transition-colors hover:bg-primary hover:text-on-primary"
            >
              <span className="min-w-0 flex-1 truncate text-left">
                Next · {nextModuleTitle}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            </button>
          ) : isTrackComplete ? (
            <div className="mt-3 text-center font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface-variant pt-2 border-t border-surface-dim">
              All modules in this track are complete
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};
