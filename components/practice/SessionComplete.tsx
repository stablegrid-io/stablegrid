'use client';

import { motion } from 'framer-motion';
import { Award, Clock, Target, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PulseMascot } from '@/components/mascot/PulseMascot';
import { formatUnitsAsKwh } from '@/lib/energy';
import { usePulseMascotStore } from '@/lib/stores/usePulseMascotStore';

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

export const SessionComplete = ({
  stats,
  topic,
  onRestart
}: SessionCompleteProps) => {
  const router = useRouter();
  const pulseMood = usePulseMascotStore((state) => state.mood);
  const pulseMotion = usePulseMascotStore((state) => state.motion);
  const pulseAction = usePulseMascotStore((state) => state.action);

  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
      : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-500"
        >
          <Award className="h-8 w-8 text-white" />
        </motion.div>

        <h1 className="text-headline mb-2">Session Complete</h1>
        <p className="text-body">Great work on your {topic} practice session</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-500" />
            <span className="text-caption">Accuracy</span>
          </div>
          <div className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            {accuracy}%
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success-500" />
            <span className="text-caption">Energy Earned</span>
          </div>
          <div className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            +{formatUnitsAsKwh(stats.totalXP)}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Award className="h-4 w-4 text-brand-500" />
            <span className="text-caption">Correct</span>
          </div>
          <div className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            {stats.correctAnswers}/{stats.totalQuestions}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
            <span className="text-caption">Time</span>
          </div>
          <div className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            {formatTime(stats.timeSpent)}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-brand-200/70 bg-gradient-to-b from-brand-50 to-teal-50 dark:border-brand-700/40 dark:from-brand-900/20 dark:to-teal-900/10">
            <PulseMascot mood={pulseMood} motion={pulseMotion} action={pulseAction} size={84} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Pulse synchronized this session
            </p>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Verified answer energy has been injected into your grid profile.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6 text-center">
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {accuracy >= 90 &&
            "Outstanding performance! You're mastering this topic."}
          {accuracy >= 70 &&
            accuracy < 90 &&
            'Great work! Keep practicing to improve further.'}
          {accuracy >= 50 &&
            accuracy < 70 &&
            'Good effort. Review the explanations and try again.'}
          {accuracy < 50 &&
            'Keep going! Consistent practice will improve your skills.'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={onRestart} className="btn btn-secondary flex-1">
          Practice Again
        </button>
        <button
          onClick={() => router.push('/flashcards')}
          className="btn btn-primary flex-1"
        >
          Choose New Topic
        </button>
      </div>
    </motion.div>
  );
};
