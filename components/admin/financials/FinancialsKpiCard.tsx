import type { LucideIcon } from 'lucide-react';
import {
  Percent,
  ReceiptText,
  RotateCcw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { AdminFinancialsKpi } from '@/lib/admin/types';

const ACCENT = '153,247,255';

const KPI_ICON_MAP: Record<AdminFinancialsKpi['id'], LucideIcon> = {
  total_orders: ShoppingCart,
  avg_order_value: ReceiptText,
  conversion_rate: Percent,
  refund_rate: RotateCcw,
};

interface FinancialsKpiCardProps {
  metric: AdminFinancialsKpi;
}

export function FinancialsKpiCard({ metric }: FinancialsKpiCardProps) {
  const Icon = KPI_ICON_MAP[metric.id];
  const TrendIcon = metric.changePct < 0 ? TrendingDown : TrendingUp;
  const isDown = metric.changePct < 0;

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#181c20] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
          {metric.label}
        </p>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-[12px]"
          style={{
            background: `rgba(${ACCENT},0.08)`,
            border: `1px solid rgba(${ACCENT},0.18)`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: `rgb(${ACCENT})` }} strokeWidth={2} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
        {metric.value}
      </p>
      <div className="mt-3">
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
          {metric.changePct >= 0 ? '+' : '-'}
          {Math.abs(metric.changePct).toFixed(1)}%
        </span>
      </div>
    </article>
  );
}
