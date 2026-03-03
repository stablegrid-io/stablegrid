'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Brain, Clock3, Settings2, Timer, X, Zap } from 'lucide-react';
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

const getSuggestedMethodId = (
  lessonDurationMinutes: number
): TheorySessionMethodId => {
  if (lessonDurationMinutes <= 18) {
    return 'sprint';
  }

  if (lessonDurationMinutes >= 45) {
    return 'deep-focus';
  }

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

const TimelinePreview = ({ config }: { config: TheorySessionConfig }) => {
  const method = getTheorySessionMethod(config.methodId);

  if (!method) {
    return null;
  }

  if (!method.isTimed) {
    return (
      <div className="rounded-[1.25rem] border border-light-border bg-light-bg px-4 py-4 dark:border-dark-border dark:bg-dark-bg">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
          <span>Rhythm</span>
          <span>No timer</span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-[repeating-linear-gradient(90deg,rgba(17,17,17,0.18)_0_10px,transparent_10px_18px)] dark:bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.22)_0_10px,transparent_10px_18px)]" />
      </div>
    );
  }

  const segments = buildTheorySessionTimeline(config);
  const totalMinutes = getTheorySessionTotalMinutes(config);

  return (
    <div className="rounded-[1.25rem] border border-light-border bg-light-bg px-4 py-4 dark:border-dark-border dark:bg-dark-bg">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
        <span>Rhythm</span>
        <span>{formatTheorySessionDuration(totalMinutes * 60)} total</span>
      </div>

      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
        {segments.map((segment) => (
          <div
            key={segment.key}
            style={{ flex: segment.minutes }}
            className={
              segment.kind === 'focus'
                ? 'bg-text-light-primary dark:bg-text-dark-primary'
                : 'bg-light-hover dark:bg-dark-hover'
            }
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-3 rounded-full bg-text-light-primary dark:bg-text-dark-primary" />
          Focus
        </span>
        {config.breakMinutes > 0 ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-3 rounded-full bg-light-hover dark:bg-dark-hover" />
            Break
          </span>
        ) : null}
      </div>
    </div>
  );
};

const MetaPill = ({
  label,
  value
}: {
  label: string;
  value: string;
}) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-light-border bg-light-bg px-3 py-2 text-sm dark:border-dark-border dark:bg-dark-bg">
    <span className="text-text-light-tertiary dark:text-text-dark-tertiary">{label}</span>
    <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
      {value}
    </span>
  </div>
);

const MethodDetails = ({
  config,
  onOpenSettings,
  onStart,
  onDismiss
}: {
  config: TheorySessionConfig;
  onOpenSettings: () => void;
  onStart: () => void;
  onDismiss: () => void;
}) => {
  const method = getTheorySessionMethod(config.methodId);

  if (!method) {
    return null;
  }

  const Icon = methodIconMap[method.id];
  const totalMinutes = getTheorySessionTotalMinutes(config);

  return (
    <section className="flex h-full flex-col rounded-[1.5rem] border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-light-border bg-light-bg text-text-light-primary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                {method.label}
              </h3>
            </div>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {method.description}
            </p>
          </div>
        </div>

        <div className="hidden text-right text-[11px] uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary sm:block">
          Saved preset
        </div>
      </div>

      <p className="mt-5 max-w-xl text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
        {method.bestFor}
      </p>

      <div className="mt-5">
        <TimelinePreview config={config} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <MetaPill
          label="Focus"
          value={method.isTimed ? `${config.focusMinutes} min` : 'Open'}
        />
        <MetaPill
          label="Break"
          value={method.isTimed ? `${config.breakMinutes} min` : 'None'}
        />
        <MetaPill
          label="Rounds"
          value={method.isTimed ? `${config.rounds}` : '1'}
        />
        <MetaPill
          label="Total"
          value={method.isTimed ? formatTheorySessionDuration(totalMinutes * 60) : 'Open'}
        />
      </div>

      <div className="mt-auto flex flex-col gap-4 border-t border-light-border pt-5 dark:border-dark-border sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onDismiss}
          className="text-left text-sm text-text-light-tertiary transition-colors hover:text-text-light-secondary dark:text-text-dark-tertiary dark:hover:text-text-dark-secondary"
        >
          Continue without session
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 rounded-full border border-light-border px-4 py-2 text-sm font-medium text-text-light-secondary transition-colors hover:border-text-light-primary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-text-dark-primary dark:hover:text-text-dark-primary"
          >
            <Settings2 className="h-4 w-4" />
            Settings
          </button>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-full bg-text-light-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-text-dark-primary dark:text-dark-bg dark:hover:bg-neutral-200"
          >
            <Timer className="h-4 w-4" />
            Start session
          </button>
        </div>
      </div>
    </section>
  );
};

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
  const selectedMethod = getTheorySessionMethod(selectedMethodId) ?? null;
  const selectedConfig = configsByMethod[selectedMethodId];
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
    if (!isOpen) {
      return;
    }

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
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

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

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-md"
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
            className="relative z-10 w-full max-w-[68rem] overflow-hidden rounded-[2rem] border border-light-border bg-light-surface shadow-[0_24px_80px_rgba(17,17,17,0.12)] dark:border-dark-border dark:bg-dark-surface dark:shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
          >
            <div className="border-b border-light-border px-6 py-6 dark:border-dark-border sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-500">
                    Session Tracker
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text-light-primary dark:text-text-dark-primary sm:text-[3rem]">
                    Pick your learning approach
                  </h2>
                  <p className="mt-3 text-base text-text-light-secondary dark:text-text-dark-secondary">
                    {lessonTitle} · about {lessonDurationMinutes} min
                  </p>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Dismiss session picker"
                  onClick={onDismiss}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-light-border text-text-light-secondary transition-colors hover:border-text-light-primary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-text-dark-primary dark:hover:text-text-dark-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-13rem)] overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
                <aside className="rounded-[1.5rem] border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface">
                  <div className="mb-3 flex items-center justify-between px-2">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
                      Approaches
                    </span>
                    <span className="text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
                      4 presets
                    </span>
                  </div>

                  <div className="space-y-2">
                    {orderedMethods.map((method) => {
                      const config = configsByMethod[method.id];
                      const totalMinutes = getTheorySessionTotalMinutes(config);
                      const isSelected = selectedMethod?.id === method.id;
                      const Icon = methodIconMap[method.id];

                      return (
                        <button
                          key={method.id}
                          ref={(node) => {
                            methodButtonRefs.current[method.id] = node;
                          }}
                          type="button"
                          aria-pressed={isSelected}
                          aria-expanded={isSelected}
                          onClick={() => setSelectedMethodId(method.id)}
                          className={`w-full rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${
                            isSelected
                              ? 'border-text-light-primary bg-light-bg dark:border-text-dark-primary dark:bg-dark-bg'
                              : 'border-transparent hover:border-light-border hover:bg-light-bg dark:hover:border-dark-border dark:hover:bg-dark-bg'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-light-border bg-light-surface text-text-light-primary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-primary">
                              <Icon className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                                  {method.label}
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                                {method.description}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                            <span>
                              {method.isTimed
                                ? `${config.focusMinutes} / ${config.breakMinutes} · ${config.rounds} rounds`
                                : 'No timer'}
                            </span>
                            <span>
                              {method.isTimed
                                ? `${formatTheorySessionDuration(totalMinutes * 60)} total`
                                : 'Open'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {selectedConfig ? (
                  <MethodDetails
                    config={selectedConfig}
                    onOpenSettings={onOpenSettings}
                    onStart={() => onStart(selectedConfig)}
                    onDismiss={onDismiss}
                  />
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
