import type { OrderStatus } from '@/components/admin/orders/types';

const STATUS_CLASS: Record<OrderStatus, string> = {
  Completed: 'border-primary text-primary bg-primary/10',
  Processing: 'border-amber-500/40 text-amber-700 bg-amber-500/10',
  Pending: 'border-amber-500/40 text-amber-700 bg-amber-500/10',
  Cancelled: 'border-surface-dim text-on-surface-variant bg-surface-container',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex h-6 items-center border px-2.5 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${STATUS_CLASS[status]}`}
    >
      {status}
    </span>
  );
}
