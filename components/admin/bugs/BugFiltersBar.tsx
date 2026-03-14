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
    <div className="space-y-4 border-b border-white/10 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1"
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
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35 ${
                  active
                    ? 'bg-[#101716] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : 'text-[#9db1a8] hover:text-white'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="bug-severity-filter">
            Filter by severity
          </label>
          <select
            id="bug-severity-filter"
            value={severityFilter}
            onChange={(event) => onSeverityFilterChange(event.target.value as BugSeverityFilter)}
            className="h-10 rounded-[12px] border border-white/12 bg-white/[0.04] px-3 text-sm font-medium text-white outline-none transition focus:border-brand-400/35 focus:ring-2 focus:ring-brand-400/20"
          >
            {SEVERITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'Severity: All' : option}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-white/12 bg-white/[0.04] px-3.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Download className="h-4 w-4 text-[#9cb0a7]" />
            Export
          </button>
        </div>
      </div>

      <label className="relative block w-full max-w-md">
        <span className="sr-only">Search bug reports</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f857c]" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search bug reports..."
          className="h-11 w-full rounded-[14px] border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-[#6f857c] focus:border-brand-400/35 focus:ring-2 focus:ring-brand-400/15"
        />
      </label>
    </div>
  );
}
