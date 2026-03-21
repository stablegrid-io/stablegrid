import { notFound, redirect } from 'next/navigation';
import { AdminSpendingPage } from '@/components/admin/spending/AdminSpendingPage';
import { AdminAccessError, requireAdminAccess } from '@/lib/admin/access';

export const metadata = {
  title: 'Spending · Admin Console · stableGrid.io'
};

export default async function AdminSpendingRoute() {
  try {
    await requireAdminAccess();
    return <AdminSpendingPage />;
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
