'use client';

import Link from 'next/link';
import {
  Code2,
  Cpu,
  Database,
  Sparkles
} from 'lucide-react';

interface TopicItem {
  id: string;
  title: string;
  description: string;
  functionCount: number;
  chapterCount: number;
}

interface TopicGridProps {
  topics: TopicItem[];
}

const iconMap: Record<
  string,
  {
    Icon: typeof Database;
    iconClass: string;
    badgeClass: string;
  }
> = {
  sql: {
    Icon: Database,
    iconClass: 'text-brand-600 dark:text-brand-400',
    badgeClass:
      'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
  },
  pyspark: {
    Icon: Sparkles,
    iconClass: 'text-warning-600 dark:text-warning-400',
    badgeClass:
      'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-300'
  },
  python: {
    Icon: Code2,
    iconClass: 'text-success-600 dark:text-success-400',
    badgeClass:
      'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300'
  },
  fabric: {
    Icon: Cpu,
    iconClass: 'text-cyan-600 dark:text-cyan-400',
    badgeClass:
      'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300'
  }
};

export const TopicGrid = ({ topics }: TopicGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => {
        const config = iconMap[topic.id] ?? iconMap.sql;
        const Icon = config.Icon;
        return (
          <Link
            key={topic.id}
            href={`/learn/${topic.id}/theory`}
            className="card card-hover group p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-light-muted dark:bg-dark-muted">
                <Icon className={`h-6 w-6 ${config.iconClass}`} />
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                <span className="rounded-full border border-light-border bg-light-surface px-2.5 py-1 text-xs font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary">
                  {topic.chapterCount} chapters
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.badgeClass}`}
                >
                  {topic.functionCount} functions
                </span>
              </div>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              {topic.title}
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {topic.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
};
