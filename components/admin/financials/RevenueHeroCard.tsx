'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AdminFinancialsTrendPoint } from '@/lib/admin/types';
import {
  computeChangePct,
  formatCompactCurrency,
  formatCurrency,
} from '@/components/admin/financials/utils';

const ACCENT = '153,247,255';

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
    <section className="relative overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#181c20] p-6 sm:p-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
            Monthly revenue
          </p>
          <p className="text-5xl sm:text-6xl font-bold tracking-tight text-white font-mono tabular-nums">
            {formatCompactCurrency(monthlyRevenue)}
          </p>
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase"
              style={
                isDown
                  ? {
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.35)',
                      color: 'rgb(252,165,165)',
                    }
                  : {
                      background: 'rgba(34,197,94,0.12)',
                      border: '1px solid rgba(34,197,94,0.35)',
                      color: 'rgb(110,231,160)',
                    }
              }
            >
              <TrendIcon className="h-3 w-3" strokeWidth={2.4} />
              {changePct >= 0 ? '+' : '-'}
              {Math.abs(changePct).toFixed(1)}%
            </span>
            <span className="text-[12px] text-white/50">vs last month</span>
          </div>
        </div>

        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={120}>
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueHeroFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`rgba(${ACCENT}, 0.34)`} />
                  <stop offset="95%" stopColor={`rgba(${ACCENT}, 0.02)`} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={`rgb(${ACCENT})`}
                strokeWidth={2.4}
                fill="url(#revenueHeroFill)"
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 3.5, fill: `rgb(${ACCENT})`, stroke: '#181c20', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
