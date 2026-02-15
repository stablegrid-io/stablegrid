'use client';

import { BookOpen, CheckCircle2, Clock, Target } from 'lucide-react';

interface OverallStatsProps {
  chaptersCompleted: number;
  minutesRead: number;
  questionsCorrect: number;
  overallAccuracy: number;
}

export const OverallStats = ({
  chaptersCompleted,
  minutesRead,
  questionsCorrect,
  overallAccuracy
}: OverallStatsProps) => {
  const hoursRead = minutesRead >= 60 ? `${(minutesRead / 60).toFixed(1)}h` : `${minutesRead}m`;

  const stats = [
    {
      label: 'Chapters Completed',
      value: chaptersCompleted,
      icon: BookOpen,
      color: '#6b7fff',
      sub: 'theory chapters finished'
    },
    {
      label: 'Reading Time',
      value: hoursRead,
      icon: Clock,
      color: '#f59e0b',
      sub: 'active reading'
    },
    {
      label: 'Questions Correct',
      value: questionsCorrect,
      icon: CheckCircle2,
      color: '#10b981',
      sub: 'across all topics'
    },
    {
      label: 'Overall Accuracy',
      value: `${overallAccuracy}%`,
      icon: Target,
      color: '#8b5cf6',
      sub:
        overallAccuracy >= 80
          ? 'excellent'
          : overallAccuracy >= 60
            ? 'good'
            : 'keep practicing'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="rounded-xl border border-neutral-100 border-l-2 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            style={{ borderLeftColor: item.color }}
          >
            <Icon className="mb-3 h-4 w-4" style={{ color: item.color }} />
            <div className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {item.value}
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-neutral-400">
              {item.label}
            </div>
            <div className="mt-0.5 text-xs italic text-neutral-400">{item.sub}</div>
          </div>
        );
      })}
    </div>
  );
};
