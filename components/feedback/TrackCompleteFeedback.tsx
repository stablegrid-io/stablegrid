'use client';

import { useEffect, useMemo, useState } from 'react';
import { Lightbulb, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

export type TrackFeedbackValue = 1 | 2 | 3 | 4 | 5;

interface TrackCompleteFeedbackProps {
  topic: string;
  trackSlug: string;
  trackTitle: string;
  totalModules: number;
  accentRgb: string;
  onDismiss?: () => void;
}

interface Option {
  value: TrackFeedbackValue;
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

const STORAGE_PREFIX = 'stablegrid-track-feedback:';
const COMMENT_LIMIT = 1000;

export const TrackCompleteFeedback = ({
  topic,
  trackSlug,
  trackTitle,
  totalModules,
  accentRgb,
  onDismiss,
}: TrackCompleteFeedbackProps) => {
  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}${topic}:${trackSlug}`,
    [topic, trackSlug],
  );
  const [dismissed, setDismissed] = useState(false);
  const [selected, setSelected] = useState<TrackFeedbackValue | null>(null);
  const [hovered, setHovered] = useState<TrackFeedbackValue | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored) {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    if (dismissed) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed]);

  const handleDismiss = () => {
    try {
      window.sessionStorage.setItem(storageKey, 'dismissed');
    } catch {
      // ignore
    }
    setDismissed(true);
    onDismiss?.();
  };

  const handleSubmit = async () => {
    if (!selected || submitting || submitted) return;
    setSubmitting(true);
    const trimmed = comment.trim().slice(0, COMMENT_LIMIT);
    try {
      window.sessionStorage.setItem(storageKey, String(selected));
    } catch {
      // ignore
    }
    await trackProductEvent('track_complete_feedback_submitted', {
      topic,
      trackSlug,
      trackTitle,
      totalModules,
      value: selected,
      comment: trimmed || undefined,
    });
    // Persist to server in parallel; non-blocking on failure so the
    // celebration UX still resolves even if the API hiccups.
    void fetch('/api/feedback/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        trackSlug,
        trackTitle,
        totalModules,
        value: selected,
        comment: trimmed || undefined,
      }),
      cache: 'no-store',
    }).catch(() => {
      /* non-blocking */
    });
    setSubmitting(false);
    setSubmitted(true);
    window.setTimeout(() => {
      setDismissed(true);
      onDismiss?.();
    }, 1600);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        role="dialog"
        aria-modal="true"
        aria-label="Track complete feedback"
        className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 bg-on-surface/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
      >
        <motion.div
          initial={{ y: 18, opacity: 0, scale: 0.985 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[32rem] max-h-[90vh] overflow-y-auto border border-on-surface bg-surface shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]"
        >
          {/* Top accent — solid vermillion 2px */}
          <div aria-hidden className="absolute top-0 inset-x-0 h-[2px] bg-primary" />

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <div className="px-5 sm:px-7 pt-7 sm:pt-8 pb-6">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-6 w-6 items-center justify-center border border-primary bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
              </span>
              <span className="font-data-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                Track Complete
              </span>
            </div>

            <h2 className="font-h2 text-[22px] sm:text-[24px] font-bold tracking-tight text-on-surface leading-tight mb-2">
              You finished {trackTitle}.
            </h2>
            <p className="font-body text-[14px] leading-relaxed text-on-surface-variant mb-6">
              {totalModules} modules done. Before you move on — how was the whole track?
            </p>

            {/* 5-bulb rating row — vermillion when lit, ink-variant when not */}
            <div
              className="flex items-end justify-between gap-2 mb-5 pb-5 border-b border-surface-dim"
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
                    onClick={() => setSelected(opt.value)}
                    onMouseEnter={() => setHovered(opt.value)}
                    onFocus={() => setHovered(opt.value)}
                    onBlur={() => setHovered(null)}
                    disabled={submitted}
                    aria-label={`${opt.value} of 5 — ${opt.label}`}
                    aria-pressed={isSelected}
                    className={`group flex flex-1 flex-col items-center gap-2 px-1 py-2 transition-colors focus:outline-none focus-visible:bg-surface-container-low disabled:cursor-default ${
                      isSelected ? 'bg-primary/[0.06]' : ''
                    }`}
                  >
                    <Lightbulb
                      className={`h-7 w-7 transition-colors ${
                        showLit ? 'text-primary' : 'text-on-surface-variant/40'
                      }`}
                      strokeWidth={showLit ? 2 : 1.5}
                      style={{ opacity: showLit ? opt.opacity : 0.55 }}
                      aria-hidden
                    />
                    <span
                      className={`font-data-mono text-[10px] uppercase tracking-[0.12em] leading-none text-center whitespace-nowrap transition-colors ${
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

            {/* Optional comment */}
            <label className="block mb-5">
              <span className="mb-2 block font-data-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                Anything to add?{' '}
                <span className="font-normal text-on-surface-variant/70">(optional)</span>
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, COMMENT_LIMIT))}
                placeholder="What worked, what didn't, what's missing…"
                disabled={submitted}
                rows={3}
                className="w-full resize-none border border-surface-dim bg-surface-container-low px-3.5 py-2.5 font-body text-[13px] text-on-surface placeholder:text-on-surface-variant/60 transition-colors focus:outline-none focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />
              <span className="mt-1 block text-right font-data-mono text-[10px] text-on-surface-variant tabular-nums">
                {comment.length}/{COMMENT_LIMIT}
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDismiss}
                disabled={submitting || submitted}
                className="px-4 py-2.5 font-data-mono text-[11px] uppercase tracking-[0.16em] text-on-surface-variant border border-transparent transition-colors hover:text-on-surface hover:border-surface-dim disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selected || submitting || submitted}
                className={`px-5 py-2.5 font-data-mono text-[11px] uppercase tracking-[0.16em] font-bold transition-colors disabled:cursor-not-allowed ${
                  selected
                    ? 'bg-primary text-on-primary border border-primary hover:bg-primary-dim hover:border-primary-dim'
                    : 'bg-surface-container-low text-on-surface-variant/60 border border-surface-dim'
                }`}
              >
                {submitted ? 'Thanks!' : submitting ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
