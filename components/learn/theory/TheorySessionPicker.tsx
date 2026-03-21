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
  pomodoro:     { hex: '#bf81ff', rgb: '191,129,255' },
  'deep-focus': { hex: '#ff716c', rgb: '255,113,108' },
  'free-read':  { hex: '#bf81ff', rgb: '191,129,255' }
};

const METHOD_STATS: Record<TheorySessionMethodId, [string, string, string, string]> = {
  sprint:     ['Synaptic_Load', 'CRITICAL_HIGH', 'Dopamine_Mod', '+14.2%'],
  pomodoro:   ['Cycle_Efficiency', 'STABLE_FLOW', 'Recovery_Rate', 'OPTIMIZED'],
  'deep-focus': ['Isolation_Level', 'TOTAL_SILENCE', 'Network_State', 'AIRGAPPED'],
  'free-read': ['Data_Flow', 'UNMETERED', 'Archive_Mode', 'OPEN']
};

const METHOD_HZ: Record<TheorySessionMethodId, string> = {
  sprint: '84.2', pomodoro: '62.0', 'deep-focus': '12.5', 'free-read': '0.0'
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
            className="relative z-10 w-full max-w-[56rem] overflow-y-auto max-h-[90vh] border border-outline-variant/30 bg-surface pt-8 px-5 pb-5 flex flex-col gap-4"
          >
            {/* Title */}
            <div className="mb-1">
              <h2 className="font-headline text-lg font-bold text-on-surface tracking-tight">Pick Your Learning Approach</h2>
              <p className="font-mono text-[9px] text-on-surface-variant mt-0.5">Structured sessions improve retention by up to 40% and sustain deeper focus.</p>
            </div>

            {/* Close */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onDismiss}
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center text-on-surface-variant hover:text-primary transition-colors z-20"
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
                  ? `${config.focusMinutes}/${String(config.breakMinutes).padStart(2, '0')}`
                  : `${String(totalMinutes).padStart(2, '0')}:00`;
                const targetLabel = methodId === 'sprint' ? 'Interval_Target' : methodId === 'pomodoro' ? 'Cycle_Target' : 'Uptime_Target';
                const filledBars = methodId === 'sprint' ? 4 : methodId === 'pomodoro' ? 3 : 5;
                const monitorId = methodId === 'sprint' ? 'S1' : methodId === 'pomodoro' ? 'P2' : 'D3';

                return (
                  <div
                    key={methodId}
                    className="glass-panel border p-4 flex flex-col group transition-all relative"
                    style={{
                      borderColor: `rgba(${a.rgb},0.1)`,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(${a.rgb},0.4)`; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px rgba(${a.rgb},0.15)`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(${a.rgb},0.1)`; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    {/* L-bracket corners */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: `rgba(${a.rgb},0.3)` }} />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: `rgba(${a.rgb},0.3)` }} />

                    {/* Icon + time */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 border" style={{ backgroundColor: `rgba(${a.rgb},0.1)`, borderColor: `rgba(${a.rgb},0.2)` }}>
                        <Icon className="h-5 w-5" style={{ color: a.hex }} />
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[7px] uppercase mb-0.5" style={{ color: a.hex }}>{targetLabel}</div>
                        <div className="font-headline text-xl font-light text-on-surface">{timeLabel}</div>
                      </div>
                    </div>

                    {/* Title + description */}
                    <h2 className="font-headline text-base font-black tracking-tight text-on-surface mb-1">
                      {METHOD_NEURAL_LABELS[methodId]}
                    </h2>
                    <p className="font-mono text-[9px] text-on-surface-variant leading-relaxed mb-3 min-h-[2.5rem]">
                      {METHOD_DESCRIPTIONS[methodId]}
                    </p>

                    <div className="space-y-3 mt-auto">
                      {/* Rhythm monitor */}
                      <div className="bg-black/40 p-2 border border-outline-variant/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono text-[7px] tracking-widest uppercase" style={{ color: `rgba(${a.rgb},0.6)` }}>
                            Rhythm_Monitor_{monitorId}
                          </span>
                          <span className="font-mono text-[7px]" style={{ color: a.hex }}>{hz} HZ</span>
                        </div>
                        <div className="flex gap-0.5 h-2">
                          {Array.from({ length: 8 }, (_, i) => (
                            <div
                              key={i}
                              className="flex-1"
                              style={{
                                backgroundColor: i < filledBars
                                  ? `rgba(${a.rgb},${0.8 - i * 0.15})`
                                  : 'rgba(255,255,255,0.05)'
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border-l pl-2" style={{ borderColor: `rgba(${a.rgb},0.3)` }}>
                          <div className="font-mono text-[6px] text-on-surface-variant uppercase">{stats[0]}</div>
                          <div className="font-headline text-[9px] font-bold text-on-surface uppercase">{stats[1]}</div>
                        </div>
                        <div className="border-l pl-2" style={{ borderColor: `rgba(${a.rgb},0.3)` }}>
                          <div className="font-mono text-[6px] text-on-surface-variant uppercase">{stats[2]}</div>
                          <div className="font-headline text-[9px] font-bold text-on-surface uppercase">{stats[3]}</div>
                        </div>
                      </div>

                      {/* CTA */}
                      <button
                        type="button"
                        onClick={() => onStart(config)}
                        className="w-full py-2.5 font-headline font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all uppercase"
                        style={{ backgroundColor: a.hex, color: '#0c0e10' }}
                      >
                        EXECUTE_PROTOCOL
                        <CtaIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Footer */}
            <footer className="border-t border-outline-variant/20 pt-4 flex justify-end">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="border border-outline-variant/40 px-3 py-2 font-mono text-[9px] text-on-surface-variant uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-colors"
                >
                  CONFIG
                </button>
                <button
                  type="button"
                  onClick={() => onStart(freeReadConfig)}
                  className="border border-outline-variant/40 px-3 py-2 font-mono text-[9px] text-on-surface-variant uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-colors"
                >
                  FREE READ
                </button>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
