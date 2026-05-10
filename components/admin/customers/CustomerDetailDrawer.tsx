import { X } from 'lucide-react';
import type { Customer } from '@/components/admin/customers/types';
import { CustomersStatusBadge } from '@/components/admin/customers/CustomersStatusBadge';
import { formatCurrency, formatJoinedDate } from '@/components/admin/customers/utils';
import {
  ADMIN_DRAWER_SURFACE_CLASS,
  ADMIN_GHOST_BUTTON_CLASS,
  ADMIN_SECONDARY_SURFACE_CLASS,
} from '@/components/admin/theme';

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
        className="fixed inset-0 z-40 bg-on-surface/30 backdrop-blur-[1px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Customer detail"
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md p-6 ${ADMIN_DRAWER_SURFACE_CLASS}`}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-3">
            <p className="font-data-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">
              Customer detail
            </p>
            <h2 className="mt-3 truncate font-h2 text-2xl font-bold tracking-tight text-on-surface">
              {customer.fullName}
            </h2>
            <p className="mt-1.5 truncate font-body text-[14px] text-on-surface-variant">{customer.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${ADMIN_GHOST_BUTTON_CLASS} h-9 w-9 justify-center px-0`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <div className={`${ADMIN_SECONDARY_SURFACE_CLASS} p-4`}>
            <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
              Status
            </p>
            <div className="mt-2">
              <CustomersStatusBadge status={customer.status} />
            </div>
          </div>
          <div className={`${ADMIN_SECONDARY_SURFACE_CLASS} p-4`}>
            <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
              Joined
            </p>
            <p className="mt-2 font-data-mono text-[14px] font-medium text-on-surface tabular-nums">
              {formatJoinedDate(customer.joinedAt)}
            </p>
          </div>
          <div className={`${ADMIN_SECONDARY_SURFACE_CLASS} p-4`}>
            <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
              Orders
            </p>
            <p className="mt-2 font-data-mono text-[14px] font-medium text-on-surface tabular-nums">
              {customer.orders}
            </p>
          </div>
          <div className={`${ADMIN_SECONDARY_SURFACE_CLASS} p-4`}>
            <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
              Total spent
            </p>
            <p className="mt-2 font-data-mono text-[16px] font-semibold text-on-surface tabular-nums">
              {formatCurrency(customer.totalSpent)}
            </p>
          </div>
        </div>

        <div className="mt-6 border border-dashed border-surface-dim bg-surface-container-low p-4 font-body text-[13px] text-on-surface-variant">
          Detail actions placeholder. Connect this drawer to real customer profile, billing,
          and activity timeline APIs.
        </div>
      </aside>
    </>
  );
}
