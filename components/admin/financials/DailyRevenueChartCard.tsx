'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AdminFinancialsTrendPoint } from '@/lib/admin/types';
import { formatCurrency } from '@/components/admin/financials/utils';
import { ADMIN_SECONDARY_SURFACE_CLASS } from '@/components/admin/theme';

const PRIMARY = '#a33800';
const INK = '#1c1c16';
const GRID = '#dddad1';
const AXIS = '#8d7167';

interface DailyRevenueChartCardProps {
  points: AdminFinancialsTrendPoint[];
}

export function DailyRevenueChartCard({ points }: DailyRevenueChartCardProps) {
  return (
    <section className={`${ADMIN_SECONDARY_SURFACE_CLASS} bg-surface-container-low p-6 sm:p-7`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-h2 text-xl font-bold tracking-tight text-on-surface">Daily revenue</h2>
        <span className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
          Last 30 days
        </span>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={260}>
          <LineChart data={points} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: AXIS }}
              minTickGap={24}
              tick={{ fill: AXIS, fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)' }}
            />
            <YAxis hide domain={['dataMin - 200', 'dataMax + 200']} />
            <Tooltip
              cursor={{ stroke: AXIS, strokeWidth: 1 }}
              contentStyle={{
                border: `1px solid ${INK}`,
                background: '#fdf9f0',
                color: INK,
                padding: '8px 10px',
                fontSize: 12,
              }}
              labelStyle={{ color: AXIS, marginBottom: 4 }}
              formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={PRIMARY}
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 3.5, fill: PRIMARY, stroke: '#fdf9f0', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
