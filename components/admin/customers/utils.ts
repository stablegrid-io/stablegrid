import type { Customer, CustomerColumnId, SortDirection, SortState } from '@/components/admin/customers/types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const joinedDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const sortByString = (left: string, right: string) =>
  left.localeCompare(right, 'en', { sensitivity: 'base' });

const compareCustomerValues = (left: Customer, right: Customer, key: CustomerColumnId): number => {
  if (key === 'customer') {
    return sortByString(left.fullName, right.fullName);
  }

  if (key === 'status') {
    return sortByString(left.status, right.status);
  }

  if (key === 'joinedAt') {
    return new Date(left.joinedAt).getTime() - new Date(right.joinedAt).getTime();
  }

  if (key === 'orders') {
    return left.orders - right.orders;
  }

  return left.totalSpent - right.totalSpent;
};

export const formatJoinedDate = (value: string) => joinedDateFormatter.format(new Date(value));

export const formatCurrency = (value: number) => currencyFormatter.format(value);

export const sortCustomers = (customers: Customer[], sort: SortState) => {
  const sorted = [...customers].sort((left, right) => {
    const result = compareCustomerValues(left, right, sort.key);
    return sort.direction === 'asc' ? result : -result;
  });

  return sorted;
};

const toCsvCell = (value: string | number) => {
  if (typeof value === 'number') {
    return String(value);
  }

  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
};

export const buildCustomersCsv = (customers: Customer[]) => {
  const header = ['Customer', 'Email', 'Status', 'Joined', 'Orders', 'Total Spent'];
  const rows = customers.map((customer) => [
    customer.fullName,
    customer.email,
    customer.status,
    formatJoinedDate(customer.joinedAt),
    customer.orders,
    formatCurrency(customer.totalSpent)
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => toCsvCell(cell)).join(','))
    .join('\n');
};

export const getNextSortDirection = (
  currentSort: SortState,
  key: CustomerColumnId
): SortDirection => {
  if (currentSort.key !== key) {
    return 'asc';
  }

  return currentSort.direction === 'asc' ? 'desc' : 'asc';
};

export const paginate = <T,>(items: T[], page: number, rowsPerPage: number) => {
  const startIndex = (page - 1) * rowsPerPage;
  return items.slice(startIndex, startIndex + rowsPerPage);
};
