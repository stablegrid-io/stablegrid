import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { BugSeverityBadge } from '@/components/admin/bugs/BugSeverityBadge';
import { BugStatusBadge } from '@/components/admin/bugs/BugStatusBadge';
import type { BugReport, BugSortKey, BugSortState } from '@/components/admin/bugs/types';
import { formatSubmittedAt } from '@/components/admin/bugs/utils';

const COLUMNS: Array<{
  id: 'report' | 'reporter' | 'severity' | 'status' | 'submittedAt' | 'module';
  label: string;
  sortable?: boolean;
  sortKey?: BugSortKey;
  align?: 'left' | 'right';
}> = [
  { id: 'report', label: 'Report' },
  { id: 'reporter', label: 'Reporter' },
  { id: 'severity', label: 'Severity', sortable: true, sortKey: 'severity' },
  { id: 'status', label: 'Status', sortable: true, sortKey: 'status' },
  { id: 'submittedAt', label: 'Submitted', sortable: true, sortKey: 'submittedAt' },
  { id: 'module', label: 'Module', sortable: true, sortKey: 'module' }
];

const SortIcon = ({
  sort,
  sortKey
}: {
  sort: BugSortState;
  sortKey: BugSortKey;
}) => {
  if (sort.key !== sortKey) {
    return <ArrowUpDown className="h-3 w-3 text-on-surface-variant/25" />;
  }

  return sort.direction === 'asc' ? (
    <ArrowUp className="h-3 w-3 text-on-surface-variant/60" />
  ) : (
    <ArrowDown className="h-3 w-3 text-on-surface-variant/60" />
  );
};

const SkeletonRow = () => (
  <tr>
    <td className="border-b border-white/[0.04] px-5 py-4">
      <div className="h-4 w-56 animate-pulse rounded-md bg-white/[0.04]" />
      <div className="mt-2 h-3 w-72 animate-pulse rounded-md bg-white/[0.03]" />
    </td>
    {Array.from({ length: COLUMNS.length - 1 }).map((_, index) => (
      <td key={index} className="border-b border-white/[0.04] px-4 py-4">
        <div className="h-4 w-24 animate-pulse rounded-md bg-white/[0.04]" />
      </td>
    ))}
  </tr>
);

export function BugReportsTable({
  rows,
  loading,
  sort,
  onSort,
  onRowClick
}: {
  rows: BugReport[];
  loading: boolean;
  sort: BugSortState;
  onSort: (sortKey: BugSortKey) => void;
  onRowClick: (report: BugReport) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/35">
            {COLUMNS.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={`border-b border-white/[0.06] px-5 py-3 text-left`}
              >
                {column.sortable && column.sortKey ? (
                  <button
                    type="button"
                    onClick={() => onSort(column.sortKey!)}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-on-surface-variant/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  >
                    {column.label}
                    <SortIcon sort={sort} sortKey={column.sortKey} />
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? Array.from({ length: 8 }).map((_, index) => <SkeletonRow key={index} />) : null}

          {!loading && rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} className="px-6 py-14 text-center">
                <div className="mx-auto max-w-md rounded-xl border border-dashed border-white/[0.06] bg-white/[0.02] px-6 py-8">
                  <p className="text-[14px] font-medium text-on-surface">No bug reports found.</p>
                  <p className="mt-2 text-[13px] text-on-surface-variant/35">
                    Try widening the filters to recover more results.
                  </p>
                </div>
              </td>
            </tr>
          ) : null}

          {!loading
            ? rows.map((report) => (
                <tr
                  key={report.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => onRowClick(report)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRowClick(report);
                    }
                  }}
                  className="cursor-pointer text-[13px] transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/20"
                >
                  <td className="border-b border-white/[0.04] px-5 py-4">
                    <p className="max-w-[22rem] truncate font-medium text-on-surface">{report.title}</p>
                    <p className="mt-0.5 max-w-[24rem] truncate text-[11px] text-on-surface-variant/30">
                      {report.shortDescription}
                    </p>
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4">
                    <p className="max-w-[13rem] truncate text-on-surface-variant/60">{report.reporterName}</p>
                    <p className="max-w-[13rem] truncate text-[11px] text-on-surface-variant/30">{report.reporterEmail}</p>
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4">
                    <BugSeverityBadge severity={report.severity} />
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4">
                    <BugStatusBadge status={report.status} />
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4 text-on-surface-variant/40">
                    {formatSubmittedAt(report.submittedAt)}
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4 text-on-surface-variant/60">{report.module}</td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
    </div>
  );
}
