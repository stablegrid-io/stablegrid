'use client';

import { format } from 'date-fns';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { RecentQuestion } from '@/lib/hooks/useDashboardData';

interface RecentActivityProps {
  questions: RecentQuestion[];
}

export const RecentActivity = ({ questions }: RecentActivityProps) => {
  if (questions.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
        <div className="py-12 text-center text-text-light-tertiary dark:text-text-dark-tertiary">
          No activity yet. Start practicing!
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
      <div className="space-y-3">
        {questions.map((question) => (
          <div
            key={`${question.id}-${question.attemptedAt.toISOString()}`}
            className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
          >
            <div className="mt-0.5 flex-shrink-0">
              {question.correct ? (
                <CheckCircle2 className="h-5 w-5 text-success-500" />
              ) : (
                <XCircle className="h-5 w-5 text-error-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium uppercase text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                  {question.topic}
                </span>
                <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  {format(question.attemptedAt, 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {question.question}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
