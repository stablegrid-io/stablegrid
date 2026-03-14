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
}

export type StatusFilter = 'All' | CustomerStatus;

export type CustomerColumnId = 'customer' | 'status' | 'joinedAt' | 'orders' | 'totalSpent';

export interface CustomerColumn {
  id: CustomerColumnId;
  label: string;
  sortable: boolean;
  align?: 'left' | 'right';
  toggleable?: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: CustomerColumnId;
  direction: SortDirection;
}
