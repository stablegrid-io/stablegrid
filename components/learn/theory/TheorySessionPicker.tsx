'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Brain, Clock3, Zap, X, Play, Lock, RefreshCw } from 'lucide-react';
import {
  THEORY_SESSION_METHODS,
  formatTheorySessionDuration,
  getTheorySessionMethod,
  getTheorySessionTotalMinutes,
  type TheorySessionConfig,
  type TheorySessionMethodId
} from '@/lib/learn/theorySession';

const TIMED_METHOD_ORDER: TheorySessionMethodId[] = ['sprint', 'pomodoro', 'deep-focus'];

const METHOD_NEURAL_LABELS: Record<TheorySessionMethodId, string> = {
  sprint: 'SPRINT',
  pomodoro: 'POMODORO',
  'deep-focus': 'DEEP CONCENTRATION',
  'free-read': 'FREE READ'
};

const METHOD_DESCRIPTIONS: Record<TheorySessionMethodId, string> = {
  sprint: 'Quick bursts of focused reading. Ideal for short lessons, reviews, or when time is limited.',
  pomodoro: 'Structured work-break cycles. Builds sustained focus, reduces fatigue, and improves long-term retention.',
  'deep-focus': 'Extended uninterrupted sessions. Best for complex topics, deep understanding, and flow state learning.',
  'free-read': 'Open-ended reading without a timer.'
};

const METHOD_ACCENTS: Record<TheorySessionMethodId, { hex: string; rgb: string }> = {
  sprint:       { hex: '#99f7ff', rgb: '153,247,255' },
  pomodoro:     { hex: '#ff716c', rgb: '255,113,108' },
  'deep-focus': { hex: '#bf81ff', rgb: '191,129,255' },
  'free-read':  { hex: '#fbbf24', rgb: '251,191,36' }
};

const METHOD_STATS: Record<TheorySessionMethodId, [string, string, string, string]> = {
  sprint:     ['Intensity', 'HIGH', 'Retention', 'MODERATE'],
  pomodoro:   ['Intensity', 'BALANCED', 'Retention', 'HIGH'],
  'deep-focus': ['Intensity', 'SUSTAINED', 'Retention', 'MAXIMUM'],
  'free-read': ['Intensity', 'FLEXIBLE', 'Retention', 'VARIES']
};

const METHOD_HZ: Record<TheorySessionMethodId, string> = {
  sprint: 'BURST', pomodoro: 'RHYTHM', 'deep-focus': 'FLOW', 'free-read': 'OPEN'
};

const METHOD_ICONS = {
  sprint: Zap, pomodoro: Clock3, 'deep-focus': Brain, 'free-read': BookOpen
} satisfies Record<TheorySessionMethodId, typeof Zap>;

