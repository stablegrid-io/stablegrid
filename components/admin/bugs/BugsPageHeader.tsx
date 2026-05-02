import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export function BugsPageHeader() {
  return (
    <AdminPageHeader
      eyebrow="Admin · Workflow"
      crumb="Bugs"
      title="Bug reports"
      subtitle="Review and manage submitted bug reports."
    />
  );
}
