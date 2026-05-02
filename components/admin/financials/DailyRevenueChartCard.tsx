'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AdminFinancialsTrendPoint } from '@/lib/admin/types';
import { formatCurrency } from '@/components/admin/financials/utils';

const ACCENT = '153,247,255';

interface DailyRevenueChartCardProps {
  points: AdminFinancialsTrendPoint[];
}

export function DailyRevenueChartCard({ points }: DailyRevenueChartCardProps) {
  return (
    <section className="rounded-[22px] border border-white/[0.06] bg-[#181c20] p-6 sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-white">Daily revenue</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
          Last 30 days
        </span>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={260}>
          <LineChart data={points} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)' }}
            />
            <YAxis hide domain={['dataMin - 200', 'dataMax + 200']} />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1 }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(16,18,22,0.96)',
                color: '#fff',
                padding: '8px 10px',
                fontSize: 12,
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}
              formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={`rgb(${ACCENT})`}
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 3.5, fill: `rgb(${ACCENT})`, stroke: '#181c20', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
