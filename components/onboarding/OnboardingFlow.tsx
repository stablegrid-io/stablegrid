'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Flame,
  LayoutGrid,
  Rocket,
  ShieldAlert,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import {
  trackProductEvent,
  trackProductEventOnce
} from '@/lib/analytics/productAnalytics';

interface OnboardingFlowProps {
  displayName: string;
}

type Goal = 'theory' | 'practice' | 'missions' | 'all';
type Topic = 'pyspark' | 'fabric';
type Level = 'beginner' | 'intermediate' | 'advanced';

const TOPICS: Array<{ id: Topic; label: string; description: string; icon: React.ReactNode; color: string }> = [
  {
    id: 'pyspark',
    label: 'PySpark',
    description: 'Distributed data processing at scale with Spark 3.4+',
    icon: <Flame className="h-5 w-5" />,
    color: 'border-orange-500/40 bg-orange-500/10 text-orange-500'
  },
  {
    id: 'fabric',
    label: 'Microsoft Fabric',
    description: 'Unified analytics — Lakehouse, pipelines, and governance',
    icon: <LayoutGrid className="h-5 w-5" />,
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-500'
  }
];

const GOALS: Array<{ id: Goal; label: string; description: string; icon: React.ReactNode }> = [
  {
    id: 'theory',
    label: 'Learn concepts',
    description: 'Work through structured theory chapters at my own pace',
    icon: <BookOpen className="h-5 w-5" />
  },
  {
    id: 'practice',
    label: 'Practice questions',
    description: 'Drill questions and build accuracy across topics',
    icon: <Target className="h-5 w-5" />
  },
  {
    id: 'missions',
    label: 'Tackle missions',
    description: 'Solve real incident scenarios with production constraints',
    icon: <ShieldAlert className="h-5 w-5" />
  },
  {
    id: 'all',
    label: 'Everything',
    description: 'Mix theory, practice, and missions — the full experience',
    icon: <Sparkles className="h-5 w-5" />
  }
];

const LEVELS: Array<{ id: Level; label: string; description: string }> = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: "I'm new to data engineering or this specific topic"
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: "I know the basics and want to sharpen my skills"
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: "I'm experienced — looking for gaps and hard challenges"
  }
];

const FIRST_STEP_DESTINATIONS: Record<Goal, string> = {
  theory: '/theory',
  practice: '/practice/setup',
  missions: '/missions',
  all: '/theory'
};

const STEPS = ['welcome', 'topics', 'goal', 'level', 'ready'] as const;
type Step = (typeof STEPS)[number];

