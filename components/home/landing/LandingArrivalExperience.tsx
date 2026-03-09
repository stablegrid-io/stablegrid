'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RadioTower, ShieldCheck, Zap } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

const LANDING_ENTRY_SESSION_KEY = 'stablegrid:landing-entry:intro:v1';
const INTRO_DURATION_MS = 2300;
const EXIT_DURATION_MS = 360;

type IntroPhase = 'playing' | 'exiting' | 'complete';

const INTRO_STEPS = [
  {
    title: 'Syncing grid sectors',
    detail: 'Balancing renewable load',
    Icon: Zap
  },
  {
    title: 'Routing operator signals',
    detail: 'Opening mission channels',
    Icon: RadioTower
  },
  {
    title: 'Verifying control rail',
    detail: 'Preparing your command view',
    Icon: ShieldCheck
  }
] as const;

interface LandingArrivalExperienceProps {
  children: ReactNode;
}

const hasSeenLandingIntro = () => {
  try {
    return window.sessionStorage.getItem(LANDING_ENTRY_SESSION_KEY) === 'seen';
  } catch {
    return false;
  }
};

const persistLandingIntroSeen = () => {
  try {
    window.sessionStorage.setItem(LANDING_ENTRY_SESSION_KEY, 'seen');
  } catch {
    // Ignore storage failures (private mode, blocked storage).
  }
};

