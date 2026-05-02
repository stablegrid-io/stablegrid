'use client';

import { Download, Search } from 'lucide-react';
import type { BugSeverityFilter, BugStatusFilter } from '@/components/admin/bugs/types';

const ACCENT = '153,247,255';
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
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
          strokeWidth={1.75}
        />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search bug reports"
          aria-label="Search bug reports"
          className="h-9 w-full pl-9 pr-3 text-[13px] font-normal text-white outline-none transition-all placeholder:text-white/50"
          style={{
            borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.borderColor = `rgba(${ACCENT},0.4)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        />
      </div>

      {/* Result count */}
      <div className="hidden sm:flex items-baseline gap-1 shrink-0 px-1">
        <span className="font-mono text-[15px] tabular-nums text-white/95 leading-none">
          {resultCount}
        </span>
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/55 font-semibold">
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
              className="h-9 px-3 transition-all"
              style={{
                borderRadius: 10,
                background: active ? `rgba(${ACCENT},0.14)` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? `rgba(${ACCENT},0.4)` : 'rgba(255,255,255,0.1)'}`,
                color: active ? `rgb(${ACCENT})` : 'rgba(255,255,255,0.78)',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold whitespace-nowrap">
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
          className="h-9 appearance-none pl-3 pr-7 font-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-white/78 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[rgba(153,247,255,0.35)]"
          style={{
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {SEVERITY_OPTIONS.map((option) => (
            <option key={option} value={option} className="bg-[#181c20]">
              {option === 'All' ? 'All severities' : option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/40">
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
        className="inline-flex h-9 shrink-0 items-center gap-1.5 px-3 transition-all disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onMouseEnter={(e) => {
          if (!exportDisabled) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }}
      >
        <Download className="h-3.5 w-3.5 text-white/55" strokeWidth={2} />
        <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold text-white/78">
          Export
        </span>
      </button>
    </div>
  );
}
