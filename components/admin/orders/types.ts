export const ORDER_STATUS_VALUES = [
  'Completed',
  'Processing',
  'Pending',
  'Cancelled'
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  initials: string;
  product: string;
  status: OrderStatus;
  date: string;
  amount: number;
  trend: number[];
  paymentMethod: string;
  country: string;
  planType: string;
  renewalDate: string;
  salesChannel: string;
}

export type OrderStatusFilter = 'All' | OrderStatus;

export type OrderSortKey =
  | 'orderNumber'
  | 'customerName'
  | 'product'
  | 'status'
  | 'date'
  | 'amount';

export type OrderSortDirection = 'asc' | 'desc';

export interface OrderSortState {
  key: OrderSortKey;
  direction: OrderSortDirection;
}

export type OrderColumnId =
  | 'selection'
  | 'orderNumber'
  | 'customer'
  | 'product'
  | 'status'
  | 'date'
  | 'trend'
  | 'amount'
  | 'paymentMethod'
  | 'country'
  | 'planType'
  | 'renewalDate'
  | 'salesChannel'
  | 'actions';

export type OrderOptionalColumnId =
  | 'paymentMethod'
  | 'country'
  | 'planType'
  | 'renewalDate'
  | 'salesChannel';

export interface OrderColumn {
  id: OrderColumnId;
  label: string;
  sortable?: boolean;
  sortKey?: OrderSortKey;
  align?: 'left' | 'right';
  toggleable?: boolean;
}
