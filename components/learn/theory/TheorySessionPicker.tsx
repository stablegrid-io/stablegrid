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
  sprint: 'NEURAL_SPRINT',
  pomodoro: 'POMODORO_LINK',
  'deep-focus': 'DEEP_RECURSION',
  'free-read': 'OPEN_ARCHIVE'
};

const METHOD_DESCRIPTIONS: Record<TheorySessionMethodId, string> = {
  sprint: 'High-velocity synaptic engagement. Designed for rapid context acquisition and short-burst focus.',
  pomodoro: 'Iterative cognitive pacing. Balanced oscillation between focused work and neural cooling phases.',
  'deep-focus': 'Total immersion protocol. Isolates executive function for sustained complex architecture mapping.',
  'free-read': 'Direct memory access // Unmetered data stream protocol'
};

const METHOD_ACCENTS: Record<TheorySessionMethodId, { color: string; bg: string; border: string; monitor: string }> = {
  sprint:     { color: 'text-primary', bg: 'bg-primary', border: 'border-primary', monitor: 'primary' },
  pomodoro:   { color: 'text-secondary', bg: 'bg-secondary', border: 'border-secondary', monitor: 'secondary' },
  'deep-focus': { color: 'text-error', bg: 'bg-error', border: 'border-error', monitor: 'error' },
  'free-read': { color: 'text-secondary', bg: 'bg-secondary', border: 'border-secondary', monitor: 'secondary' }
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
            className="relative z-10 w-full max-w-[64rem] overflow-y-auto max-h-[90vh] border border-outline-variant/30 bg-surface pt-10 px-6 pb-6 flex flex-col gap-5"
          >
            {/* Close — positioned outside the content padding */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onDismiss}
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center text-on-surface-variant hover:text-primary transition-colors z-20"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Free Read banner */}
            <section
              className="border border-dashed border-primary/20 p-4 flex items-center justify-between cursor-pointer hover:bg-surface-container-high/40 transition-all"
              onClick={() => onStart(freeReadConfig)}
              onKeyDown={(e) => e.key === 'Enter' && onStart(freeReadConfig)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-4">
                <div className="bg-secondary/10 p-2.5 border border-secondary/20">
                  <BookOpen className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-headline text-sm font-bold tracking-widest text-on-surface">OPEN_ARCHIVE_OVERRIDE</h3>
                  <p className="font-mono text-[9px] text-on-surface-variant mt-0.5 uppercase">
                    Direct memory access // Unmetered data stream protocol
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden md:block text-right">
                  <div className="font-mono text-[8px] text-on-surface-variant uppercase">System_State</div>
                  <div className="font-headline text-xs text-secondary font-bold">READY_FOR_SEQUENCING</div>
                </div>
                <div className="border border-secondary px-4 py-1.5 font-mono text-[9px] text-secondary tracking-widest hover:bg-secondary hover:text-surface transition-all uppercase">
                  INITIATE_MANUAL_READ
                </div>
              </div>
            </section>

            {/* 3-column timed method cards */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {TIMED_METHOD_ORDER.map((methodId) => {
                const method = getTheorySessionMethod(methodId);
                if (!method) return null;
                const config = configsByMethod[methodId];
                const totalMinutes = getTheorySessionTotalMinutes(config);
                const accent = METHOD_ACCENTS[methodId];
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
                    className={`glass-panel border ${accent.border}/10 p-6 flex flex-col group hover:${accent.border}/40 transition-all`}
                  >
                    {/* L-bracket corners */}
                    <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${accent.border}/30`} />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${accent.border}/30`} />

                    {/* Icon + time */}
                    <div className="flex justify-between items-start mb-4">
                      <div className={`${accent.bg}/10 p-3 border ${accent.border}/20`}>
                        <Icon className={`h-6 w-6 ${accent.color}`} />
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-[8px] ${accent.color} uppercase mb-0.5`}>{targetLabel}</div>
                        <div className="font-headline text-2xl font-light text-on-surface">{timeLabel}</div>
                      </div>
                    </div>

                    {/* Title + description */}
                    <h2 className="font-headline text-xl font-black tracking-tight text-on-surface mb-1">
                      {METHOD_NEURAL_LABELS[methodId]}
                    </h2>
                    <p className="font-mono text-[10px] text-on-surface-variant leading-relaxed mb-4 min-h-[3rem]">
                      {METHOD_DESCRIPTIONS[methodId]}
                    </p>

                    <div className="space-y-4 mt-auto">
                      {/* Rhythm monitor */}
                      <div className="bg-black/40 p-2.5 border border-outline-variant/20">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`font-mono text-[8px] ${accent.color}/60 tracking-widest uppercase`}>
                            Rhythm_Monitor_{monitorId}
                          </span>
                          <span className={`font-mono text-[8px] ${accent.color}`}>{hz} HZ</span>
                        </div>
                        <div className="flex gap-1 h-2.5">
                          {Array.from({ length: 8 }, (_, i) => (
                            <div
                              key={i}
                              className={`flex-1 ${
                                i < filledBars
                                  ? `${accent.bg}/${80 - i * 15}`
                                  : 'bg-white/5'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`border-l ${accent.border}/30 pl-2`}>
                          <div className="font-mono text-[7px] text-on-surface-variant uppercase">{stats[0]}</div>
                          <div className="font-headline text-[10px] font-bold text-on-surface uppercase">{stats[1]}</div>
                        </div>
                        <div className={`border-l ${accent.border}/30 pl-2`}>
                          <div className="font-mono text-[7px] text-on-surface-variant uppercase">{stats[2]}</div>
                          <div className="font-headline text-[10px] font-bold text-on-surface uppercase">{stats[3]}</div>
                        </div>
                      </div>

                      {/* CTA */}
                      <button
                        type="button"
                        onClick={() => onStart(config)}
                        className={`w-full ${accent.bg} py-3 font-headline font-black text-surface text-xs tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all uppercase`}
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
            <footer className="border-t border-outline-variant/20 pt-4 flex justify-between items-end">
              <div className="bg-black/60 p-3 border border-outline-variant/30 font-mono text-[9px] text-primary/40 leading-tight max-w-md">
                <p>&gt; SYSTEM_READY: WAITING FOR OPERATOR INPUT_</p>
                <p>&gt; {lessonTitle}</p>
              </div>
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
                  onClick={onDismiss}
                  className="border border-outline-variant/40 px-3 py-2 font-mono text-[9px] text-on-surface-variant uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-colors"
                >
                  SKIP
                </button>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
