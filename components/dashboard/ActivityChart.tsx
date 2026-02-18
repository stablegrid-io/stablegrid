'use client';

import { useMemo, useState } from 'react';
import { addDays, format, subDays } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useTheme } from 'next-themes';
import type { ActivityDay } from '@/lib/hooks/useDashboardData';

interface ActivityChartProps {
  activityData: ActivityDay[];
}

type ChartWindow = 7 | 14 | 30;

const windowOptions: Array<{ value: ChartWindow; label: string }> = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' }
];

export const ActivityChart = ({ activityData }: ActivityChartProps) => {
  const [windowDays, setWindowDays] = useState<ChartWindow>(14);
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const isDark = resolvedTheme === 'dark';

  const chartData = useMemo(() => {
    const countsByDay = new Map(activityData.map((entry) => [entry.date, entry.count]));
    const start = subDays(new Date(), windowDays - 1);

    return Array.from({ length: windowDays }, (_, index) => {
      const date = addDays(start, index);
      const key = format(date, 'yyyy-MM-dd');
      return {
        date: format(date, 'MMM d'),
        questions: countsByDay.get(key) ?? 0
      };
    });
  }, [activityData, windowDays]);

  return (
    <div className="card h-full p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Daily Questions
          </h3>
          <p className="mt-0.5 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            Last {windowDays} days
          </p>
        </div>

        <div className="flex overflow-hidden rounded-lg border border-light-border text-xs dark:border-dark-border">
          {windowOptions.map((option) => {
            const isActive = windowDays === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setWindowDays(option.value)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'bg-light-bg text-text-light-secondary hover:text-text-light-primary dark:bg-dark-bg dark:text-text-dark-secondary dark:hover:text-text-dark-primary'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ left: -12, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="questionsAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? '#262626' : '#f0f0f0'}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: isDark ? '#a3a3a3' : '#737373' }}
            axisLine={false}
            tickLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 11, fill: isDark ? '#a3a3a3' : '#737373' }}
            axisLine={false}
            tickLine={false}
            width={24}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: isDark ? '#171717' : '#fff',
              border: `1px solid ${isDark ? '#262626' : '#e5e5e5'}`,
              borderRadius: '8px',
              fontSize: '13px'
            }}
            labelStyle={{ color: isDark ? '#a3a3a3' : '#737373' }}
            formatter={(value: number | string | undefined) => [
              `${typeof value === 'number' || typeof value === 'string' ? value : 0}`,
              'Questions' as const
            ]}
          />
          <Area
            type="monotone"
            dataKey="questions"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#questionsAreaGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
