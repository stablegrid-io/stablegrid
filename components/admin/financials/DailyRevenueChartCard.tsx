'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AdminFinancialsTrendPoint } from '@/lib/admin/types';
import { formatCurrency } from '@/components/admin/financials/utils';

interface DailyRevenueChartCardProps {
  points: AdminFinancialsTrendPoint[];
}

export function DailyRevenueChartCard({ points }: DailyRevenueChartCardProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-[#07100f]/65 p-5 shadow-[0_24px_45px_-35px_rgba(0,0,0,0.9)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-white">Daily Revenue</h2>
        <span className="text-xs uppercase tracking-[0.16em] text-[#8ca79a]">30 days</span>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={250}>
          <LineChart data={points} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tick={{ fill: '#89a096', fontSize: 12 }}
            />
            <YAxis hide domain={['dataMin - 200', 'dataMax + 200']} />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(9,13,12,0.95)',
                color: '#f7fffc',
                padding: '8px 10px',
                fontSize: 12
              }}
              labelStyle={{ color: '#9eb2aa', marginBottom: 4 }}
              formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8df1d7"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 3.5, fill: '#b9ffea', stroke: '#07110e', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
