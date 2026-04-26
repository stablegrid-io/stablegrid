import { notFound, redirect } from 'next/navigation';
import { AdminFinancialsPage } from '@/components/admin/financials/AdminFinancialsPage';
import { AdminAccessError, requireAdminAccess } from '@/lib/admin/access';

export const metadata = {
  title: 'Financials · Admin Console · stablegrid.io'
};

export default async function AdminFinancialsRoute() {
  try {
    await requireAdminAccess();
    return <AdminFinancialsPage />;
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
