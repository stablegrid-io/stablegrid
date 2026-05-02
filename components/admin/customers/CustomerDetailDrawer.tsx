import { X } from 'lucide-react';
import type { Customer } from '@/components/admin/customers/types';
import { CustomersStatusBadge } from '@/components/admin/customers/CustomersStatusBadge';
import { formatCurrency, formatJoinedDate } from '@/components/admin/customers/utils';
import { ADMIN_DRAWER_SURFACE_CLASS } from '@/components/admin/theme';

export function CustomerDetailDrawer({
  customer,
  open,
  onClose,
}: {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !customer) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close customer detail"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Customer detail"
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md p-6 ${ADMIN_DRAWER_SURFACE_CLASS}`}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Customer detail
            </p>
            <h2 className="mt-3 truncate text-2xl font-bold tracking-tight text-white">
              {customer.fullName}
            </h2>
            <p className="mt-1.5 truncate text-[14px] text-white/60">{customer.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center transition-all"
            style={{
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Status
            </p>
            <div className="mt-2">
              <CustomersStatusBadge status={customer.status} />
            </div>
          </div>
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Joined
            </p>
            <p className="mt-2 text-[14px] font-medium text-white font-mono tabular-nums">
              {formatJoinedDate(customer.joinedAt)}
            </p>
          </div>
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Orders
            </p>
            <p className="mt-2 text-[14px] font-medium text-white font-mono tabular-nums">
              {customer.orders}
            </p>
          </div>
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Total spent
            </p>
            <p className="mt-2 text-[16px] font-semibold text-white font-mono tabular-nums">
              {formatCurrency(customer.totalSpent)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[18px] border border-dashed border-white/[0.1] bg-white/[0.02] p-4 text-[13px] text-white/55">
          Detail actions placeholder. Connect this drawer to real customer profile, billing,
          and activity timeline APIs.
        </div>
      </aside>
    </>
  );
}
