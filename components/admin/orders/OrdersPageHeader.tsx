import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export function OrdersPageHeader() {
  return (
    <AdminPageHeader
      eyebrow="Admin · Commerce"
      crumb="Orders"
      title="Orders"
      subtitle="Manage and track all customer orders."
    />
  );
}
