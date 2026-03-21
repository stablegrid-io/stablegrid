import type { CustomerStatus } from '@/components/admin/customers/types';

export function CustomersStatusBadge({ status }: { status: CustomerStatus }) {
  const isActive = status === 'Active';

  return (
    <span
      className={`inline-flex h-7 items-center  border px-3 text-xs font-semibold ${
        isActive
          ? 'border-emerald-300/35 bg-emerald-400/18 text-emerald-100'
          : 'border-white/15 bg-surface-container-high text-[#b2c1bc]'
      }`}
    >
      {status}
    </span>
  );
}
