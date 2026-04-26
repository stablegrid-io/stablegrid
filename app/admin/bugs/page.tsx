import { notFound, redirect } from 'next/navigation';
import { AdminBugsPage } from '@/components/admin/bugs/BugsPage';
import { AdminAccessError, requireAdminAccess } from '@/lib/admin/access';

export const metadata = {
  title: 'Bug Reports · Admin Console · stablegrid.io'
};

export default async function AdminBugsRoute() {
  try {
    await requireAdminAccess();
    return <AdminBugsPage />;
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
