'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useTheme } from 'next-themes';

interface XPChartProps {
  data: Array<{ date: string; completed: number }>;
  title?: string;
}

export const XPChart = ({ data, title = 'Completed Tasks Trend' }: XPChartProps) => {
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          Daily count
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barSize={24}>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={isDark ? '#2a2a2a' : '#e7e7eb'}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke={isDark ? '#8a8a92' : '#73737d'}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={isDark ? '#8a8a92' : '#73737d'}
            fontSize={12}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={26}
          />
          <Tooltip
            cursor={{ fill: isDark ? 'rgba(67, 56, 202, 0.16)' : 'rgba(79, 70, 229, 0.1)' }}
            contentStyle={{
              backgroundColor: isDark ? '#171717' : '#ffffff',
              border: `1px solid ${isDark ? '#262626' : '#e5e5e5'}`,
              borderRadius: '10px',
              boxShadow: isDark
                ? '0 6px 24px rgba(0,0,0,0.35)'
                : '0 6px 24px rgba(15,23,42,0.08)'
            }}
            labelStyle={{ color: isDark ? '#fafafa' : '#0a0a0a' }}
            formatter={(value: number | string | undefined) => [
              `${typeof value === 'number' || typeof value === 'string' ? value : 0}`,
              'Completed' as const
            ]}
          />
          <Bar dataKey="completed" fill="#4f46e5" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
