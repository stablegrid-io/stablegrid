import type { OrderStatus } from '@/components/admin/orders/types';

const STATUS_STYLE: Record<OrderStatus, { bg: string; border: string; color: string }> = {
  Completed: {
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.35)',
    color: 'rgb(110,231,160)',
  },
  Processing: {
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.35)',
    color: 'rgb(196,181,253)',
  },
  Pending: {
    bg: 'rgba(255,201,101,0.12)',
    border: 'rgba(255,201,101,0.35)',
    color: 'rgb(255,201,101)',
  },
  Cancelled: {
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.35)',
    color: 'rgb(252,165,165)',
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      {status}
    </span>
  );
}
