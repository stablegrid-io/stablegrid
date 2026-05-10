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
import {
  ADMIN_FIELD_LABEL_CLASS,
  ADMIN_SECONDARY_SURFACE_CLASS,
} from '@/components/admin/theme';

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
    <article className={`relative overflow-hidden p-5 ${ADMIN_SECONDARY_SURFACE_CLASS}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={ADMIN_FIELD_LABEL_CLASS}>
          {metric.label}
        </p>
        <span className="inline-flex h-9 w-9 items-center justify-center border border-primary/30 bg-primary/10">
          <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-4 font-data-mono text-3xl font-bold tabular-nums tracking-tight text-on-surface">
        {metric.value}
      </p>
      <div className="mt-3">
        <span
          className={`inline-flex items-center gap-1 border px-2.5 py-1 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${
            isDown
              ? 'border-error bg-error/10 text-error'
              : 'border-primary bg-primary/10 text-primary'
          }`}
        >
          <TrendIcon className="h-3 w-3" strokeWidth={2.4} />
          {metric.changePct >= 0 ? '+' : '-'}
          {Math.abs(metric.changePct).toFixed(1)}%
        </span>
      </div>
    </article>
  );
}
