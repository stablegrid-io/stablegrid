import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export function CustomersPageHeader() {
  return (
    <AdminPageHeader
      eyebrow="Admin · Commerce"
      crumb="Customers"
      title="Customers"
      subtitle="View and manage your customer base."
    />
  );
}
