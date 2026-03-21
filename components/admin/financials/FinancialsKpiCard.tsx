import type { LucideIcon } from 'lucide-react';
import { Percent, ReceiptText, RotateCcw, ShoppingCart, TrendingDown, TrendingUp } from 'lucide-react';
import type { AdminFinancialsKpi } from '@/lib/admin/types';

const KPI_ICON_MAP: Record<AdminFinancialsKpi['id'], LucideIcon> = {
  total_orders: ShoppingCart,
  avg_order_value: ReceiptText,
  conversion_rate: Percent,
  refund_rate: RotateCcw
};

interface FinancialsKpiCardProps {
  metric: AdminFinancialsKpi;
}

export function FinancialsKpiCard({ metric }: FinancialsKpiCardProps) {
  const Icon = KPI_ICON_MAP[metric.id];
  const TrendIcon = metric.changePct < 0 ? TrendingDown : TrendingUp;
  const trendToneClass =
    metric.changePct < 0
      ? 'text-rose-200 border-rose-400/20 bg-error/10'
      : 'text-[#d7f6ec] border-primary/20 bg-primary/10';

  return (
    <article className=" border border-outline-variant/20 bg-surface-container-low/65 px-4 py-4 shadow-[0_24px_45px_-35px_rgba(0,0,0,0.9)] sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.75rem] uppercase tracking-[0.14em] text-[#8ca79a]">{metric.label}</p>
        <span className="inline-flex h-8 w-8 items-center justify-center  border border-outline-variant/20 bg-surface-container-low">
          <Icon className="h-4 w-4 text-[#9eb2aa]" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-on-surface">{metric.value}</p>
      <div className="mt-3">
        <span className={`inline-flex items-center gap-1  border px-2.5 py-1 text-xs ${trendToneClass}`}>
          <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
          {metric.changePct >= 0 ? '+' : '-'}
          {Math.abs(metric.changePct).toFixed(1)}%
        </span>
      </div>
    </article>
  );
}
