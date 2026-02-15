'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface TopicProgressCardProps {
  topic: string;
  correct: number;
  attempted: number;
  total: number;
  accuracy: number;
  completion: number;
}

export const TopicProgressCard = ({
  topic,
  correct,
  attempted,
  total,
  accuracy,
  completion
}: TopicProgressCardProps) => {
  const progress = total > 0 ? (attempted / total) * 100 : 0;

  const getCompletionColor = (value: number) => {
    if (value >= 80) return 'text-success-600 dark:text-success-400';
    if (value >= 40) return 'text-brand-600 dark:text-brand-400';
    return 'text-text-light-secondary dark:text-text-dark-secondary';
  };

  return (
    <div className="card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold capitalize">{topic}</h4>
        <span className={`text-2xl font-bold ${getCompletionColor(completion)}`}>
          {completion}%
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          <span>{correct} correct</span>
          <span>
            {attempted}/{total} attempted
          </span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-light-surface dark:bg-dark-surface">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
        <TrendingUp className="h-4 w-4" />
        <span>
          {attempted} of {total} questions practiced
        </span>
      </div>
      <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
        Accuracy: {accuracy}%
      </div>
    </div>
  );
};
