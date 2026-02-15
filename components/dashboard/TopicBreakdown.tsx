'use client';

import type { TopicProgress } from '@/lib/hooks/useDashboardData';

interface TopicBreakdownProps {
  topics: TopicProgress[];
}

const topicColor: Record<string, string> = {
  sql: '#6b7fff',
  python: '#10b981',
  pyspark: '#f59e0b',
  fabric: '#06b6d4',
  visualization: '#06b6d4',
  etl: '#f97316'
};

const labelize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const TopicBreakdown = ({ topics }: TopicBreakdownProps) => {
  return (
    <div className="card p-6">
      <h3 className="mb-4 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
        Topic Progress
      </h3>

      <div className="space-y-4">
        {topics.map((topic) => {
          const progress = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0;
          const color = topicColor[topic.topic] ?? '#6b7fff';
          const notStarted = topic.attempted === 0;

          return (
            <div key={topic.topic}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  {labelize(topic.topic)}
                </span>
                <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  {notStarted ? 'Not started' : `${progress}% · ${topic.correct}/${topic.total}`}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-light-border dark:bg-dark-border">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
