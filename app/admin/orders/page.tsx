import { notFound, redirect } from 'next/navigation';
import { OrdersPage } from '@/components/admin/orders/OrdersPage';
import { AdminAccessError, requireAdminAccess } from '@/lib/admin/access';

export const metadata = {
  title: 'Orders · Admin Console · stablegrid.io'
};

export default async function AdminOrdersRoute() {
  try {
    await requireAdminAccess();
    return <OrdersPage />;
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
