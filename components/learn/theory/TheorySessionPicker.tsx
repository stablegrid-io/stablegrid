'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Brain, Clock3, Settings2, Zap, X, Play } from 'lucide-react';
import {
  THEORY_SESSION_METHODS,
  buildTheorySessionTimeline,
  formatTheorySessionDuration,
  getTheorySessionMethod,
  getTheorySessionTotalMinutes,
  type TheorySessionConfig,
  type TheorySessionMethodId
} from '@/lib/learn/theorySession';

const SESSION_METHOD_ORDER: TheorySessionMethodId[] = [
  'sprint',
  'pomodoro',
  'deep-focus',
  'free-read'
];

const METHOD_NEURAL_LABELS: Record<TheorySessionMethodId, string> = {
  sprint: 'NEURAL_SPRINT',
  pomodoro: 'POMODORO_LINK',
  'deep-focus': 'DEEP_RECURSION',
  'free-read': 'OPEN_ARCHIVE'
};

const METHOD_DESCRIPTIONS: Record<TheorySessionMethodId, string> = {
  sprint: 'High-intensity synaptic firing. 15m bursts.',
  pomodoro: 'Standard rhythmic cycling. 25/5 interval.',
  'deep-focus': 'Full sensory isolation. 90m session.',
  'free-read': 'Manual intake control. Unmetered flow.'
};