export function OnboardingFlow({ displayName }: OnboardingFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedTopics, setSelectedTopics] = useState<Set<Topic>>(new Set());
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const signupTrackedRef = useRef(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  const toggleTopic = (topic: Topic) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  const canAdvance = () => {
    if (step === 'welcome') return true;
    if (step === 'topics') return selectedTopics.size > 0;
    if (step === 'goal') return selectedGoal !== null;
    if (step === 'level') return selectedLevel !== null;
    return true;
  };

  const advance = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1]);
    }
  };

  useEffect(() => {
    if (signupTrackedRef.current) {
      return;
    }

    if (searchParams.get('signup') !== '1') {
      return;
    }

    signupTrackedRef.current = true;
    void trackProductEventOnce('signup_completed', 'signup_completed', {
      method: searchParams.get('method') ?? 'unknown'
    });
  }, [searchParams]);

  const finish = async () => {
    setIsFinishing(true);
    const destination = selectedGoal ? FIRST_STEP_DESTINATIONS[selectedGoal] : '/theory';
    await trackProductEvent('onboarding_completed', {
      selectedTopics: Array.from(selectedTopics),
      selectedGoal,
      selectedLevel,
      destination
    });
    router.push(destination);
  };

  const firstName = displayName.split(' ')[0];

  return (
    <div className="flex min-h-screen flex-col bg-light-bg dark:bg-dark-bg">
      {/* Progress bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 bg-light-border dark:bg-dark-border">
        <div
          className="h-full bg-brand-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16">

        {/* Step indicator */}
        <div className="mb-10 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold transition-all duration-300 ${
                  i < stepIndex
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : i === stepIndex
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                      : 'border-light-border bg-transparent text-text-light-tertiary dark:border-dark-border dark:text-text-dark-tertiary'
                }`}
              >
                {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-8 transition-all duration-500 ${
                    i < stepIndex ? 'bg-brand-500' : 'bg-light-border dark:bg-dark-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Welcome ── */}
        {step === 'welcome' && (
          <div className="w-full text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10">
              <Zap className="h-8 w-8 text-brand-500" />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
              Welcome to StableGrid
            </p>
            <h1 className="font-display text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Hey, {firstName} 👋
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
              You&apos;re about to start building serious data engineering skills. Let&apos;s take 60 seconds to personalise your experience before you dive in.
            </p>

            <div className="mx-auto mt-10 grid max-w-sm grid-cols-3 gap-4 text-center">
              {[
                { icon: <BookOpen className="mx-auto mb-2 h-5 w-5 text-brand-500" />, label: 'Theory chapters' },
                { icon: <Brain className="mx-auto mb-2 h-5 w-5 text-brand-500" />, label: 'Practice questions' },
                { icon: <ShieldAlert className="mx-auto mb-2 h-5 w-5 text-brand-500" />, label: 'Live missions' }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface"
                >
                  {item.icon}
                  <p className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Topics ── */}
        {step === 'topics' && (
          <div className="w-full">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
                Step 1 of 3
              </p>
              <h2 className="font-display text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
                What do you want to learn?
              </h2>
              <p className="mt-3 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Pick one or more. You can explore all topics anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TOPICS.map((topic) => {
                const selected = selectedTopics.has(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className={`group relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                      selected
                        ? 'border-brand-500/50 bg-brand-500/8 shadow-[0_0_0_3px_rgba(var(--color-brand-500)/0.12)]'
                        : 'border-light-border bg-light-surface hover:border-brand-500/30 dark:border-dark-border dark:bg-dark-surface'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${topic.color}`}>
                      {topic.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                        {topic.label}
                      </p>
                      <p className="mt-0.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {topic.description}
                      </p>
                    </div>
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        selected
                          ? 'border-brand-500 bg-brand-500'
                          : 'border-light-border dark:border-dark-border'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3: Goal ── */}
        {step === 'goal' && (
          <div className="w-full">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
                Step 2 of 3
              </p>
              <h2 className="font-display text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
                What&apos;s your main goal?
              </h2>
              <p className="mt-3 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                We&apos;ll drop you straight in after this.
              </p>
            </div>

            <div className="space-y-3">
              {GOALS.map((goal) => {
                const selected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                      selected
                        ? 'border-brand-500/50 bg-brand-500/8 shadow-[0_0_0_3px_rgba(var(--color-brand-500)/0.12)]'
                        : 'border-light-border bg-light-surface hover:border-brand-500/30 dark:border-dark-border dark:bg-dark-surface'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        selected
                          ? 'border-brand-500/40 bg-brand-500/15 text-brand-500'
                          : 'border-light-border bg-light-muted text-text-light-tertiary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-tertiary'
                      }`}
                    >
                      {goal.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                        {goal.label}
                      </p>
                      <p className="mt-0.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {goal.description}
                      </p>
                    </div>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        selected
                          ? 'border-brand-500 bg-brand-500'
                          : 'border-light-border dark:border-dark-border'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 4: Level ── */}
        {step === 'level' && (
          <div className="w-full">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
                Step 3 of 3
              </p>
              <h2 className="font-display text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
                What&apos;s your current level?
              </h2>
              <p className="mt-3 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                No wrong answer — this just sets a starting point.
              </p>
            </div>

            <div className="space-y-3">
              {LEVELS.map((level) => {
                const selected = selectedLevel === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setSelectedLevel(level.id)}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                      selected
                        ? 'border-brand-500/50 bg-brand-500/8 shadow-[0_0_0_3px_rgba(var(--color-brand-500)/0.12)]'
                        : 'border-light-border bg-light-surface hover:border-brand-500/30 dark:border-dark-border dark:bg-dark-surface'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                        {level.label}
                      </p>
                      <p className="mt-0.5 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {level.description}
                      </p>
                    </div>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        selected
                          ? 'border-brand-500 bg-brand-500'
                          : 'border-light-border dark:border-dark-border'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 5: Ready ── */}
        {step === 'ready' && (
          <div className="w-full text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10">
              <Rocket className="h-8 w-8 text-brand-500" />
            </div>
            <h2 className="font-display text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
              You&apos;re all set!
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
              Here&apos;s your plan based on your answers:
            </p>

            <div className="mx-auto mt-8 max-w-sm space-y-3 text-left">
              {selectedTopics.size > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10">
                    <BookOpen className="h-4 w-4 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                      Topics
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {Array.from(selectedTopics)
                        .map((t) => TOPICS.find((tp) => tp.id === t)?.label)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {selectedGoal && (
                <div className="flex items-start gap-3 rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10">
                    <Target className="h-4 w-4 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                      Goal
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {GOALS.find((g) => g.id === selectedGoal)?.label}
                    </p>
                  </div>
                </div>
              )}

              {selectedLevel && (
                <div className="flex items-start gap-3 rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10">
                    <Zap className="h-4 w-4 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                      Level
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {LEVELS.find((l) => l.id === selectedLevel)?.label}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-10 flex w-full items-center justify-between">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setStep(STEPS[stepIndex - 1])}
              className="text-sm font-medium text-text-light-tertiary transition-colors hover:text-text-light-primary dark:text-text-dark-tertiary dark:hover:text-text-dark-primary"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step === 'ready' ? (
            <button
              type="button"
              onClick={finish}
              disabled={isFinishing}
              className="btn btn-primary gap-2 px-6 py-2.5 text-sm"
            >
              {isFinishing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Loading...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Let&apos;s go
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={advance}
              disabled={!canAdvance()}
              className="btn btn-primary gap-2 px-6 py-2.5 text-sm disabled:opacity-40"
            >
              {step === 'welcome' ? 'Get started' : 'Continue'}
              {step === 'welcome' ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Skip link */}
        {step !== 'ready' && (
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 text-xs text-text-light-tertiary transition-colors hover:text-text-light-secondary dark:text-text-dark-tertiary dark:hover:text-text-dark-secondary"
          >
            Skip setup — take me to the dashboard
          </button>
        )}
      </div>
    </div>
  );
}
