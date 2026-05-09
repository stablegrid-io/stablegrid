'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { BookOpen, Brain, Clock3, Zap, X } from 'lucide-react';
import {
  getTheorySessionMethod,
  getTheorySessionTotalMinutes,
  type TheorySessionConfig,
  type TheorySessionMethodId
} from '@/lib/learn/theorySession';

const TIMED_METHOD_ORDER: TheorySessionMethodId[] = ['sprint', 'pomodoro', 'deep-focus'];

const METHOD_HEADLINES: Record<TheorySessionMethodId, string> = {
  sprint: 'SPRINT',
  pomodoro: 'POMODORO',
  'deep-focus': 'DEEP CONCENTRATION',
  'free-read': 'FREE READ'
};

const METHOD_DESCRIPTIONS: Record<TheorySessionMethodId, string> = {
  sprint:
    'Quick bursts of focused reading. Ideal for short lessons, reviews, or when time is limited.',
  pomodoro:
    'Structured work–break cycles. Builds sustained focus, reduces fatigue, and improves long-term retention.',
  'deep-focus':
    'Extended uninterrupted sessions. Best for complex topics, deep understanding, and flow-state learning.',
  'free-read': 'Open-ended reading without a timer.'
};

const METHOD_STATS: Record<TheorySessionMethodId, { intensity: string; retention: string }> = {
  sprint: { intensity: 'High', retention: 'Moderate' },
  pomodoro: { intensity: 'Balanced', retention: 'High' },
  'deep-focus': { intensity: 'Sustained', retention: 'Maximum' },
  'free-read': { intensity: 'Flexible', retention: 'Varies' }
};

const METHOD_ICONS = {
  sprint: Zap,
  pomodoro: Clock3,
  'deep-focus': Brain,
  'free-read': BookOpen
} satisfies Record<TheorySessionMethodId, typeof Zap>;

const METHOD_LABELS: Record<TheorySessionMethodId, string> = {
  sprint: 'Sprint',
  pomodoro: 'Pomodoro',
  'deep-focus': 'Deep Focus',
  'free-read': 'Free Read'
};

interface TheorySessionPickerProps {
  isOpen: boolean;
  configsByMethod: Record<TheorySessionMethodId, TheorySessionConfig>;
  lessonTitle: string;
  lessonDurationMinutes: number;
  onStart: (config: TheorySessionConfig) => void;
  onOpenSettings: () => void;
  onDismiss: () => void;
}

