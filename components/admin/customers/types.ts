export type CustomerStatus = 'Active' | 'Inactive';

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  status: CustomerStatus;
  joinedAt: string;
  orders: number;
  totalSpent: number;
  initials: string;
  // Learning progress rollups (server-aggregated in lib/admin/service.ts)
  theoryModulesCompleted: number;
  theoryModulesTotal: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  practiceTasksSolved: number;
  practiceTasksTotal: number;
  kwhTotal: number;
  lastActiveAt: string | null;
}

export type StatusFilter = 'All' | CustomerStatus;

export type CustomerColumnId =
  | 'customer'
  | 'theoryProgress'
  | 'lessons'
  | 'practiceProgress'
  | 'kwh'
  | 'lastActive'
  | 'status'
  | 'joinedAt'
  | 'orders'
  | 'totalSpent';

export interface CustomerColumn {
  id: CustomerColumnId;
  label: string;
  sortable: boolean;
  align?: 'left' | 'right';
  toggleable?: boolean;
  defaultVisible?: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: CustomerColumnId;
  direction: SortDirection;
}
