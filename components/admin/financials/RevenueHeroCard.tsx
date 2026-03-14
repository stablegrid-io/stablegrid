'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AdminFinancialsTrendPoint } from '@/lib/admin/types';
import { computeChangePct, formatCompactCurrency, formatCurrency } from '@/components/admin/financials/utils';

interface RevenueHeroCardProps {
  monthlyRevenue: number;
  previousMonthlyRevenue: number;
  trend: AdminFinancialsTrendPoint[];
}

export function RevenueHeroCard({
  monthlyRevenue,
  previousMonthlyRevenue,
  trend
}: RevenueHeroCardProps) {
  const changePct = computeChangePct(monthlyRevenue, previousMonthlyRevenue);
  const TrendIcon = changePct < 0 ? TrendingDown : TrendingUp;
  const toneClass =
    changePct < 0
      ? 'text-rose-200 border-rose-400/20 bg-rose-500/10'
      : 'text-[#d7f6ec] border-brand-400/20 bg-brand-500/10';

  return (
    <section className="rounded-[24px] border border-white/10 bg-[#060b0a] p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div className="space-y-3">
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#8ca79a]">Monthly revenue</p>
          <p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {formatCompactCurrency(monthlyRevenue)}
          </p>
          <div className="flex items-center gap-2 text-sm text-[#8ea39a]">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${toneClass}`}>
              <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {changePct >= 0 ? '+' : '-'}
              {Math.abs(changePct).toFixed(1)}%
            </span>
            <span>vs last month</span>
          </div>
        </div>

        <div className="h-[118px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={118}>
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueHeroFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(120, 239, 210, 0.34)" />
                  <stop offset="95%" stopColor="rgba(120, 239, 210, 0.02)" />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#9ef5dc"
                strokeWidth={2.4}
                fill="url(#revenueHeroFill)"
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 3.5, fill: '#b9ffea', stroke: '#07110e', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
