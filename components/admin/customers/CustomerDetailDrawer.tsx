import { X } from 'lucide-react';
import type { Customer } from '@/components/admin/customers/types';
import { formatCurrency, formatJoinedDate } from '@/components/admin/customers/utils';

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
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-white/12 bg-[linear-gradient(180deg,#0b1110_0%,#070b0b_100%)] p-5 shadow-[-20px_0_46px_-30px_rgba(0,0,0,0.95)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#7f948b]">Customer detail</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{customer.fullName}</h2>
            <p className="mt-1 text-sm text-[#8fa49b]">{customer.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/12 bg-white/[0.04] text-[#cbdad3] transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Status</p>
            <p className="mt-2 text-sm font-medium text-white">{customer.status}</p>
          </div>
          <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Joined</p>
            <p className="mt-2 text-sm font-medium text-white">{formatJoinedDate(customer.joinedAt)}</p>
          </div>
          <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Orders</p>
            <p className="mt-2 text-sm font-medium text-white">{customer.orders}</p>
          </div>
          <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Total spent</p>
            <p className="mt-2 text-sm font-semibold text-white">{formatCurrency(customer.totalSpent)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[14px] border border-dashed border-white/14 bg-white/[0.02] p-3 text-sm text-[#8ea39a]">
          Detail actions placeholder. Connect this drawer to real customer profile, billing, and activity
          timeline APIs.
        </div>
      </aside>
    </>
  );
}
