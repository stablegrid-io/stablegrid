'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, Clock, Target, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { formatUnitsAsKwh } from '@/lib/energy';

interface SessionStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  totalXP: number;
  timeSpent: number;
}

interface SessionCompleteProps {
  stats: SessionStats;
  topic: string;
  onRestart: () => void;
}

type PerformanceState = 'struggling' | 'recovering' | 'steady' | 'strong' | 'elite';

interface PerformanceProfile {
  state: PerformanceState;
  label: string;
  heroLine: string;
  statusTitle: string;
  statusBody: string;
  summary: string;
  nextAction: string;
  badgeClassName: string;
  dotClassName: string;
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  delay: number;
}

const PERFORMANCE_PROFILES: Record<PerformanceState, Omit<PerformanceProfile, 'state'>> = {
  struggling: {
    label: 'Recovery mode',
    heroLine: 'Tough round. Accuracy dipped, but this session still exposed exactly where to focus.',
    statusTitle: 'Stability needs another pass',
    statusBody: 'No problem. A short retry on missed concepts will quickly rebuild momentum.',
    summary: 'This run identified weak spots that are now actionable.',
    nextAction: 'Replay 5 focused questions, then run a full set again.',
    badgeClassName:
      'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-700/70 dark:bg-warning-900/30 dark:text-warning-300',
    dotClassName: 'bg-warning-500'
  },
  recovering: {
    label: 'Warm-up mode',
    heroLine: 'You are rebuilding consistency. The trend is improving and control is returning.',
    statusTitle: 'Momentum is returning',
    statusBody: 'Keep sessions short and precise to close the remaining weak spots.',
    summary: 'You are close to stable performance with just a bit more repetition.',
    nextAction: 'Review mistakes, then run one timed session with no skips.',
    badgeClassName:
      'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-700/70 dark:bg-brand-900/30 dark:text-brand-300',
    dotClassName: 'bg-brand-500'
  },
  steady: {
    label: 'Stable output',
    heroLine: 'Solid session. You maintained reliable accuracy across the run.',
    statusTitle: 'Session stabilized',
    statusBody: 'Consistency is building. Keep this pace to compound learning gains.',
    summary: 'You are building durable skill, not luck-driven streaks.',
    nextAction: 'Increase difficulty slightly while preserving accuracy.',
    badgeClassName:
      'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-700/70 dark:bg-brand-900/30 dark:text-brand-300',
    dotClassName: 'bg-brand-500'
  },
  strong: {
    label: 'High output',
    heroLine: 'Strong run. Correctness and pace were both consistently high.',
    statusTitle: 'High-confidence execution',
    statusBody: 'Excellent result. You can safely push harder on complexity next.',
    summary: 'Great execution with low performance drag across the full session.',
    nextAction: 'Attempt advanced questions and keep skip rate near zero.',
    badgeClassName:
      'border-success-200 bg-success-50 text-success-700 dark:border-success-700/70 dark:bg-success-900/30 dark:text-success-300',
    dotClassName: 'bg-success-500'
  },
  elite: {
    label: 'Precision surge',
    heroLine: 'Elite run. Near-perfect control across speed, correctness, and focus.',
    statusTitle: 'Peak performance reached',
    statusBody: 'Mission-grade output. This is the right moment to tackle hardest material.',
    summary: 'Top-tier result with very little wasted motion.',
    nextAction: 'Jump into an advanced mission while this precision is hot.',
    badgeClassName:
      'border-brand-300 bg-brand-100 text-brand-700 dark:border-brand-600/80 dark:bg-brand-900/35 dark:text-brand-200',
    dotClassName: 'bg-brand-500'
  }
};

function resolvePerformanceState(stats: SessionStats, accuracy: number): PerformanceState {
  const total = Math.max(1, stats.totalQuestions);
  const skipRate = stats.skippedQuestions / total;
  const secPerQuestion = stats.timeSpent / total;

  if (accuracy < 45 || skipRate >= 0.45 || stats.correctAnswers <= 1) return 'struggling';
  if (accuracy < 65 || skipRate >= 0.25) return 'recovering';
  if (accuracy < 85) return 'steady';
  if (accuracy >= 97 && skipRate <= 0.05 && secPerQuestion <= 16) return 'elite';
  return 'strong';
}

function StatCard({ icon, label, value, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="card flex flex-col items-center p-4 text-center"
    >
      <div className="mb-2 flex items-center justify-center gap-2">
        {icon}
        <span className="text-caption">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
        {value}
      </div>
    </motion.div>
  );
}

export const SessionComplete = ({ stats, topic, onRestart }: SessionCompleteProps) => {
  const router = useRouter();

  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
      : 0;

  const performanceState = useMemo(
    () => resolvePerformanceState(stats, accuracy),
    [accuracy, stats]
  );

  const performanceProfile = useMemo<PerformanceProfile>(
    () => ({
      state: performanceState,
      ...PERFORMANCE_PROFILES[performanceState]
    }),
    [performanceState]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sessionDescriptor = useMemo(() => {
    const lowered = topic.toLowerCase();
    return lowered.includes('flash') ? 'flashcard' : 'practice';
  }, [topic]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative mx-auto w-full max-w-3xl space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl border border-brand-300/40 bg-white p-6 dark:border-[#1f2a2f] dark:bg-[#0d1115] sm:p-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:34px_34px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,rgba(16,185,129,0)_70%)]" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.15)_0%,rgba(34,197,94,0)_72%)]" />

        <div className="relative z-10 text-center">
          <div className="mb-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${performanceProfile.badgeClassName}`}
            >
              {performanceProfile.label}
            </span>
          </div>

          <h1 className="text-headline mb-2">Session Complete</h1>
          <p className="text-body">{performanceProfile.heroLine}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
            {topic} {sessionDescriptor} report
          </p>

          <div className="mx-auto mt-6 grid max-w-xl grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <motion.div
                key={index}
                initial={{ scaleY: 0.2, opacity: 0.45 }}
                animate={{
                  scaleY: [0.45, 1, 0.62, 0.9],
                  opacity: [0.5, 1, 0.65, 0.9]
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.12
                }}
                className="h-9 rounded-full bg-gradient-to-t from-brand-600/25 to-brand-300/60"
                style={{ transformOrigin: 'bottom' }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Target className="h-4 w-4 text-brand-500" />}
          label="Accuracy"
          value={`${accuracy}%`}
          delay={0.08}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-success-500" />}
          label="Energy Earned"
          value={`+${formatUnitsAsKwh(stats.totalXP)}`}
          delay={0.14}
        />
        <StatCard
          icon={<Award className="h-4 w-4 text-brand-500" />}
          label="Correct"
          value={`${stats.correctAnswers}/${stats.totalQuestions}`}
          delay={0.2}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-text-light-tertiary dark:text-text-dark-tertiary" />}
          label="Time"
          value={formatTime(stats.timeSpent)}
          delay={0.26}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.22 }}
        className="card p-4"
      >
        <div className="flex items-start gap-3">
          <div className={`mt-1 h-2 w-2 rounded-full ${performanceProfile.dotClassName}`} />
          <div>
            <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              {performanceProfile.statusTitle}
            </p>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {performanceProfile.statusBody}
            </p>
            <p className="mt-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              Next: {performanceProfile.nextAction}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
        className="card p-6 text-center"
      >
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {performanceProfile.summary}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.38 }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <button onClick={onRestart} className="btn btn-secondary flex-1">
          Practice Again
        </button>
        <button onClick={() => router.push('/flashcards')} className="btn btn-primary flex-1">
          Choose New Topic
        </button>
      </motion.div>
    </motion.div>
  );
};
