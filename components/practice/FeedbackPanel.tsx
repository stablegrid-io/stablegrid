'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { formatUnitsAsKwh } from '@/lib/energy';

interface FeedbackPanelProps {
  isCorrect: boolean;
  explanation: string;
  correctAnswer: string | string[];
  userAnswer: string;
  xpGained: number;
  onNext: () => void;
  onTryAgain: () => void;
}

export const FeedbackPanel = ({
  isCorrect,
  explanation,
  correctAnswer,
  userAnswer,
  xpGained,
  onNext,
  onTryAgain
}: FeedbackPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div
        className={`flex items-start gap-3 rounded-lg border p-4 ${
          isCorrect
            ? 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/10'
            : 'border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/10'
        }`}
      >
        {isCorrect ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success-600 dark:text-success-400" />
        ) : (
          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error-600 dark:text-error-400" />
        )}
        <div className="flex-1">
          <h3
            className={`font-semibold ${
              isCorrect
                ? 'text-success-900 dark:text-success-100'
                : 'text-error-900 dark:text-error-100'
            }`}
          >
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </h3>
          {isCorrect && (
            <p className="mt-0.5 text-sm text-success-700 dark:text-success-300">
              +{formatUnitsAsKwh(xpGained)} earned
            </p>
          )}
        </div>
      </div>

      {!isCorrect && (
        <div className="card space-y-3 p-4">
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
              Your answer
            </div>
            <code className="rounded bg-light-muted px-2 py-1 text-sm text-text-light-secondary dark:bg-dark-muted dark:text-text-dark-secondary">
              {userAnswer || '—'}
            </code>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-success-600 dark:text-success-400">
              Correct answer
            </div>
            <code className="rounded bg-success-50 px-2 py-1 text-sm text-text-light-primary dark:bg-success-900/20 dark:text-text-dark-primary">
              {Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer}
            </code>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" />
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
              Explanation
            </div>
            <p className="text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
              {explanation}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {!isCorrect && (
          <button onClick={onTryAgain} className="btn btn-secondary flex-1">
            Try Again
          </button>
        )}
        <button onClick={onNext} className="btn btn-primary flex-1">
          Next Question
        </button>
      </div>
    </motion.div>
  );
};
