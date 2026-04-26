import { notFound, redirect } from 'next/navigation';
import { AdminConsole } from '@/components/admin/AdminConsole';
import { AdminAccessError, requireAdminAccess } from '@/lib/admin/access';

export const metadata = {
  title: 'Audit · Admin Console · stablegrid.io'
};

export default async function AdminAuditPage() {
  try {
    const access = await requireAdminAccess();

    return (
      <AdminConsole
        role={access.role}
        adminEmail={access.user.email}
        initialSection="audit"
      />
    );
  } catch (error) {
    if (error instanceof AdminAccessError) {
      if (error.status === 401) {
        redirect('/login');
      }

      if (error.status === 403) {
        notFound();
      }
    }

    throw error;
  }
}