const getSuggestedMethodId = (
  lessonDurationMinutes: number
): TheorySessionMethodId => {
  if (lessonDurationMinutes <= 18) return 'sprint';
  if (lessonDurationMinutes >= 45) return 'deep-focus';
  return 'pomodoro';
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

const methodIconMap = {
  pomodoro: Clock3,
  'deep-focus': Brain,
  sprint: Zap,
  'free-read': BookOpen
} satisfies Record<TheorySessionMethodId, typeof Clock3>;

export const TheorySessionPicker = ({
  isOpen,
  configsByMethod,
  lessonTitle,
  lessonDurationMinutes,
  onStart,
  onOpenSettings,
  onDismiss
}: TheorySessionPickerProps) => {
  const suggestedMethodId = useMemo(
    () => getSuggestedMethodId(lessonDurationMinutes),
    [lessonDurationMinutes]
  );
  const orderedMethods = useMemo(
    () =>
      SESSION_METHOD_ORDER.map((methodId) =>
        THEORY_SESSION_METHODS.find((method) => method.id === methodId)
      ).filter((method): method is (typeof THEORY_SESSION_METHODS)[number] => Boolean(method)),
    []
  );
  const [selectedMethodId, setSelectedMethodId] = useState<TheorySessionMethodId>(
    suggestedMethodId
  );
  const selectedConfig = configsByMethod[selectedMethodId];
  const selectedMethod = getTheorySessionMethod(selectedMethodId);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const methodButtonRefs = useRef<Record<TheorySessionMethodId, HTMLButtonElement | null>>({
    pomodoro: null,
    'deep-focus': null,
    sprint: null,
    'free-read': null
  });

  useEffect(() => {
    if (!isOpen) return;
    setSelectedMethodId(suggestedMethodId);
  }, [isOpen, suggestedMethodId]);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      previouslyFocusedElementRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const focusTarget =
        methodButtonRefs.current[selectedMethodId] ?? closeButtonRef.current;
      focusTarget?.focus();
      wasOpenRef.current = true;
      return;
    }
    if (!isOpen && wasOpenRef.current) {
      previouslyFocusedElementRef.current?.focus?.();
      wasOpenRef.current = false;
    }
  }, [isOpen, selectedMethodId]);

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

  const totalMinutes = selectedConfig ? getTheorySessionTotalMinutes(selectedConfig) : 0;
  const segments = selectedConfig ? buildTheorySessionTimeline(selectedConfig) : [];
  const totalSegmentMinutes = segments.reduce((sum, s) => sum + s.minutes, 0);
  const segmentCount = 16;
  const focusRatio = totalSegmentMinutes > 0
    ? segments.filter(s => s.kind === 'focus').reduce((sum, s) => sum + s.minutes, 0) / totalSegmentMinutes
    : 1;
  const filledSegments = Math.round(focusRatio * segmentCount);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md"
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
            className="relative z-10 w-full max-w-[54rem] overflow-hidden border border-outline-variant/30 bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
          >
            <div className="flex h-[min(70vh,32rem)]">
              {/* Left: Approach Matrix */}
              <aside className="w-56 flex-shrink-0 border-r border-outline-variant/20 bg-surface-container-low flex flex-col">
                <div className="px-4 pt-4 pb-2">
                  <h3 className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.3em]">
                    APPROACH_MATRIX
                  </h3>
                </div>

                <div className="flex-1 space-y-0">
                  {orderedMethods.map((method, index) => {
                    const isSelected = selectedMethodId === method.id;
                    const Icon = methodIconMap[method.id];

                    return (
                      <button
                        key={method.id}
                        ref={(node) => { methodButtonRefs.current[method.id] = node; }}
                        type="button"
                        onClick={() => setSelectedMethodId(method.id)}
                        className={`w-full text-left px-4 py-3 transition-colors relative ${
                          isSelected
                            ? 'bg-primary/10 border-l-3 border-primary'
                            : 'border-l-3 border-transparent hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className={`h-4 w-4 mt-0.5 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`font-headline font-bold text-xs uppercase truncate ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                                {METHOD_NEURAL_LABELS[method.id]}
                              </span>
                              <span className="font-mono text-[8px] text-on-surface-variant flex-shrink-0">
                                [{String(index + 1).padStart(2, '0')}]
                              </span>
                            </div>
                            <p className="font-mono text-[9px] text-on-surface-variant mt-0.5 leading-snug truncate">
                              {METHOD_DESCRIPTIONS[method.id]}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="px-4 py-2 border-t border-outline-variant/20 font-mono text-[8px] text-on-surface-variant space-y-0.5">
                  <div>&gt; SYNC: OK</div>
                  <div>&gt; LOAD: 12%</div>
                </div>
              </aside>

              {/* Right: Protocol Detail */}
              <main className="flex-1 flex flex-col bg-surface overflow-y-auto">
                {/* Close button */}
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Dismiss"
                  onClick={onDismiss}
                  className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center border border-outline-variant/30 text-on-surface-variant transition-colors hover:text-primary hover:border-primary/40 z-20"
                >
                  <X className="h-3 w-3" />
                </button>

                {selectedMethod && selectedConfig ? (
                  <div className="flex-1 flex flex-col p-5">
                    {/* Protocol header */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="font-mono text-[9px] text-primary tracking-[0.3em] uppercase mb-2">
                          PROTOCOL // {selectedMethod.id.toUpperCase().replace('-', '_')}_V1.0
                        </div>
                        <h2 className="font-headline text-3xl font-black text-on-surface uppercase tracking-tight">
                          {METHOD_NEURAL_LABELS[selectedMethod.id]}
                        </h2>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">
                          SESSION_ESTIMATE
                        </div>
                        <div className="text-2xl font-headline font-black text-on-surface mt-1">
                          {selectedMethod.isTimed ? (
                            <>
                              {String(totalMinutes).padStart(2, '0')}:00
                              <span className="text-sm text-on-surface-variant ml-1">MIN</span>
                            </>
                          ) : (
                            <span className="text-lg text-on-surface-variant">OPEN</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cognitive Frequency Map */}
                    <div className="mb-5">
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-mono text-[9px] text-primary uppercase tracking-[0.2em]">
                          COGNITIVE_FREQUENCY_MAP
                        </span>
                        <span className="font-mono text-[9px] text-on-surface-variant">
                          {selectedMethod.isTimed ? `${(focusRatio * 100).toFixed(1)} HZ` : 'FREEFORM'}
                        </span>
                      </div>
                      <div className="flex gap-1.5 h-7">
                        {Array.from({ length: segmentCount }, (_, i) => (
                          <div
                            key={i}
                            className={`flex-1 transition-all ${
                              i < filledSegments
                                ? 'bg-primary/80'
                                : 'bg-surface-container-highest border border-outline-variant/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-px mb-5">
                      <div className="bg-surface-container p-3 border border-outline-variant/20">
                        <div className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest">
                          SYNAPTIC_LOAD
                        </div>
                        <div className="font-headline text-base font-bold text-on-surface mt-0.5">
                          {selectedMethod.isTimed ? (selectedConfig.focusMinutes >= 25 ? 'HIGH' : 'MED') : 'LOW'}
                        </div>
                      </div>
                      <div className="bg-surface-container p-3 border border-outline-variant/20">
                        <div className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest">
                          RETENTION_ALPHA
                        </div>
                        <div className="font-headline text-base font-bold text-on-surface mt-0.5">
                          {selectedMethod.isTimed ? '0.982' : '0.871'}
                        </div>
                      </div>
                      <div className="bg-surface-container p-3 border border-outline-variant/20">
                        <div className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest">
                          AUTO_ARCHIVE
                        </div>
                        <div className="font-headline text-base font-bold text-primary mt-0.5">
                          ENABLED
                        </div>
                      </div>
                    </div>

                    {/* Description callout */}
                    <div className="border-l-2 border-primary/40 pl-4 py-2 mb-4">
                      <p className="font-mono text-xs text-on-surface-variant leading-relaxed">
                        {selectedMethod.bestFor}
                      </p>
                    </div>

                    <div className="flex-1" />

                    {/* Bottom actions */}
                    <div className="flex items-center justify-between gap-3 border-t border-outline-variant/20 pt-4">
                      <div className="flex items-center gap-2">
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

                      <button
                        type="button"
                        onClick={() => onStart(selectedConfig)}
                        className="bg-primary text-on-primary font-headline font-black text-xs py-3 px-6 flex items-center gap-2 hover:shadow-[0_0_20px_rgba(153,247,255,0.4)] active:scale-[0.98] transition-all uppercase tracking-widest"
                      >
                        START_SESSION
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </main>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
