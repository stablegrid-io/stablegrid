'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Question } from '@/lib/types';
import { Button } from '@/components/ui/Button';

interface FeedbackPanelProps {
  isCorrect: boolean;
  question: Question;
  userAnswer: string;
  onNext: () => void;
  onRetry: () => void;
}

export function FeedbackPanel({
  isCorrect,
  question,
  userAnswer,
  onNext,
  onRetry
}: FeedbackPanelProps) {
  const [showSolution, setShowSolution] = useState(false);
  const correctAnswers = Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [question.correctAnswer];

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180 }}
      className={`rounded-3xl border p-6 ${
        isCorrect
          ? 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/10'
          : 'border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/10'
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          {isCorrect ? 'Correct!' : 'Not quite.'}{' '}
          <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {isCorrect ? `+${question.xpReward} XP` : 'Keep going'}
          </span>
        </div>

        {!isCorrect && (
          <div className="rounded-2xl border border-light-border bg-light-muted p-4 text-sm text-text-light-secondary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-secondary">
            <p className="text-xs uppercase tracking-[0.2em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Your answer
            </p>
            <p className="mt-2 whitespace-pre-wrap">{userAnswer || '—'}</p>
          </div>
        )}

        {(isCorrect || showSolution) && (
          <div className="rounded-2xl border border-light-border bg-light-muted p-4 text-sm text-text-light-secondary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-secondary">
            <p className="text-xs uppercase tracking-[0.2em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Correct answer
            </p>
            <div className="mt-2 space-y-2 whitespace-pre-wrap">
              {correctAnswers.map((answer) => (
                <p key={answer}>{answer}</p>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-light-tertiary dark:text-text-dark-tertiary">
            Explanation
          </p>
          <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {question.explanation}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isCorrect ? (
            <Button type="button" onClick={onNext}>
              Continue to Next Question
            </Button>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={onRetry}>
                Try Again
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowSolution((prev) => !prev)}
              >
                {showSolution ? 'Hide Solution' : 'See Solution'}
              </Button>
              <Button type="button" onClick={onNext}>
                Next Question
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