export const LandingArrivalExperience = ({ children }: LandingArrivalExperienceProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<IntroPhase>('playing');
  const [activeStep, setActiveStep] = useState(0);
  const completedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    timersRef.current = [];
  }, []);

  const finishIntro = useCallback(
    (persistSession: boolean) => {
      if (completedRef.current) {
        return;
      }
      completedRef.current = true;
      clearTimers();

      if (persistSession) {
        persistLandingIntroSeen();
      }

      if (prefersReducedMotion) {
        setPhase('complete');
        return;
      }

      setPhase('exiting');
      const timerId = window.setTimeout(() => {
        setPhase('complete');
      }, EXIT_DURATION_MS);
      timersRef.current.push(timerId);
    },
    [clearTimers, prefersReducedMotion]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const sessionSeen = hasSeenLandingIntro();
    if (prefersReducedMotion || sessionSeen) {
      completedRef.current = true;
      setPhase('complete');
      return;
    }

    setPhase('playing');
    setActiveStep(0);
    completedRef.current = false;
    clearTimers();

    const stepDuration = INTRO_DURATION_MS / INTRO_STEPS.length;
    for (let index = 1; index < INTRO_STEPS.length; index += 1) {
      const timerId = window.setTimeout(() => {
        setActiveStep(index);
      }, Math.round(index * stepDuration));
      timersRef.current.push(timerId);
    }

    const finishTimerId = window.setTimeout(() => {
      finishIntro(true);
    }, INTRO_DURATION_MS);
    timersRef.current.push(finishTimerId);

    return () => {
      clearTimers();
    };
  }, [clearTimers, finishIntro, prefersReducedMotion]);

  const introVisible = phase !== 'complete';
  const interactionLocked = phase === 'playing';
  const progressRatio = Math.max(0, Math.min(1, (activeStep + 1) / INTRO_STEPS.length));

  return (
    <div className="relative">
      <motion.div
        initial={false}
        animate={{
          opacity: introVisible ? 0.24 : 1
        }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className={interactionLocked ? 'pointer-events-none select-none' : undefined}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {introVisible ? (
          <motion.section
            key="landing-entry-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className={`fixed inset-x-0 bottom-0 top-16 z-40 ${
              interactionLocked ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            aria-label="Landing intro sequence"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(58,206,155,0.16),transparent_42%),radial-gradient(circle_at_82%_84%,rgba(74,157,255,0.18),transparent_52%),linear-gradient(180deg,#040907_0%,#030706_56%,#030606_100%)]" />
            <div
              className="absolute inset-0 opacity-35"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(81,190,154,0.13) 1px, transparent 1px), linear-gradient(to bottom, rgba(81,190,154,0.13) 1px, transparent 1px)',
                backgroundSize: '46px 46px'
              }}
            />

            <div className="relative mx-auto flex h-full w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.99 }}
                transition={{ duration: 0.46, ease: [0.2, 0.9, 0.25, 1] }}
                className="relative w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-[#2a5a48]/80 bg-[linear-gradient(165deg,rgba(6,18,13,0.96),rgba(4,14,10,0.98)_56%,rgba(3,10,8,0.99)_100%)] px-5 py-5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#87d6b5]">
                      Grid Mission Boot
                    </p>
                    <h2
                      className="mt-2 text-[clamp(1.6rem,3.5vw,2.35rem)] font-semibold tracking-[-0.04em] text-[#ebf7f1]"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      Stand by. Your control rail is coming online.
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => finishIntro(true)}
                    className="rounded-full border border-[#2f5e4a] bg-[#0c1a14]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ad8bc] transition-colors hover:border-[#4f9978] hover:text-[#d6f7e8]"
                  >
                    Skip
                  </button>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-[152px_1fr] md:items-center">
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: prefersReducedMotion ? 0.01 : 8,
                        ease: 'linear',
                        repeat: prefersReducedMotion ? 0 : Infinity
                      }}
                      className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[#4b9679]/55 bg-[radial-gradient(circle_at_30%_25%,rgba(96,255,191,0.26),rgba(13,37,28,0.7)_45%,rgba(6,20,14,0.95)_100%)]"
                    >
                      <motion.div
                        animate={{ scale: [0.82, 1, 0.82], opacity: [0.4, 0.9, 0.4] }}
                        transition={{
                          duration: prefersReducedMotion ? 0.01 : 2.4,
                          repeat: prefersReducedMotion ? 0 : Infinity,
                          ease: 'easeInOut'
                        }}
                        className="absolute h-14 w-14 rounded-full border border-[#8ce6bf]/55"
                      />
                      <motion.div
                        animate={{ scale: [0.94, 1.14, 0.94], opacity: [0.24, 0.6, 0.24] }}
                        transition={{
                          duration: prefersReducedMotion ? 0.01 : 2.6,
                          repeat: prefersReducedMotion ? 0 : Infinity,
                          ease: 'easeInOut',
                          delay: 0.3
                        }}
                        className="absolute h-20 w-20 rounded-full border border-[#6ec8a2]/35"
                      />
                      <Zap className="relative h-7 w-7 text-[#93f0c8]" />
                    </motion.div>
                  </div>

                  <div>
                    <div className="space-y-2.5">
                      {INTRO_STEPS.map((step, index) => {
                        const status =
                          index < activeStep ? 'complete' : index === activeStep ? 'active' : 'pending';
                        const Icon = step.Icon;
                        return (
                          <div
                            key={step.title}
                            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${
                              status === 'active'
                                ? 'border-[#5ebf96]/85 bg-[#133126]/95'
                                : status === 'complete'
                                  ? 'border-[#3a715b]/70 bg-[#102219]/92'
                                  : 'border-[#284539]/60 bg-[#0a1712]/90'
                            }`}
                          >
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
                                status === 'active'
                                  ? 'border-[#7ee8bb]/80 bg-[#164735] text-[#a6ffd8]'
                                  : status === 'complete'
                                    ? 'border-[#568f77]/80 bg-[#153427] text-[#9ee4c5]'
                                    : 'border-[#325444] bg-[#0f241b] text-[#6d9f88]'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  status === 'pending' ? 'text-[#7ca594]' : 'text-[#e2f4ea]'
                                }`}
                              >
                                {step.title}
                              </p>
                              <p className="text-xs text-[#8eb4a3]">{step.detail}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8ec8ad]">
                        <span>Launch progress</span>
                        <span>{Math.round(progressRatio * 100)}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full border border-[#356350] bg-[#08140f]">
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: `${Math.round(progressRatio * 100)}%` }}
                          transition={{ duration: 0.36, ease: [0.34, 0.86, 0.44, 1] }}
                          className="h-full rounded-full bg-[linear-gradient(90deg,#46d99c_0%,#6be0bd_58%,#77bdff_100%)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
