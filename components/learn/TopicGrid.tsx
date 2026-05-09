'use client';

import Link from 'next/link';
import {
  Code2,
  Cpu,
  Database,
  Sparkles,
  Wind
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
    iconClass: 'text-primary-dim ',
    badgeClass:
      'bg-primary-fixed text-primary-dim  '
  },
  pyspark: {
    Icon: Sparkles,
    iconClass: 'text-warning-600 ',
    badgeClass:
      'bg-warning-50 text-warning-700  '
  },
  python: {
    Icon: Code2,
    iconClass: 'text-success-600 ',
    badgeClass:
      'bg-success-50 text-success-700  '
  },
  fabric: {
    Icon: Cpu,
    iconClass: 'text-cyan-600 ',
    badgeClass:
      'bg-cyan-50 text-cyan-700  '
  },
  airflow: {
    Icon: Wind,
    iconClass: 'text-rose-600 ',
    badgeClass:
      'bg-rose-50 text-rose-700  '
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
            href="/theory"
            className="card card-hover group p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center bg-surface-container-low">
                <Icon className={`h-6 w-6 ${config.iconClass}`} />
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                <span className="rounded-full border border-surface-dim bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                  {topic.chapterCount} chapters
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.badgeClass}`}
                >
                  {topic.functionCount} functions
                </span>
              </div>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-on-surface">
              {topic.title}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {topic.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
};
