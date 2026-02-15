'use client';

import { useState } from 'react';
import type { Question } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CodeEditor } from '@/components/CodeEditor';
import { MultipleChoice } from '@/components/MultipleChoice';

interface QuestionCardProps {
  question: Question;
  userAnswer: string;
  setUserAnswer: (value: string) => void;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  isSubmitting?: boolean;
}

export function QuestionCard({
  question,
  userAnswer,
  setUserAnswer,
  onSubmit,
  onSkip,
  isSubmitting
}: QuestionCardProps) {
  const [showHint, setShowHint] = useState(false);
  const canSubmit = userAnswer.trim().length > 0;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="data-mono text-xs uppercase tracking-[0.3em] text-text-light-tertiary dark:text-text-dark-tertiary">
            {question.topic.toUpperCase()} · {question.difficulty}
          </p>
          <h2 className="mt-2 whitespace-pre-line text-xl font-semibold text-text-light-primary dark:text-text-dark-primary md:text-2xl">
            {question.question}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success">+{question.xpReward} XP</Badge>
          {question.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </div>

      {question.codeSnippet && (
        <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-light-border bg-light-muted p-4 text-sm text-text-light-secondary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-secondary">
          {question.codeSnippet}
        </pre>
      )}

      <div className="mt-6 space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-text-light-muted dark:text-text-dark-muted">
          Your Answer
        </p>
        {question.type === 'multiple-choice' && question.options ? (
          <MultipleChoice
            options={question.options}
            value={userAnswer}
            onChange={setUserAnswer}
          />
        ) : null}

        {question.type === 'code' ? (
          <CodeEditor
            value={userAnswer}
            onChange={setUserAnswer}
            language={question.topic === 'sql' ? 'sql' : 'python'}
          />
        ) : null}

        {question.type === 'free-text' ? (
          <textarea
            value={userAnswer}
            onChange={(event) => setUserAnswer(event.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[120px] w-full resize-none rounded-lg border border-light-border bg-light-bg p-4 text-sm text-text-light-primary focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary"
          />
        ) : null}

        {question.hint && showHint && (
          <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700 dark:border-warning-800 dark:bg-warning-900/10 dark:text-warning-300">
            Hint: {question.hint}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => onSubmit(userAnswer)}
          disabled={isSubmitting || !canSubmit}
        >
          {isSubmitting ? 'Checking...' : 'Submit Answer'}
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip
        </Button>
        {question.hint && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowHint((prev) => !prev)}
          >
            {showHint ? 'Hide Hint' : 'Hint'}
          </Button>
        )}
      </div>
    </div>
  );
}
