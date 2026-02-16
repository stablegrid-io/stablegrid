'use client';

import { format, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import type {
  ActivityDay,
  DashboardPeriod,
  DashboardStats
} from '@/lib/hooks/useDashboardData';
import { formatUnitsAsKwh, kwhToUnits } from '@/lib/energy';

interface SessionSummaryProps {
  stats: DashboardStats;
  activityData: ActivityDay[];
  period: DashboardPeriod;
}

const getPeriodBounds = (period: DashboardPeriod) => {
  const now = new Date();
  if (period === 'week') {
    return { start: startOfWeek(now, { weekStartsOn: 0 }), end: now };
  }
  if (period === 'month') {
    return { start: startOfMonth(now), end: now };
  }
  if (period === 'year') {
    return { start: startOfYear(now), end: now };
  }
  return { start: startOfYear(now), end: now };
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const SessionSummary = ({
  stats,
  activityData,
  period
}: SessionSummaryProps) => {
  const activeDays = activityData.filter((day) => day.count > 0).length;
  const totalDays = activityData.length || 1;
  const correctAnswers = Math.round((stats.overallAccuracy / 100) * stats.questionsInPeriod);
  const questionGoal = period === 'week' ? 20 : period === 'month' ? 80 : 300;
  const energyGoalUnits =
    period === 'week' ? kwhToUnits(2) : period === 'month' ? kwhToUnits(8) : kwhToUnits(30);

  const range = getPeriodBounds(period);
  const rangeLabel = `${format(range.start, 'MMM d')} - ${format(range.end, 'MMM d')}`;

  const rows = [
    {
      label: 'Questions Answered',
      value: stats.questionsInPeriod.toString(),
      sub: `of ${questionGoal} target`,
      progress: clampPercent((stats.questionsInPeriod / questionGoal) * 100),
      color: 'bg-brand-500'
    },
    {
      label: 'Correct Answers',
      value: correctAnswers.toString(),
      sub: `${stats.overallAccuracy}% accuracy`,
      progress: clampPercent(stats.overallAccuracy),
      color: 'bg-emerald-500'
    },
    {
      label: 'Energy Generated',
      value: `+${formatUnitsAsKwh(stats.xpInPeriod)}`,
      sub: `of ${formatUnitsAsKwh(energyGoalUnits)} target`,
      progress: clampPercent((stats.xpInPeriod / energyGoalUnits) * 100),
      color: 'bg-amber-500'
    },
    {
      label: 'Active Days',
      value: activeDays.toString(),
      sub: `of ${totalDays} days`,
      progress: clampPercent((activeDays / totalDays) * 100),
      color: 'bg-violet-500'
    }
  ];

  return (
    <div className="card h-full p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
          Period Summary
        </h3>
        <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          {rangeLabel}
        </span>
      </div>

      <div className="space-y-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className="border-b border-light-border py-3 last:border-0 dark:border-dark-border"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {row.label}
              </span>
              <span className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
                {row.value}
              </span>
            </div>

            <div className="h-1 w-full overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
              <div
                className={`h-full rounded-full transition-all duration-500 ${row.color}`}
                style={{ width: `${row.progress}%` }}
              />
            </div>

            <div className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              {row.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
