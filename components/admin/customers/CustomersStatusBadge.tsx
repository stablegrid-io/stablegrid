import type { CustomerStatus } from '@/components/admin/customers/types';
import {
  ADMIN_STATUS_ACTIVE_CLASS,
  ADMIN_STATUS_INACTIVE_CLASS,
} from '@/components/admin/theme';

export function CustomersStatusBadge({ status }: { status: CustomerStatus }) {
  const isActive = status === 'Active';

  return (
    <span className={isActive ? ADMIN_STATUS_ACTIVE_CLASS : ADMIN_STATUS_INACTIVE_CLASS}>
      {status}
    </span>
  );
}
