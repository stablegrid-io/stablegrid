import type {
  OrderOptionalColumnId,
  OrderRecord,
  OrderSortDirection,
  OrderSortKey,
  OrderSortState,
  OrderStatus
} from '@/components/admin/orders/types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const statusRank: Record<OrderStatus, number> = {
  Completed: 1,
  Processing: 2,
  Pending: 3,
  Cancelled: 4
};

const sortByString = (left: string, right: string) =>
  left.localeCompare(right, 'en', { sensitivity: 'base' });

const compareOrders = (left: OrderRecord, right: OrderRecord, key: OrderSortKey): number => {
  if (key === 'date') {
    return new Date(left.date).getTime() - new Date(right.date).getTime();
  }

  if (key === 'amount') {
    return left.amount - right.amount;
  }

  if (key === 'status') {
    return statusRank[left.status] - statusRank[right.status];
  }

  if (key === 'orderNumber') {
    return sortByString(left.orderNumber, right.orderNumber);
  }

  if (key === 'customerName') {
    return sortByString(left.customerName, right.customerName);
  }

  return sortByString(left.product, right.product);
};

export const formatOrderDate = (value: string) => dateFormatter.format(new Date(value));

export const formatOrderAmount = (value: number) => currencyFormatter.format(value);

export const getNextSortDirection = (
  currentSort: OrderSortState,
  nextKey: OrderSortKey
): OrderSortDirection => {
  if (currentSort.key !== nextKey) {
    return nextKey === 'date' || nextKey === 'amount' ? 'desc' : 'asc';
  }

  return currentSort.direction === 'asc' ? 'desc' : 'asc';
};

export const sortOrders = (orders: OrderRecord[], sort: OrderSortState) => {
  const sorted = [...orders].sort((left, right) => {
    const result = compareOrders(left, right, sort.key);
    return sort.direction === 'asc' ? result : -result;
  });

  return sorted;
};

export const paginate = <T,>(items: T[], page: number, rowsPerPage: number) => {
  const startIndex = (page - 1) * rowsPerPage;
  return items.slice(startIndex, startIndex + rowsPerPage);
};

const toCsvCell = (value: string | number) => {
  if (typeof value === 'number') {
    return String(value);
  }

  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
};

const OPTIONAL_COLUMN_LABELS: Record<OrderOptionalColumnId, string> = {
  paymentMethod: 'Payment Method',
  country: 'Country',
  planType: 'Plan Type',
  renewalDate: 'Renewal Date',
  salesChannel: 'Sales Channel'
};

const optionalColumnValue = (order: OrderRecord, columnId: OrderOptionalColumnId): string => {
  if (columnId === 'paymentMethod') {
    return order.paymentMethod;
  }

  if (columnId === 'country') {
    return order.country;
  }

  if (columnId === 'planType') {
    return order.planType;
  }

  if (columnId === 'renewalDate') {
    return formatOrderDate(order.renewalDate);
  }

  return order.salesChannel;
};

export const buildOrdersCsv = (
  orders: OrderRecord[],
  visibleOptionalColumns: OrderOptionalColumnId[]
) => {
  const header = [
    'Order',
    'Customer',
    'Customer Email',
    'Product',
    'Status',
    'Date',
    ...visibleOptionalColumns.map((columnId) => OPTIONAL_COLUMN_LABELS[columnId]),
    'Amount'
  ];

  const rows = orders.map((order) => [
    order.orderNumber,
    order.customerName,
    order.customerEmail,
    order.product,
    order.status,
    formatOrderDate(order.date),
    ...visibleOptionalColumns.map((columnId) => optionalColumnValue(order, columnId)),
    formatOrderAmount(order.amount)
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => toCsvCell(cell)).join(','))
    .join('\n');
};

export const createExportFileName = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `orders-${year}-${month}-${day}.csv`;
};
