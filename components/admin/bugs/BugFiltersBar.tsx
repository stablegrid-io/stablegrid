'use client';

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
  exportDisabled,
  resultCount,
}: {
  statusFilter: BugStatusFilter;
  onStatusFilterChange: (value: BugStatusFilter) => void;
  severityFilter: BugSeverityFilter;
  onSeverityFilterChange: (value: BugSeverityFilter) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onExport: () => void;
  exportDisabled: boolean;
  resultCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-2.5 py-2.5">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          strokeWidth={1.75}
        />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search bug reports"
          aria-label="Search bug reports"
          className="h-9 w-full border border-surface-dim bg-surface-container-low pl-9 pr-3 font-body text-[13px] font-normal text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Result count */}
      <div className="hidden sm:flex items-baseline gap-1 shrink-0 px-1">
        <span className="font-data-mono text-[15px] tabular-nums text-on-surface leading-none">
          {resultCount}
        </span>
        <span className="font-data-mono text-[9px] tracking-[0.2em] uppercase text-on-surface-variant font-semibold">
          {resultCount === 1 ? 'bug' : 'bugs'}
        </span>
      </div>

      {/* Status pills */}
      <div className="inline-flex items-center gap-1 shrink-0" role="tablist">
        {STATUS_OPTIONS.map((option) => {
          const active = statusFilter === option;
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onStatusFilterChange(option)}
              className={`h-9 px-3 border transition-colors ${
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-surface-dim bg-surface text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="font-data-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold whitespace-nowrap">
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {/* Severity select */}
      <div className="relative shrink-0">
        <select
          aria-label="Filter by severity"
          value={severityFilter}
          onChange={(event) => onSeverityFilterChange(event.target.value as BugSeverityFilter)}
          className="h-9 appearance-none border border-surface-dim bg-surface pl-3 pr-7 font-data-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-on-surface outline-none cursor-pointer transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
        >
          {SEVERITY_OPTIONS.map((option) => (
            <option key={option} value={option} className="bg-surface text-on-surface">
              {option === 'All' ? 'All severities' : option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant">
          <svg aria-hidden="true" viewBox="0 0 12 8" className="h-[7px] w-[7px] fill-current">
            <path d="M6 8 0 0h12L6 8Z" />
          </svg>
        </span>
      </div>

      {/* Export */}
      <button
        type="button"
        onClick={onExport}
        disabled={exportDisabled}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 border border-surface-dim bg-surface px-3 text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <Download className="h-3.5 w-3.5 text-on-surface-variant" strokeWidth={2} />
        <span className="font-data-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold text-on-surface">
          Export
        </span>
      </button>
    </div>
  );
}
