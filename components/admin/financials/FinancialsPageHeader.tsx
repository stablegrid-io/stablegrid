import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export function FinancialsPageHeader() {
  return (
    <AdminPageHeader
      eyebrow="Admin · Commerce"
      crumb="Financials"
      title="Revenue & sales"
      subtitle="Monthly performance overview."
    />
  );
}
