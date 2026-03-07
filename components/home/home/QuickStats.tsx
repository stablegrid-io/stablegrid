'use client';

import { CheckCircle2, Flame, Target, Trophy } from 'lucide-react';

interface QuickStatsProps {
  xp: number;
  streak: number;
  questionsCompleted: number;
  accuracy: number;
}

const formatNumber = (value: number) => value.toLocaleString();

export const QuickStats = ({
  xp,
  streak,
  questionsCompleted,
  accuracy
}: QuickStatsProps) => {
  const cards = [
    {
      label: 'Total kWh',
      value: formatNumber(xp),
      icon: Trophy,
      color: 'text-amber-500',
      border: 'border-l-amber-500'
    },
    {
      label: 'Current Streak',
      value: `${streak} days`,
      icon: Flame,
      color: 'text-orange-500',
      border: 'border-l-orange-500'
    },
    {
      label: 'Questions Completed',
      value: formatNumber(questionsCompleted),
      icon: CheckCircle2,
      color: 'text-brand-500',
      border: 'border-l-brand-500'
    },
    {
      label: 'Overall Accuracy',
      value: `${accuracy}%`,
      icon: Target,
      color: 'text-brand-500',
      border: 'border-l-brand-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-xl border border-neutral-100 border-l-2 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 ${card.border}`}
          >
            <Icon className={`mb-3 h-4 w-4 ${card.color}`} />
            <div className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {card.value}
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-neutral-400">
              {card.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
