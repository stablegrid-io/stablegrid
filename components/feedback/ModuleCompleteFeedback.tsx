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
  accentRgb: string;
  onDismiss?: () => void;
}

interface Option {
  value: ModuleFeedbackValue;
  label: string;
  opacity: number;
}

const OPTIONS: Option[] = [
  { value: 1, label: 'Confusing', opacity: 0.25 },
  { value: 2, label: 'Needs work', opacity: 0.45 },
  { value: 3, label: 'Okay', opacity: 0.65 },
  { value: 4, label: 'Very clear', opacity: 0.85 },
  { value: 5, label: 'Excellent', opacity: 1 },
];

const STORAGE_PREFIX = 'stablegrid-module-feedback:';

export const ModuleCompleteFeedback = ({
  topic,
  moduleId,
  moduleTitle,
  moduleNumber,
  accentRgb,
  onDismiss,
}: ModuleCompleteFeedbackProps) => {
  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}${topic}:${moduleId}`,
    [moduleId, topic],
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
      value,
    });
    // Give the "saved" state ~1.3s of visibility, then dismiss.
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
          className="relative overflow-hidden rounded-[18px] border backdrop-blur-2xl px-4 py-3.5"
          style={{
            background: 'rgba(10,12,14,0.92)',
            borderColor: `rgba(${accentRgb},0.18)`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          }}
        >
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss feedback"
            className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-md text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
          >
            <X className="h-3 w-3" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-3.5 w-3.5" style={{ color: `rgb(${accentRgb})` }} aria-hidden />
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-[0.18em]"
              style={{ color: `rgb(${accentRgb})` }}
            >
              How clear was this module?
            </span>
          </div>

          <div
            className="flex items-end justify-between gap-1.5"
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
                  className="group flex flex-1 flex-col items-center gap-1.5 rounded-lg px-1 py-1.5 transition-colors disabled:cursor-default focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
                >
                  <Lightbulb
                    className="h-5 w-5 transition-all duration-200"
                    style={{
                      color: showLit ? `rgb(${accentRgb})` : 'rgba(255,255,255,0.3)',
                      opacity: showLit ? opt.opacity : 0.4,
                      filter: isSelected
                        ? `drop-shadow(0 0 6px rgba(${accentRgb},0.6))`
                        : undefined,
                    }}
                  />
                  <span
                    className="text-[9px] font-medium leading-none text-center whitespace-nowrap"
                    style={{
                      color: isSelected
                        ? `rgb(${accentRgb})`
                        : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-2.5 text-[10px] text-white/30">
            {selected ? 'Thanks — noted.' : 'One click. No form.'}
          </p>
        </div>
      </motion.section>
    </AnimatePresence>
  );
};
