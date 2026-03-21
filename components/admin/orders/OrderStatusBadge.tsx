import type { OrderStatus } from '@/components/admin/orders/types';

const TONE_BY_STATUS: Record<OrderStatus, string> = {
  Completed: 'border-emerald-300/22 bg-emerald-500/12 text-emerald-100',
  Processing: 'border-violet-300/25 bg-violet-500/12 text-violet-100',
  Pending: 'border-amber-300/24 bg-amber-500/11 text-amber-100',
  Cancelled: 'border-rose-300/24 bg-error/12 text-error'
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center  border px-2.5 py-1 text-xs font-medium ${TONE_BY_STATUS[status]}`}
    >
      {status}
    </span>
  );
}
