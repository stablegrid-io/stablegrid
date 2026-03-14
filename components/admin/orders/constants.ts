import type {
  OrderColumn,
  OrderOptionalColumnId,
  OrderStatusFilter
} from '@/components/admin/orders/types';

export const ORDER_STATUS_FILTERS: OrderStatusFilter[] = [
  'All',
  'Completed',
  'Processing',
  'Pending',
  'Cancelled'
];

export const ORDER_COLUMNS: OrderColumn[] = [
  { id: 'selection', label: '', toggleable: false },
  {
    id: 'orderNumber',
    label: 'Order',
    sortable: true,
    sortKey: 'orderNumber',
    toggleable: false
  },
  {
    id: 'customer',
    label: 'Customer',
    sortable: true,
    sortKey: 'customerName',
    toggleable: false
  },
  {
    id: 'product',
    label: 'Product',
    sortable: true,
    sortKey: 'product',
    toggleable: false
  },
  {
    id: 'status',
    label: 'Status',
    sortable: true,
    sortKey: 'status',
    toggleable: false
  },
  {
    id: 'date',
    label: 'Date',
    sortable: true,
    sortKey: 'date',
    toggleable: false
  },
  { id: 'trend', label: 'Trend', toggleable: false },
  {
    id: 'paymentMethod',
    label: 'Payment',
    toggleable: true
  },
  {
    id: 'country',
    label: 'Country',
    toggleable: true
  },
  {
    id: 'planType',
    label: 'Plan',
    toggleable: true
  },
  {
    id: 'renewalDate',
    label: 'Renewal',
    toggleable: true
  },
  {
    id: 'salesChannel',
    label: 'Channel',
    toggleable: true
  },
  {
    id: 'amount',
    label: 'Amount',
    sortable: true,
    sortKey: 'amount',
    align: 'right',
    toggleable: false
  },
  { id: 'actions', label: '', align: 'right', toggleable: false }
];

export const ORDER_OPTIONAL_COLUMNS: Array<{
  id: OrderOptionalColumnId;
  label: string;
}> = [
  { id: 'paymentMethod', label: 'Payment method' },
  { id: 'country', label: 'Country' },
  { id: 'planType', label: 'Plan type' },
  { id: 'renewalDate', label: 'Renewal date' },
  { id: 'salesChannel', label: 'Sales channel' }
];

export const ORDER_ACTIONS = ['View', 'Edit', 'Refund', 'Cancel order'] as const;
