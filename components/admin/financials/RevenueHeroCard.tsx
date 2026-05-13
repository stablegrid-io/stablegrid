'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AdminFinancialsTrendPoint } from '@/lib/admin/types';
import {
  computeChangePct,
  formatCompactCurrency,
  formatCurrency,
} from '@/components/admin/financials/utils';
import {
  ADMIN_EYEBROW_CLASS,
  ADMIN_SECONDARY_SURFACE_CLASS,
} from '@/components/admin/theme';

const PRIMARY = '#e25a1c';
const INK = '#e6e2d9';
const SURFACE = '#14140f';
const AXIS = '#a88a80';

interface RevenueHeroCardProps {
  monthlyRevenue: number;
  previousMonthlyRevenue: number;
  trend: AdminFinancialsTrendPoint[];
}

export function RevenueHeroCard({
  monthlyRevenue,
  previousMonthlyRevenue,
  trend,
}: RevenueHeroCardProps) {
  const changePct = computeChangePct(monthlyRevenue, previousMonthlyRevenue);
  const TrendIcon = changePct < 0 ? TrendingDown : TrendingUp;
  const isDown = changePct < 0;

  return (
    <section className={`relative overflow-hidden p-6 sm:p-7 ${ADMIN_SECONDARY_SURFACE_CLASS}`}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div className="space-y-3">
          <p className={ADMIN_EYEBROW_CLASS}>
            Monthly revenue
          </p>
          <p className="font-data-mono text-5xl font-bold tabular-nums tracking-tight text-on-surface sm:text-6xl">
            {formatCompactCurrency(monthlyRevenue)}
          </p>
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1 border px-2.5 py-1 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${
                isDown
                  ? 'border-error bg-error/10 text-error'
                  : 'border-primary bg-primary/10 text-primary'
              }`}
            >
              <TrendIcon className="h-3 w-3" strokeWidth={2.4} />
              {changePct >= 0 ? '+' : '-'}
              {Math.abs(changePct).toFixed(1)}%
            </span>
            <span className="font-body text-[12px] text-on-surface-variant">vs last month</span>
          </div>
        </div>

        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={120}>
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueHeroFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(226,90,28,0.34)" />
                  <stop offset="95%" stopColor="rgba(226,90,28,0.02)" />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={{ stroke: AXIS, strokeWidth: 1 }}
                contentStyle={{
                  border: `1px solid ${INK}`,
                  background: SURFACE,
                  color: INK,
                  padding: '8px 10px',
                  fontSize: 12,
                }}
                labelStyle={{ color: AXIS, marginBottom: 4 }}
                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={PRIMARY}
                strokeWidth={2.4}
                fill="url(#revenueHeroFill)"
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 3.5, fill: PRIMARY, stroke: SURFACE, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
