'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatUnitsAsKwh } from '@/lib/energy';

interface SessionHeaderProps {
  topic: string;
  currentQuestion: number;
  totalQuestions: number;
  progress: number;
  xpEarned: number;
}

export const SessionHeader = ({
  topic,
  currentQuestion,
  totalQuestions,
  progress,
  xpEarned
}: SessionHeaderProps) => {
  return (
    <div className="border-b border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/flashcards" className="btn btn-ghost text-xs">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="h-4 w-px bg-light-border dark:bg-dark-border" />
            <h2 className="text-base font-semibold capitalize">
              {topic} Practice
            </h2>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 dark:border-brand-800 dark:bg-brand-900/20">
            <TrendingUp className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
              +{formatUnitsAsKwh(xpEarned)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              Question {currentQuestion} of {totalQuestions}
            </span>
            <span className="font-medium text-brand-600 dark:text-brand-400">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="relative h-1.5 overflow-hidden rounded-full bg-light-surface dark:bg-dark-surface">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
