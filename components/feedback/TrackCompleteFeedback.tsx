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
        className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
        style={{ background: 'rgba(6,8,10,0.86)', backdropFilter: 'blur(12px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
      >
        <motion.div
          initial={{ y: 18, opacity: 0, scale: 0.985 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[32rem] overflow-hidden rounded-[22px] border"
          style={{
            background: '#101418',
            borderColor: `rgba(${accentRgb},0.22)`,
            boxShadow: `0 24px 80px rgba(0,0,0,0.65), 0 0 40px rgba(${accentRgb},0.12)`,
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 inset-x-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.7), transparent)` }}
          />

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-7 pt-8 pb-6">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: `rgba(${accentRgb},0.18)` }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: `rgb(${accentRgb})` }} />
              </div>
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-[0.22em]"
                style={{ color: `rgb(${accentRgb})` }}
              >
                Track Complete
              </span>
            </div>

            <h2 className="text-[22px] font-bold tracking-tight text-white leading-tight mb-2">
              You finished {trackTitle}.
            </h2>
            <p className="text-[13.5px] leading-relaxed mb-7" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {totalModules} modules done. Before you move on — how was the whole track?
            </p>

            {/* 5-bulb row */}
            <div
              className="flex items-end justify-between gap-2 mb-5"
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
                    className="group flex flex-1 flex-col items-center gap-2 rounded-xl px-1 py-2 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:cursor-default"
                    style={{
                      background: isSelected ? `rgba(${accentRgb},0.08)` : 'transparent',
                    }}
                  >
                    <Lightbulb
                      className="h-7 w-7 transition-all duration-200"
                      style={{
                        color: showLit ? `rgb(${accentRgb})` : 'rgba(255,255,255,0.3)',
                        opacity: showLit ? opt.opacity : 0.35,
                        filter: isSelected
                          ? `drop-shadow(0 0 10px rgba(${accentRgb},0.55))`
                          : undefined,
                      }}
                    />
                    <span
                      className="text-[10px] font-semibold leading-none text-center whitespace-nowrap"
                      style={{
                        color: isSelected
                          ? `rgb(${accentRgb})`
                          : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Optional comment */}
            <label className="block mb-5">
              <span
                className="mb-2 block text-[11px] font-mono font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Anything to add? <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>(optional)</span>
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, COMMENT_LIMIT))}
                placeholder="What worked, what didn't, what's missing..."
                disabled={submitted}
                rows={3}
                className="w-full resize-none rounded-[12px] border bg-black/30 px-3.5 py-2.5 text-[13px] text-white/85 placeholder:text-white/20 transition-colors focus:outline-none focus:border-white/20 disabled:opacity-60"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              />
              <span className="mt-1 block text-right text-[10px] text-white/25 tabular-nums">
                {comment.length}/{COMMENT_LIMIT}
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDismiss}
                disabled={submitting || submitted}
                className="rounded-[12px] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70 disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selected || submitting || submitted}
                className="rounded-[12px] px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.18em] transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background: selected ? `rgb(${accentRgb})` : 'rgba(255,255,255,0.06)',
                  color: selected ? '#06181c' : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${selected ? `rgb(${accentRgb})` : 'rgba(255,255,255,0.08)'}`,
                }}
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
