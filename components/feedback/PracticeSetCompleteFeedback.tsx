'use client';

import { useEffect, useMemo, useState } from 'react';
import { Target, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

/**
 * One-click feedback after a practice set finishes. Mirrors
 * `ModuleCompleteFeedback`'s shape (5-point lightbulb scale → fire-and-forget
 * analytics) but the prompt and the persisted storage key live in their own
 * namespace so a "module rated good" doesn't suppress the "practice set was
 * brutal" question on the same module.
 *
 * Storage key: `stablegrid-practice-set-feedback:{topic}:{moduleId}`. Once
 * the operator has rated this set, the card stays dismissed for the rest of
 * the session.
 */

export type PracticeSetFeedbackValue = 1 | 2 | 3 | 4 | 5;

interface PracticeSetCompleteFeedbackProps {
  topic: string;
  /** Practice set's moduleId — same value `getPracticeSet` uses, e.g.
      `module-PS3` or `module-FND-AGGREGATIONS-JUNIOR`. */
  moduleId: string;
  /** Display title — e.g. `Practice Set PS3 — DataFrames`. */
  setTitle: string;
  /** Tasks shipped right of total. Drives the headline copy. */
  tasksSolved: number;
  totalTasks: number;
  onDismiss?: () => void;
}

interface Option {
  value: PracticeSetFeedbackValue;
  label: string;
}

const OPTIONS: Option[] = [
  { value: 1, label: 'Brutal' },
  { value: 2, label: 'Tough' },
  { value: 3, label: 'Fair' },
  { value: 4, label: 'Smooth' },
  { value: 5, label: 'Easy' },
];

const STORAGE_PREFIX = 'stablegrid-practice-set-feedback:';

export const PracticeSetCompleteFeedback = ({
  topic,
  moduleId,
  setTitle,
  tasksSolved,
  totalTasks,
  onDismiss,
}: PracticeSetCompleteFeedbackProps) => {
  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}${topic}:${moduleId}`,
    [moduleId, topic],
  );
  const [selected, setSelected] = useState<PracticeSetFeedbackValue | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered] = useState<PracticeSetFeedbackValue | null>(null);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      const parsed = stored ? Number(stored) : null;
      if (parsed && parsed >= 1 && parsed <= 5) {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const handleSelect = (value: PracticeSetFeedbackValue) => {
    if (selected) return;
    setSelected(value);
    try {
      window.sessionStorage.setItem(storageKey, String(value));
    } catch {
      // ignore
    }
    void trackProductEvent('practice_set_feedback_submitted', {
      topic,
      moduleId,
      setTitle,
      tasksSolved,
      totalTasks,
      value,
    });
    void fetch('/api/feedback/practice-set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        moduleId,
        setTitle,
        tasksSolved,
        totalTasks,
        value,
      }),
      cache: 'no-store',
    }).catch(() => {
      /* non-blocking */
    });
    window.setTimeout(() => {
      setDismissed(true);
      onDismiss?.();
    }, 1300);
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  const cleared = totalTasks > 0 && tasksSolved >= totalTasks;
  const accuracyPct = totalTasks > 0 ? Math.round((tasksSolved / totalTasks) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        aria-label="How was this practice set?"
        className="fixed bottom-[7rem] left-1/2 -translate-x-1/2 z-50 w-[min(28rem,calc(100vw-2rem))]"
      >
        <div className="relative border border-on-surface/15 bg-surface px-5 py-4 shadow-[0_16px_36px_-20px_rgba(0,0,0,0.35)]">
          {/* Top accent — solid vermillion 2px */}
          <span aria-hidden className="absolute top-0 inset-x-0 h-[2px] bg-primary" />

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss feedback"
            className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>

          {/* Header — eyebrow + score on one row */}
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} aria-hidden />
              <span className="font-data-mono text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface">
                {cleared ? 'Set cleared' : 'Set finished'}
              </span>
            </div>
            <span className="font-data-mono tabular-nums text-[11px] text-on-surface-variant">
              {tasksSolved}/{totalTasks}
              <span className="text-on-surface-variant/60"> · {accuracyPct}%</span>
            </span>
          </div>

          {/* Prompt */}
          <p className="font-body text-[13px] text-on-surface-variant leading-snug mb-4">
            How was this practice set?
          </p>

          {/* 5-bulb scale */}
          <div
            className="flex items-end justify-between gap-1"
            onMouseLeave={() => setHovered(null)}
          >
            {OPTIONS.map((opt) => {
              const isSelected = selected === opt.value;
              const isPreview = hovered !== null && opt.value <= hovered;
              const showLit = isSelected || (selected === null && isPreview);
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={Boolean(selected)}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHovered(opt.value)}
                  onFocus={() => setHovered(opt.value)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${opt.value} of 5 — ${opt.label}`}
                  aria-pressed={isSelected}
                  className={`group flex flex-1 flex-col items-center gap-2 px-1 py-2 transition-colors disabled:cursor-default focus:outline-none focus-visible:bg-surface-container-low ${
                    isSelected ? 'bg-primary/[0.06]' : ''
                  }`}
                >
                  {/* Stack of dashes — fills left→right with rating value */}
                  <div className="flex items-end gap-[3px] h-5">
                    {[1, 2, 3, 4, 5].map((i) => {
                      const filled = showLit && i <= opt.value;
                      return (
                        <span
                          key={i}
                          aria-hidden
                          className={`w-[3px] transition-colors ${
                            filled ? 'bg-primary' : 'bg-on-surface-variant/30'
                          }`}
                          style={{ height: `${6 + i * 3}px` }}
                        />
                      );
                    })}
                  </div>
                  <span
                    className={`font-data-mono text-[9px] uppercase tracking-[0.14em] leading-none text-center whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'text-primary font-bold'
                        : showLit
                          ? 'text-on-surface'
                          : 'text-on-surface-variant/60'
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Caption */}
          <p
            className={`mt-4 font-data-mono text-[10px] uppercase tracking-[0.16em] ${
              selected ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            {selected ? 'Thanks — noted.' : 'One click. Calibrates difficulty.'}
          </p>
        </div>
      </motion.section>
    </AnimatePresence>
  );
};
