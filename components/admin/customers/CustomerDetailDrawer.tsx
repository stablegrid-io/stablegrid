import { X } from 'lucide-react';
import type { Customer } from '@/components/admin/customers/types';
import { formatCurrency, formatJoinedDate } from '@/components/admin/customers/utils';
import { ADMIN_DRAWER_SURFACE_CLASS } from '@/components/admin/theme';

export function CustomerDetailDrawer({
  customer,
  open,
  onClose
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
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md p-5 ${ADMIN_DRAWER_SURFACE_CLASS}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#7f948b]">Customer detail</p>
            <h2 className="mt-2 text-2xl font-semibold text-on-surface">{customer.fullName}</h2>
            <p className="mt-1 text-sm text-[#8fa49b]">{customer.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center  border border-outline-variant/20 bg-surface-container-low text-[#cbdad3] transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <div className=" border border-outline-variant/20 bg-surface-container-low p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Status</p>
            <p className="mt-2 text-sm font-medium text-on-surface">{customer.status}</p>
          </div>
          <div className=" border border-outline-variant/20 bg-surface-container-low p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Joined</p>
            <p className="mt-2 text-sm font-medium text-on-surface">{formatJoinedDate(customer.joinedAt)}</p>
          </div>
          <div className=" border border-outline-variant/20 bg-surface-container-low p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Orders</p>
            <p className="mt-2 text-sm font-medium text-on-surface">{customer.orders}</p>
          </div>
          <div className=" border border-outline-variant/20 bg-surface-container-low p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Total spent</p>
            <p className="mt-2 text-sm font-semibold text-on-surface">{formatCurrency(customer.totalSpent)}</p>
          </div>
        </div>

        <div className="mt-6  border border-dashed border-outline-variant/20 bg-white/[0.02] p-3 text-sm text-[#8ea39a]">
          Detail actions placeholder. Connect this drawer to real customer profile, billing, and activity
          timeline APIs.
        </div>
      </aside>
    </>
  );
}
