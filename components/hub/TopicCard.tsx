'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { TopicInfo } from '@/lib/types';
import { useProgressStore } from '@/lib/stores/useProgressStore';

interface TopicCardProps {
  topic: TopicInfo;
  index?: number;
}

export function TopicCard({ topic, index = 0 }: TopicCardProps) {
  const { topicProgress } = useProgressStore();
  const progress = topicProgress[topic.id] ?? {
    correct: 0,
    total: 0,
    lastAttempted: null
  };
  const rawCompletion = topic.totalQuestions
    ? Math.round((progress.total / topic.totalQuestions) * 100)
    : 0;
  const completion = Math.min(rawCompletion, 100);
  const accuracy = progress.total
    ? Math.round((progress.correct / progress.total) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card rounded-[22px]"
    >
      <Link
        href={`/practice/${topic.id}`}
        aria-label={`Start ${topic.name} practice`}
        className="group flex h-full flex-col gap-4 rounded-[20px] bg-gradient-to-br from-light-surface to-light-hover p-6 transition hover:-translate-y-1 hover:shadow-md dark:from-dark-surface dark:via-dark-surface dark:to-dark-hover"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-light-border bg-light-hover text-2xl dark:border-dark-border dark:bg-dark-muted">
              {topic.icon}
            </span>
            <div>
              <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                {topic.name}
              </h2>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                {topic.description}
              </p>
            </div>
          </div>
          <div className="data-mono rounded-full bg-light-hover px-3 py-1 text-xs text-text-light-secondary dark:bg-dark-muted dark:text-text-dark-secondary">
            {topic.totalQuestions} cards
          </div>
        </div>

          <div className="grid gap-3 rounded-2xl border border-light-border bg-light-muted p-4 dark:border-dark-border dark:bg-dark-muted">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-text-light-muted dark:text-text-dark-muted">
              <span>Completion</span>
              <span className="text-text-light-secondary dark:text-text-dark-secondary">
                {completion}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-light-active dark:bg-dark-active">
              <div
                className="h-2 rounded-full bg-success-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-text-light-muted dark:text-text-dark-muted">
            <span>Accuracy</span>
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              {accuracy}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          <span className="data-mono">Streak-ready practice</span>
          <span className="data-mono text-brand-500">Start →</span>
        </div>
      </Link>
    </motion.div>
  );
}