export const TheorySessionPicker = ({
  isOpen,
  configsByMethod,
  onStart,
  onDismiss
}: TheorySessionPickerProps) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      previouslyFocusedElementRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      closeButtonRef.current?.focus();
      wasOpenRef.current = true;
      return;
    }
    if (!isOpen && wasOpenRef.current) {
      previouslyFocusedElementRef.current?.focus?.();
      wasOpenRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onDismiss();
    };
    // iOS Safari ignores `overflow: hidden` on body for momentum scrolling, so
    // a plain hidden lock leaks scroll behind the modal. Pin body with
    // `position: fixed` and offset top by the current scrollY to freeze the
    // viewport, then restore scroll on close.
    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onDismiss]);

  const freeReadConfig = configsByMethod['free-read'];

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-on-surface/40 px-4 py-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={onDismiss}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0"
          />

          <motion.div
            initial={{ y: 18, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Session picker"
            className="relative z-10 w-full max-w-[56rem] overflow-y-auto max-h-[90vh] border border-on-surface/15 bg-surface flex flex-col"
          >
            {/* Header */}
            <header className="flex items-start justify-between gap-6 px-8 pt-8 pb-6 border-b border-surface-dim">
              <div>
                <h2 className="font-h1 text-[28px] sm:text-[32px] text-on-surface leading-tight">
                  Pick your learning approach
                </h2>
                <p className="font-body text-[13px] text-on-surface-variant mt-2 max-w-xl">
                  Structured sessions improve retention by up to 40% and sustain deeper focus.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onDismiss}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center border border-on-surface/15 text-on-surface-variant hover:text-on-surface hover:border-on-surface/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Cards */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-b border-surface-dim">
              {TIMED_METHOD_ORDER.map((methodId, idx) => {
                const method = getTheorySessionMethod(methodId);
                if (!method) return null;
                const config = configsByMethod[methodId];
                const totalMinutes = getTheorySessionTotalMinutes(config);
                const Icon = METHOD_ICONS[methodId];
                const stats = METHOD_STATS[methodId];
                const rounds = methodId === 'sprint' ? 1 : config.rounds;
                const breakdown =
                  methodId === 'sprint'
                    ? `${rounds} × ${config.focusMinutes} min focus`
                    : `${rounds} × ${config.focusMinutes} min focus, ${config.breakMinutes} min break`;

                return (
                  <div
                    key={methodId}
                    role="button"
                    tabIndex={0}
                    aria-label={METHOD_LABELS[methodId]}
                    className={`group relative flex flex-col gap-5 p-6 cursor-pointer transition-colors hover:bg-surface-container-low focus:outline-none focus-visible:bg-surface-container-low ${
                      idx > 0 ? 'lg:border-l border-surface-dim' : ''
                    }`}
                    onClick={() => onStart(config)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onStart(config);
                      }
                    }}
                  >
                    {/* Top row: icon + total time */}
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-on-surface/15">
                        <Icon className="h-5 w-5 text-on-surface" strokeWidth={1.5} />
                      </span>
                      <div className="text-right min-w-0">
                        <div className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant mb-1">
                          Total
                        </div>
                        <div className="font-serif text-[36px] leading-none text-on-surface tabular-nums">
                          {totalMinutes}
                          <span className="text-[16px] text-on-surface-variant ml-1">min</span>
                        </div>
                        <div className="font-data-mono text-[11px] tabular-nums text-on-surface-variant mt-2">
                          {breakdown}
                        </div>
                      </div>
                    </div>

                    {/* Title + description */}
                    <div className="flex flex-col gap-2">
                      <h3 className="font-ui-label text-[18px] uppercase tracking-wider text-on-surface">
                        {METHOD_HEADLINES[methodId]}
                      </h3>
                      <p className="font-body text-[13px] leading-relaxed text-on-surface-variant min-h-[3.5rem]">
                        {METHOD_DESCRIPTIONS[methodId]}
                      </p>
                    </div>

                    {/* Session structure bars */}
                    <div className="flex flex-col gap-2 mt-auto">
                      <span className="font-data-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                        Session structure
                      </span>
                      <div className="flex gap-1 h-2.5">
                        {rounds <= 1 ? (
                          <span className="flex-1 bg-on-surface" />
                        ) : (
                          Array.from({ length: rounds }, (_, r) => (
                            <span key={r} className="flex flex-1 gap-1">
                              <span
                                className="bg-on-surface"
                                style={{ flex: config.focusMinutes }}
                              />
                              {r < rounds - 1 && (
                                <span
                                  className="bg-on-surface/15"
                                  style={{ flex: config.breakMinutes }}
                                />
                              )}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <dl className="grid grid-cols-2 gap-4 pt-3 border-t border-surface-dim">
                      <div className="flex flex-col gap-1">
                        <dt className="font-data-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                          Intensity
                        </dt>
                        <dd className="font-data-mono text-[12px] uppercase tracking-wider text-on-surface">
                          {stats.intensity}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1">
                        <dt className="font-data-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                          Retention
                        </dt>
                        <dd className="font-data-mono text-[12px] uppercase tracking-wider text-on-surface">
                          {stats.retention}
                        </dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
            </section>

            {/* Footer */}
            <footer className="flex justify-center px-8 py-5">
              <button
                type="button"
                onClick={() => onStart(freeReadConfig)}
                className="font-data-mono text-[11px] uppercase tracking-[0.18em] text-on-surface border-b border-on-surface pb-1 hover:text-on-surface hover:border-on-surface transition-colors"
              >
                or read freely without a timer
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
