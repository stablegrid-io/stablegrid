import { Download, Search } from 'lucide-react';
import type { BugSeverityFilter, BugStatusFilter } from '@/components/admin/bugs/types';

const STATUS_OPTIONS: BugStatusFilter[] = ['All', 'New', 'In Review', 'Resolved'];
const SEVERITY_OPTIONS: BugSeverityFilter[] = ['All', 'Low', 'Medium', 'High', 'Critical'];

export function BugFiltersBar({
  statusFilter,
  onStatusFilterChange,
  severityFilter,
  onSeverityFilterChange,
  query,
  onQueryChange,
  onExport,
  exportDisabled
}: {
  statusFilter: BugStatusFilter;
  onStatusFilterChange: (value: BugStatusFilter) => void;
  severityFilter: BugSeverityFilter;
  onSeverityFilterChange: (value: BugSeverityFilter) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onExport: () => void;
  exportDisabled: boolean;
}) {
  return (
    <div className="space-y-4 border-b border-white/[0.06] px-6 py-5 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1"
          role="tablist"
          aria-label="Bug report status filter"
        >
          {STATUS_OPTIONS.map((option) => {
            const active = statusFilter === option;
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onStatusFilterChange(option)}
                className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
                  active
                    ? 'bg-white/[0.1] text-on-surface shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
                    : 'text-on-surface-variant/50 hover:text-on-surface-variant/80'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              aria-label="Filter by severity"
              value={severityFilter}
              onChange={(event) => onSeverityFilterChange(event.target.value as BugSeverityFilter)}
              className="h-8 appearance-none rounded-full border border-white/[0.08] bg-white/[0.04] pl-3 pr-7 text-[12px] font-medium text-on-surface/80 outline-none transition-all cursor-pointer hover:bg-white/[0.07] hover:border-white/[0.12] focus:border-white/[0.18]"
            >
              {SEVERITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All severities' : option}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant/30">
              <svg aria-hidden="true" viewBox="0 0 12 8" className="h-[7px] w-[7px] fill-current">
                <path d="M6 8 0 0h12L6 8Z" />
              </svg>
            </span>
          </div>

          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 text-[12px] font-medium text-on-surface/80 transition-all hover:bg-white/[0.07] hover:border-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5 text-on-surface-variant/40" />
            Export
          </button>
        </div>
      </div>

      <label className="relative block w-full max-w-md">
        <span className="sr-only">Search bug reports</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant/30" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search bug reports..."
          className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-9 pr-3 text-[13px] font-medium text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/25 focus:border-white/[0.15]"
        />
      </label>
    </div>
  );
}
