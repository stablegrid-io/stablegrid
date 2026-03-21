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

const alignClass = (align: 'left' | 'right' | undefined) =>
  align === 'right' ? 'text-right' : 'text-left';

const SortIcon = ({
  sort,
  sortKey
}: {
  sort: BugSortState;
  sortKey: BugSortKey;
}) => {
  if (sort.key !== sortKey) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-[#5f7269]" />;
  }

  return sort.direction === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-[#d6e4de]" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-[#d6e4de]" />
  );
};

const SkeletonRow = () => (
  <tr className="border-t border-outline-variant/20">
    <td className="px-4 py-4">
      <div className="h-4 w-56 animate-pulse rounded bg-surface-container-high" />
      <div className="mt-2 h-3 w-72 animate-pulse rounded bg-surface-container" />
    </td>
    {Array.from({ length: COLUMNS.length - 1 }).map((_, index) => (
      <td key={index} className="px-4 py-4">
        <div className="h-4 w-24 animate-pulse rounded bg-surface-container-high" />
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
    <div className="overflow-hidden  border border-outline-variant/20 bg-surface-container-low/65">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-white/[0.02]">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#8ca098] ${alignClass(column.align)}`}
                >
                  {column.sortable && column.sortKey ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sortKey!)}
                      className="inline-flex items-center gap-1.5 transition hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35"
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
              <tr className="border-t border-outline-variant/20">
                <td colSpan={COLUMNS.length} className="px-6 py-14 text-center text-sm text-[#8ea39a]">
                  No bug reports found for the current filters.
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
                    className="group border-t border-outline-variant/20 transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/30"
                  >
                    <td className="px-4 py-3.5">
                      <p className="max-w-[22rem] truncate text-sm font-semibold text-on-surface">{report.title}</p>
                      <p className="mt-0.5 max-w-[24rem] truncate text-xs text-[#7f948b]">
                        {report.shortDescription}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="max-w-[13rem] truncate text-sm text-[#d3e0da]">{report.reporterName}</p>
                      <p className="max-w-[13rem] truncate text-xs text-[#7f948b]">{report.reporterEmail}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <BugSeverityBadge severity={report.severity} />
                    </td>
                    <td className="px-4 py-3.5">
                      <BugStatusBadge status={report.status} />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#d3e0da]">
                      {formatSubmittedAt(report.submittedAt)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#d3e0da]">{report.module}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
