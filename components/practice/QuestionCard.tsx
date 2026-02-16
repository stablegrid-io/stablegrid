'use client';

import { motion } from 'framer-motion';
import { FileText, Info } from 'lucide-react';
import type { Question } from '@/lib/types';
import { MultipleChoice } from './MultipleChoice';

interface QuestionCardProps {
  question: Question;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  hintRevealed: boolean;
  onRevealHint: () => void;
  showFeedback: boolean;
}

export const QuestionCard = ({
  question,
  userAnswer,
  onAnswerChange,
  onSubmit,
  hintRevealed,
  onRevealHint,
  showFeedback
}: QuestionCardProps) => {
  const Icon = FileText;

  const difficultyConfig = {
    easy: {
      color: 'text-success-600 dark:text-success-400',
      bg: 'bg-success-50 dark:bg-success-900/20',
      border: 'border-success-200 dark:border-success-800'
    },
    medium: {
      color: 'text-warning-600 dark:text-warning-400',
      bg: 'bg-warning-50 dark:bg-warning-900/20',
      border: 'border-warning-200 dark:border-warning-800'
    },
    hard: {
      color: 'text-error-600 dark:text-error-400',
      bg: 'bg-error-50 dark:bg-error-900/20',
      border: 'border-error-200 dark:border-error-800'
    }
  };

  const diffStyle = difficultyConfig[question.difficulty];

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20">
            <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              Multiple Choice
            </div>
            <div className={`badge ${diffStyle.bg} ${diffStyle.border} ${diffStyle.color}`}>
              {question.difficulty}
            </div>
          </div>
        </div>

        {question.hint && !showFeedback && (
          <button onClick={onRevealHint} className="btn btn-ghost text-xs">
            <Info className="h-4 w-4" />
            {hintRevealed ? 'Hide' : 'Show'} Hint
          </button>
        )}
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-text-light-primary dark:text-text-dark-primary">
          {question.question}
        </p>
      </div>

      {question.codeSnippet && (
        <div className="card bg-light-muted p-4 dark:bg-dark-muted">
          <pre className="text-sm font-mono text-text-light-primary dark:text-text-dark-primary">
            <code>{question.codeSnippet}</code>
          </pre>
        </div>
      )}

      {hintRevealed && question.hint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="card border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/10"
        >
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600 dark:text-brand-400" />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {question.hint}
            </p>
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2">
        {question.tags.map((tag) => (
          <span
            key={tag}
            className="rounded border border-light-border bg-light-surface px-2 py-1 text-xs text-text-light-secondary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="divider" />

      <div className="space-y-4">
        <MultipleChoice
          options={question.options ?? []}
          selected={userAnswer}
          onSelect={onAnswerChange}
          disabled={showFeedback}
        />
      </div>

      {!showFeedback && (
        <button
          onClick={() => onSubmit()}
          disabled={!userAnswer.trim()}
          className="btn btn-primary w-full"
        >
          Submit Answer
        </button>
      )}
    </motion.div>
  );
};
