'use client';

import { useEffect, useMemo, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

export type LightbulbFeedbackContext = 'general' | 'module' | 'mission' | 'notebook';
export type LightbulbFeedbackValue = 'dim' | 'steady' | 'bright';

interface LightbulbPulseFeedbackProps {
  contextType: LightbulbFeedbackContext;
  contextId: string;
  prompt: string;
  className?: string;
  dismissWhenSelected?: boolean;
}

interface FeedbackOption {
  value: LightbulbFeedbackValue;
  label: string;
  intensityClassName: string;
}

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  {
    value: 'dim',
    label: 'Needs work',
    intensityClassName: 'opacity-55'
  },
  {
    value: 'steady',
    label: 'Clear enough',
    intensityClassName: 'opacity-80'
  },
  {
    value: 'bright',
    label: 'Very clear',
    intensityClassName: 'opacity-100 drop-shadow-[0_0_8px_rgba(34,185,153,0.45)]'
  }
];

const FEEDBACK_STORAGE_PREFIX = 'stablegrid-lightbulb-feedback:';

const buildStorageKey = (contextType: LightbulbFeedbackContext, contextId: string) =>
  `${FEEDBACK_STORAGE_PREFIX}${contextType}:${contextId}`;

export const LightbulbPulseFeedback = ({
  contextType,
  contextId,
  prompt,
  className,
  dismissWhenSelected = false
}: LightbulbPulseFeedbackProps) => {
  const storageKey = useMemo(
    () => buildStorageKey(contextType, contextId),
    [contextId, contextType]
  );
  const [selected, setSelected] = useState<LightbulbFeedbackValue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const value = window.sessionStorage.getItem(storageKey);
      if (value === 'dim' || value === 'steady' || value === 'bright') {
        setSelected(value);
      }
    } catch {
      // Ignore storage access issues and keep feedback available.
    }
  }, [storageKey]);

  const handleSelect = (value: LightbulbFeedbackValue) => {
    if (selected || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSelected(value);

    try {
      window.sessionStorage.setItem(storageKey, value);
    } catch {
      // Ignore storage failures and continue with event tracking.
    }

    void trackProductEvent('lightbulb_feedback_submitted', {
      feedbackType: 'lightbulb',
      contextType,
      contextId,
      value
    }).finally(() => {
      setIsSubmitting(false);
    });
  };

  if (dismissWhenSelected && selected) {
    return null;
  }

  return (
    <section
      aria-label={`${prompt} feedback`}
      className={`rounded-2xl border border-light-border/80 bg-light-bg/80 p-3 dark:border-dark-border dark:bg-[#090d10]/85 ${className ?? ''}`.trim()}
    >
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-brand-400" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
          {prompt}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {FEEDBACK_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              disabled={Boolean(selected) || isSubmitting}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                isSelected
                  ? 'border-brand-400/80 bg-brand-500/15 text-brand-500'
                  : 'border-light-border bg-light-surface text-text-light-secondary hover:border-brand-500/50 hover:text-brand-600 dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary dark:hover:border-brand-500/60 dark:hover:text-brand-300'
              } ${selected && !isSelected ? 'opacity-60' : ''}`}
            >
              <Lightbulb className={`h-3.5 w-3.5 text-brand-400 ${option.intensityClassName}`} />
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
        {selected ? 'Feedback saved.' : 'One click. No form.'}
      </p>
    </section>
  );
};
