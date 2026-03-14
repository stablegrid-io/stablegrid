import type { BugReport, BugSortDirection, BugSortKey, BugSortState } from '@/components/admin/bugs/types';

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});

const csvDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const severityRank: Record<BugReport['severity'], number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4
};

const statusRank: Record<BugReport['status'], number> = {
  New: 1,
  'In Review': 2,
  Resolved: 3
};

const sortByString = (left: string, right: string) =>
  left.localeCompare(right, 'en', { sensitivity: 'base' });

const compareBugValues = (left: BugReport, right: BugReport, key: BugSortKey): number => {
  if (key === 'submittedAt') {
    return new Date(left.submittedAt).getTime() - new Date(right.submittedAt).getTime();
  }

  if (key === 'severity') {
    return severityRank[left.severity] - severityRank[right.severity];
  }

  if (key === 'status') {
    return statusRank[left.status] - statusRank[right.status];
  }

  return sortByString(left.module, right.module);
};

export const formatSubmittedAt = (value: string) => dateTimeFormatter.format(new Date(value));

export const getNextSortDirection = (
  currentSort: BugSortState,
  key: BugSortKey
): BugSortDirection => {
  if (currentSort.key !== key) {
    return key === 'submittedAt' ? 'desc' : 'asc';
  }

  return currentSort.direction === 'asc' ? 'desc' : 'asc';
};

export const sortBugReports = (reports: BugReport[], sort: BugSortState) => {
  const sorted = [...reports].sort((left, right) => {
    const result = compareBugValues(left, right, sort.key);
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

export const buildBugReportsCsv = (reports: BugReport[]) => {
  const header = [
    'Report',
    'Reporter',
    'Reporter Email',
    'Severity',
    'Status',
    'Submitted',
    'Module'
  ];

  const rows = reports.map((report) => [
    report.title,
    report.reporterName,
    report.reporterEmail,
    report.severity,
    report.status,
    csvDateFormatter.format(new Date(report.submittedAt)),
    report.module
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => toCsvCell(cell)).join(','))
    .join('\n');
};

export const paginate = <T,>(items: T[], page: number, rowsPerPage: number) => {
  const startIndex = (page - 1) * rowsPerPage;
  return items.slice(startIndex, startIndex + rowsPerPage);
};
