import { notFound, redirect } from 'next/navigation';
import { AdminCustomersPage } from '@/components/admin/customers/AdminCustomersPage';
import { AdminAccessError, requireAdminAccess } from '@/lib/admin/access';

export const metadata = {
  title: 'Customers · Admin Console · stableGrid.io'
};

export default async function AdminCustomersRoute() {
  try {
    await requireAdminAccess();
    return <AdminCustomersPage />;
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
