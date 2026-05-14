import type { CustomerColumn } from '@/components/admin/customers/types';

// Order matters — this is the left-to-right column order in the table.
// `defaultVisible: false` keeps the column toggleable but off by default
// (admin can re-enable via the columns dropdown). Progress columns are
// the primary lens; billing columns are demoted but still available.
export const CUSTOMER_COLUMNS: CustomerColumn[] = [
  { id: 'customer', label: 'Customer', sortable: true, toggleable: false, defaultVisible: true },
  { id: 'theoryProgress', label: 'Theory', sortable: true, toggleable: true, defaultVisible: true },
  { id: 'lessons', label: 'Lessons', sortable: true, toggleable: true, defaultVisible: true },
  { id: 'practiceProgress', label: 'Practice', sortable: true, toggleable: true, defaultVisible: true },
  { id: 'kwh', label: 'kWh', sortable: true, align: 'right', toggleable: true, defaultVisible: true },
  { id: 'lastActive', label: 'Last active', sortable: true, toggleable: true, defaultVisible: true },
  { id: 'status', label: 'Status', sortable: true, toggleable: true, defaultVisible: true },
  { id: 'joinedAt', label: 'Joined', sortable: true, toggleable: true, defaultVisible: true },
  { id: 'orders', label: 'Orders', sortable: true, align: 'right', toggleable: true, defaultVisible: false },
  { id: 'totalSpent', label: 'Total Spent', sortable: true, align: 'right', toggleable: true, defaultVisible: false }
];
