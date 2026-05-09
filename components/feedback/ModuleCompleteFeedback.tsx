'use client';

import { useEffect, useMemo, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

export type ModuleFeedbackValue = 1 | 2 | 3 | 4 | 5;

interface ModuleCompleteFeedbackProps {
  topic: string;
  moduleId: string;
  moduleTitle: string;
  moduleNumber: number;
  /** Legacy per-tier accent. Editorial design uses a single primary; kept on
   *  the interface for caller compatibility. */
  accentRgb?: string;
  onDismiss?: () => void;
}

interface Option {
  value: ModuleFeedbackValue;
  label: string;
}

const OPTIONS: Option[] = [
  { value: 1, label: 'Confusing' },
  { value: 2, label: 'Needs work' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Very clear' },
  { value: 5, label: 'Excellent' }
];

const STORAGE_PREFIX = 'stablegrid-module-feedback:';

export const ModuleCompleteFeedback = ({
  topic,
  moduleId,
  moduleTitle,
  moduleNumber,
  onDismiss
}: ModuleCompleteFeedbackProps) => {
  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}${topic}:${moduleId}`,
    [moduleId, topic]
  );
  const [selected, setSelected] = useState<ModuleFeedbackValue | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered] = useState<ModuleFeedbackValue | null>(null);

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

  const handleSelect = (value: ModuleFeedbackValue) => {
    if (selected) return;
    setSelected(value);
    try {
      window.sessionStorage.setItem(storageKey, String(value));
    } catch {
      // ignore
    }
    void trackProductEvent('module_complete_feedback_submitted', {
      topic,
      moduleId,
      moduleTitle,
      moduleNumber,
      value
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

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        aria-label="How clear was this module?"
        className="fixed bottom-[7rem] left-1/2 -translate-x-1/2 z-50 w-[min(28rem,calc(100vw-2rem))]"
      >
        <div
          className="relative border border-on-surface/15 bg-surface px-5 py-4"
          style={{ boxShadow: '0 16px 36px -20px rgba(0, 0, 0, 0.35)' }}
        >
          {/* Primary top accent strip */}
          <span
            aria-hidden
            className="absolute top-0 inset-x-0 h-[2px] bg-primary"
          />

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss feedback"
            className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb
              className="h-3.5 w-3.5 text-primary"
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="font-data-mono text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface">
              How clear was this module?
            </span>
          </div>

          {/* Lightbulb scale */}
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
                  className="group flex flex-1 flex-col items-center gap-2 px-1 py-2 transition-colors disabled:cursor-default focus:outline-none focus-visible:bg-surface-container-low"
                >
                  <Lightbulb
                    className={`h-5 w-5 transition-colors ${
                      showLit ? 'text-primary' : 'text-on-surface-variant/40'
                    }`}
                    strokeWidth={showLit ? 2 : 1.5}
                    aria-hidden
                  />
                  <span
                    className={`font-data-mono text-[9px] uppercase tracking-[0.14em] leading-none text-center whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'text-primary'
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
            {selected ? 'Thanks — noted.' : 'One click. No form.'}
          </p>
        </div>
      </motion.section>
    </AnimatePresence>
  );
};
