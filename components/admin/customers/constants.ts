import type { CustomerColumn } from '@/components/admin/customers/types';

export const CUSTOMER_COLUMNS: CustomerColumn[] = [
  { id: 'customer', label: 'Customer', sortable: true, toggleable: false },
  { id: 'status', label: 'Status', sortable: true, toggleable: true },
  { id: 'joinedAt', label: 'Joined', sortable: true, toggleable: true },
  { id: 'orders', label: 'Orders', sortable: true, align: 'right', toggleable: true },
  { id: 'totalSpent', label: 'Total Spent', sortable: true, align: 'right', toggleable: true }
];
