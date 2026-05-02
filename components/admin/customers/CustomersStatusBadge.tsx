import type { CustomerStatus } from '@/components/admin/customers/types';

export function CustomersStatusBadge({ status }: { status: CustomerStatus }) {
  const isActive = status === 'Active';

  return (
    <span
      className="inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase"
      style={
        isActive
          ? {
              border: '1px solid rgba(34,197,94,0.35)',
              background: 'rgba(34,197,94,0.12)',
              color: 'rgb(110,231,160)',
            }
          : {
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.6)',
            }
      }
    >
      {status}
    </span>
  );
}
