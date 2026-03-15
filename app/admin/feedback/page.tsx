import { notFound, redirect } from 'next/navigation';
import { AdminFeedbackPage } from '@/components/admin/feedback/AdminFeedbackPage';
import { AdminAccessError, requireAdminAccess } from '@/lib/admin/access';

export const metadata = {
  title: 'Feedback · Admin Console · stableGrid.io'
};

export default async function AdminFeedbackRoute() {
  try {
    await requireAdminAccess();
    return <AdminFeedbackPage />;
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
