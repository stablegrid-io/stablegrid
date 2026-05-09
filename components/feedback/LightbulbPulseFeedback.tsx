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
      className={` border border-surface-dim/80 bg-surface/80 p-3  #090d10]/85 ${className ?? ''}`.trim()}
    >
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary-fixed-dim" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
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
                  ? 'border-primary-fixed-dim/80 bg-primary/15 text-primary'
                  : 'border-surface-dim bg-surface-container text-on-surface-variant hover:border-primary/50 hover:text-primary-dim     '
              } ${selected && !isSelected ? 'opacity-60' : ''}`}
            >
              <Lightbulb className={`h-3.5 w-3.5 text-primary-fixed-dim ${option.intensityClassName}`} />
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] text-on-surface-variant">
        {selected ? 'Feedback saved.' : 'One click. No form.'}
      </p>
    </section>
  );
};