const METHOD_CTA_ICONS = {
  sprint: Play, pomodoro: RefreshCw, 'deep-focus': Lock, 'free-read': BookOpen
} satisfies Record<TheorySessionMethodId, typeof Play>;

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
  lessonTitle,
  lessonDurationMinutes,
  onStart,
  onOpenSettings,
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
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onDismiss();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
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
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-4 backdrop-blur-md"
        >
          <button type="button" onClick={onDismiss} tabIndex={-1} aria-hidden="true" className="absolute inset-0" />

          <motion.div
            initial={{ y: 18, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-[56rem] overflow-y-auto max-h-[90vh] rounded-[22px] border border-white/[0.06] bg-[#111416] pt-8 px-5 pb-5 flex flex-col gap-4"
          >
            {/* Title */}
            <div className="mb-1">
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">Pick Your Learning Approach</h2>
              <p className="text-xs text-on-surface-variant mt-1">Structured sessions improve retention by up to 40% and sustain deeper focus.</p>
            </div>

            {/* Close */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onDismiss}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-on-surface-variant hover:text-primary hover:bg-white/[0.08] transition-colors z-20"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 3-column timed method cards */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {TIMED_METHOD_ORDER.map((methodId) => {
                const method = getTheorySessionMethod(methodId);
                if (!method) return null;
                const config = configsByMethod[methodId];
                const totalMinutes = getTheorySessionTotalMinutes(config);
                const a = METHOD_ACCENTS[methodId];
                const Icon = METHOD_ICONS[methodId];
                const CtaIcon = METHOD_CTA_ICONS[methodId];
                const stats = METHOD_STATS[methodId];
                const hz = METHOD_HZ[methodId];
                const timeLabel = methodId === 'pomodoro'
                  ? `${totalMinutes} min`
                  : `${totalMinutes} min`;
                const targetLabel = methodId === 'sprint' ? `${config.focusMinutes} min focus` : methodId === 'pomodoro' ? `${config.focusMinutes} min focus · ${config.breakMinutes} min break` : `${config.focusMinutes} min focus`;
                const filledBars = methodId === 'sprint' ? 4 : methodId === 'pomodoro' ? 3 : 5;
                const monitorId = methodId === 'sprint' ? 'S1' : methodId === 'pomodoro' ? 'P2' : 'D3';

                return (
                  <div
                    key={methodId}
                    className="rounded-[22px] border p-4 flex flex-col group transition-all relative cursor-pointer"
                    style={{
                      borderColor: `rgba(${a.rgb},0.1)`,
                      backgroundColor: '#0c0e10',
                    }}
                    onClick={() => onStart(config)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(${a.rgb},0.4)`; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px rgba(${a.rgb},0.15)`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(${a.rgb},0.1)`; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >

                    {/* Icon + time */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 rounded-[10px] border" style={{ backgroundColor: `rgba(${a.rgb},0.1)`, borderColor: `rgba(${a.rgb},0.2)` }}>
                        <Icon className="h-5 w-5" style={{ color: a.hex }} />
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] uppercase mb-0.5" style={{ color: a.hex }}>{targetLabel}</div>
                        <div className="text-2xl font-light text-on-surface">{timeLabel}</div>
                      </div>
                    </div>

                    {/* Title + description */}
                    <h2 className="text-lg font-black tracking-tight text-on-surface mb-1">
                      {METHOD_NEURAL_LABELS[methodId]}
                    </h2>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed mb-3 min-h-[2.5rem]">
                      {METHOD_DESCRIPTIONS[methodId]}
                    </p>

                    <div className="space-y-3 mt-auto">
                      {/* Session structure visualization */}
                      <div className="bg-black/40 p-2 rounded-[14px] border border-outline-variant/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] tracking-widest uppercase" style={{ color: `rgba(${a.rgb},0.6)` }}>
                            SESSION_STRUCTURE
                          </span>
                          <span className="text-[9px]" style={{ color: a.hex }}>{totalMinutes} MIN</span>
                        </div>
                        <div className="flex gap-0.5 h-2">
                          {methodId === 'sprint' ? (
                            /* Sprint: one solid focus block */
                            <>
                              <div className="flex-1" style={{ backgroundColor: a.hex }} />
                            </>
                          ) : methodId === 'pomodoro' ? (
                            /* Pomodoro: alternating focus/break blocks */
                            <>
                              {Array.from({ length: config.rounds }, (_, r) => (
                                <div key={r} className="flex flex-1 gap-0.5">
                                  <div className="flex-[5]" style={{ backgroundColor: a.hex }} />
                                  {r < config.rounds - 1 && (
                                    <div className="flex-1 bg-white/10" />
                                  )}
                                </div>
                              ))}
                            </>
                          ) : (
                            /* Deep: one long sustained block with subtle gradient */
                            <div className="flex-1" style={{ background: `linear-gradient(90deg, ${a.hex}, rgba(${a.rgb},0.6))` }} />
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border-l pl-2" style={{ borderColor: `rgba(${a.rgb},0.3)` }}>
                          <div className="text-[8px] text-on-surface-variant uppercase">{stats[0]}</div>
                          <div className="text-[11px] font-bold text-on-surface uppercase">{stats[1]}</div>
                        </div>
                        <div className="border-l pl-2" style={{ borderColor: `rgba(${a.rgb},0.3)` }}>
                          <div className="text-[8px] text-on-surface-variant uppercase">{stats[2]}</div>
                          <div className="text-[11px] font-bold text-on-surface uppercase">{stats[3]}</div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </section>

            {/* Footer */}
            <footer className="border-t border-outline-variant/20 pt-4 flex justify-center">
              <button
                type="button"
                onClick={() => onStart(freeReadConfig)}
                className="border border-amber-400/30 bg-amber-400/10 px-8 py-3 rounded-[14px] text-xs font-bold text-amber-400 uppercase tracking-widest hover:bg-amber-400/20 hover:border-amber-400/50 transition-all"
              >
                FREE READ
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
