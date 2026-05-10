import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { BugSeverityBadge } from '@/components/admin/bugs/BugSeverityBadge';
import { BugStatusBadge } from '@/components/admin/bugs/BugStatusBadge';
import { ADMIN_TABLE_SURFACE_CLASS } from '@/components/admin/theme';
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
  { id: 'module', label: 'Module', sortable: true, sortKey: 'module' },
];

const SortIcon = ({ sort, sortKey }: { sort: BugSortState; sortKey: BugSortKey }) => {
  if (sort.key !== sortKey) {
    return <ArrowUpDown className="h-3 w-3 text-on-surface-variant" strokeWidth={2} />;
  }
  return sort.direction === 'asc' ? (
    <ArrowUp className="h-3 w-3 text-primary" strokeWidth={2.5} />
  ) : (
    <ArrowDown className="h-3 w-3 text-primary" strokeWidth={2.5} />
  );
};

const SkeletonRow = () => (
  <tr className="border-t border-surface-dim">
    <td className="px-5 py-4">
      <div className="h-4 w-56 animate-pulse bg-surface-container-low" />
      <div className="mt-2 h-3 w-72 animate-pulse bg-surface-container-low" />
    </td>
    {Array.from({ length: COLUMNS.length - 1 }).map((_, index) => (
      <td key={index} className="px-5 py-4">
        <div className="h-4 w-24 animate-pulse bg-surface-container-low" />
      </td>
    ))}
  </tr>
);

export function BugReportsTable({
  rows,
  loading,
  sort,
  onSort,
  onRowClick,
}: {
  rows: BugReport[];
  loading: boolean;
  sort: BugSortState;
  onSort: (sortKey: BugSortKey) => void;
  onRowClick: (report: BugReport) => void;
}) {
  return (
    <div className={ADMIN_TABLE_SURFACE_CLASS}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-surface-dim">
              {COLUMNS.map((column) => (
                <th key={column.id} scope="col" className="px-5 py-3.5 text-left">
                  {column.sortable && column.sortKey ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sortKey!)}
                      className="inline-flex items-center gap-1.5 font-data-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-on-surface-variant transition hover:text-on-surface"
                    >
                      {column.label}
                      <SortIcon sort={sort} sortKey={column.sortKey} />
                    </button>
                  ) : (
                    <span className="font-data-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-on-surface-variant">
                      {column.label}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, index) => <SkeletonRow key={index} />)
              : null}

            {!loading && rows.length === 0 ? (
              <tr className="border-t border-surface-dim">
                <td colSpan={COLUMNS.length} className="px-6 py-16 text-center">
                  <p className="font-data-mono text-[11px] tracking-[0.18em] uppercase text-on-surface-variant mb-1">
                    No matches
                  </p>
                  <p className="font-body text-[13px] text-on-surface-variant">
                    Try widening the filters to recover more results.
                  </p>
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
                    className="group border-t border-surface-dim cursor-pointer transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                  >
                    <td className="px-5 py-4">
                      <p className="max-w-[22rem] truncate font-body text-[14px] font-semibold text-on-surface">
                        {report.title}
                      </p>
                      <p className="mt-0.5 max-w-[24rem] truncate font-body text-[12px] text-on-surface-variant">
                        {report.shortDescription}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[13rem] truncate font-body text-[14px] text-on-surface">
                        {report.reporterName}
                      </p>
                      <p className="max-w-[13rem] truncate font-body text-[12px] text-on-surface-variant">
                        {report.reporterEmail}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <BugSeverityBadge severity={report.severity} />
                    </td>
                    <td className="px-5 py-4">
                      <BugStatusBadge status={report.status} />
                    </td>
                    <td className="px-5 py-4 font-data-mono text-[13px] text-on-surface tabular-nums">
                      {formatSubmittedAt(report.submittedAt)}
                    </td>
                    <td className="px-5 py-4 font-body text-[13px] text-on-surface">{report.module}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
