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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(28rem,calc(100vw-2rem))]"
    >
      <div
        className="relative overflow-hidden rounded-2xl border backdrop-blur-2xl"
        style={{
          background: 'rgba(10,12,14,0.92)',
          borderColor: `rgba(${accentRgb},0.2)`,
          boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(${accentRgb},0.06)`,
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{
          background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.7), transparent)`,
        }} />

        {/* Dismiss button */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-lg text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="px-5 pt-5 pb-4">
          {/* Completed badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: `rgba(${accentRgb},0.2)` }}>
              <Check className="h-3 w-3" style={{ color: `rgb(${accentRgb})` }} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: `rgb(${accentRgb})` }}>
              {isTrackComplete ? 'Track Complete' : 'Module Complete'}
            </span>
          </div>

          {/* Module info */}
          <p className="text-[14px] font-semibold text-white/90 mb-1">
            Module {moduleNumber}: {moduleTitle}
          </p>

          {/* Progress bar */}
          <div className="mt-3 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-white/30">{completedModules}/{totalModules} modules</span>
              <span className="text-[11px] font-bold" style={{ color: `rgb(${accentRgb})` }}>{progressPct}%</span>
            </div>
            <div className="w-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
              <div style={{ width: `${barWidth}%`, height: '100%', background: '#fff', borderRadius: 100, opacity: 0.85, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
            </div>
          </div>

          {/* Next action */}
          {nextModuleTitle && onGoToNext ? (
            <button
              type="button"
              onClick={onGoToNext}
              className="mt-3 w-full flex items-center justify-between rounded-xl py-2.5 px-4 text-[12px] font-semibold transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: `rgba(${accentRgb},0.1)`,
                border: `1px solid rgba(${accentRgb},0.2)`,
                color: `rgb(${accentRgb})`,
              }}
            >
              <span>Next: {nextModuleTitle}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : isTrackComplete ? (
            <div className="mt-3 text-center text-[12px] text-white/40">
              All modules in this track are complete
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};
