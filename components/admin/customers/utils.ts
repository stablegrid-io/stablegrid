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

const progressRatio = (current: number, total: number) =>
  total > 0 ? current / total : -1;

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

  if (key === 'totalSpent') {
    return left.totalSpent - right.totalSpent;
  }

  if (key === 'theoryProgress') {
    return (
      progressRatio(left.theoryModulesCompleted, left.theoryModulesTotal) -
      progressRatio(right.theoryModulesCompleted, right.theoryModulesTotal)
    );
  }

  if (key === 'practiceProgress') {
    return (
      progressRatio(left.practiceTasksSolved, left.practiceTasksTotal) -
      progressRatio(right.practiceTasksSolved, right.practiceTasksTotal)
    );
  }

  if (key === 'lessons') {
    return (
      progressRatio(left.lessonsCompleted, left.lessonsTotal) -
      progressRatio(right.lessonsCompleted, right.lessonsTotal)
    );
  }

  if (key === 'kwh') {
    return left.kwhTotal - right.kwhTotal;
  }

  // lastActive — nulls sort to the bottom regardless of direction
  const leftTs = left.lastActiveAt ? Date.parse(left.lastActiveAt) : Number.NEGATIVE_INFINITY;
  const rightTs = right.lastActiveAt ? Date.parse(right.lastActiveAt) : Number.NEGATIVE_INFINITY;
  return leftTs - rightTs;
};

export const formatJoinedDate = (value: string) => joinedDateFormatter.format(new Date(value));

export const formatCurrency = (value: number) => currencyFormatter.format(value);

export const formatProgressFraction = (current: number, total: number) =>
  total <= 0 ? '—' : `${current.toLocaleString()} / ${total.toLocaleString()}`;

export const formatPercent = (current: number, total: number) => {
  if (total <= 0) return '—';
  const pct = Math.round((current / total) * 100);
  return `${Math.min(100, Math.max(0, pct))}%`;
};

export const progressPercentValue = (current: number, total: number) => {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (current / total) * 100));
};

export const formatKwh = (value: number) => `${value.toLocaleString()} kWh`;

/**
 * "Currently online" heuristic — true when the user's last tracked activity
 * happened within ONLINE_THRESHOLD_MS. The signal comes from
 * `lastActiveAt` (max of `user_progress.last_activity` and
 * `topic_progress.last_activity_at`), so it bumps on real engagement
 * (reading a lesson, solving a task) rather than mere session presence.
 */
export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export const isCustomerOnline = (lastActiveAt: string | null): boolean => {
  if (!lastActiveAt) return false;
  const parsed = Date.parse(lastActiveAt);
  if (!Number.isFinite(parsed)) return false;
  return Date.now() - parsed < ONLINE_THRESHOLD_MS;
};

export const formatRelativeTime = (iso: string | null) => {
  if (!iso) return '—';
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return '—';
  const diff = Date.now() - parsed;
  if (diff < 0) return '—';
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.round(months / 12);
  return `${years}y ago`;
};

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
  const header = [
    'Customer',
    'Email',
    'Status',
    'Joined',
    'Theory completed',
    'Theory total',
    'Lessons read',
    'Lessons total',
    'Practice solved',
    'Practice total',
    'kWh',
    'Last active',
    'Online',
    'Orders',
    'Total Spent'
  ];
  const rows = customers.map((customer) => [
    customer.fullName,
    customer.email,
    customer.status,
    formatJoinedDate(customer.joinedAt),
    customer.theoryModulesCompleted,
    customer.theoryModulesTotal,
    customer.lessonsCompleted,
    customer.lessonsTotal,
    customer.practiceTasksSolved,
    customer.practiceTasksTotal,
    customer.kwhTotal,
    customer.lastActiveAt ?? '',
    isCustomerOnline(customer.lastActiveAt) ? 'yes' : 'no',
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
