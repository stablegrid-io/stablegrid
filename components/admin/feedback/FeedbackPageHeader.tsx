import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  FEEDBACK_DATE_RANGE_OPTIONS,
  FEEDBACK_RATING_OPTIONS,
  FEEDBACK_STATUS_OPTIONS,
  FEEDBACK_TYPE_OPTIONS,
  type FeedbackFilters
} from '@/components/admin/feedback/types';

const FILTER_SELECT_CLASS =
  'h-10 rounded-[14px] border border-white/12 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-brand-400/35 focus:ring-2 focus:ring-brand-400/15';

function FilterField({
  label,
  value,
  children,
  className
}: {
  label: string;
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[0.64rem] uppercase tracking-[0.2em] text-[#7f948b]">
        {label}
      </span>
      <div data-filter-value={value}>{children}</div>
    </label>
  );
}

export function FeedbackPageHeader({
  filters,
  categoryOptions,
  moduleOptions,
  onFilterChange
}: {
  filters: FeedbackFilters;
  categoryOptions: string[];
  moduleOptions: string[];
  onFilterChange: (next: FeedbackFilters) => void;
}) {
  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm text-[#8ea39a]"
          >
            <Link
              href="/admin"
              className="rounded-md px-1 py-0.5 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40"
            >
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#62756c]" />
            <span className="text-[#d5e2dd]">Feedback</span>
          </nav>

          <div>
            <h1
              className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Feedback
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#8ea39a]">
              Analyze user sentiment, trends, and recurring issues.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:w-[42rem] xl:grid-cols-3">
          <FilterField
            label="Date range"
            value={filters.dateRange}
            className="sm:col-span-2 xl:col-span-1"
          >
            <select
              aria-label="Date range"
              value={filters.dateRange}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  dateRange: event.target.value as FeedbackFilters['dateRange']
                })
              }
              className={FILTER_SELECT_CLASS}
            >
              {FEEDBACK_DATE_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Feedback type" value={filters.type}>
            <select
              aria-label="Feedback type"
              value={filters.type}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  type: event.target.value as FeedbackFilters['type']
                })
              }
              className={FILTER_SELECT_CLASS}
            >
              {FEEDBACK_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Rating" value={filters.rating}>
            <select
              aria-label="Rating"
              value={filters.rating}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  rating: event.target.value as FeedbackFilters['rating']
                })
              }
              className={FILTER_SELECT_CLASS}
            >
              {FEEDBACK_RATING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Category" value={filters.category}>
            <select
              aria-label="Category"
              value={filters.category}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  category: event.target.value as FeedbackFilters['category']
                })
              }
              className={FILTER_SELECT_CLASS}
            >
              <option value="All">All</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Status" value={filters.status}>
            <select
              aria-label="Status"
              value={filters.status}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  status: event.target.value as FeedbackFilters['status']
                })
              }
              className={FILTER_SELECT_CLASS}
            >
              {FEEDBACK_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Product area" value={filters.module}>
            <select
              aria-label="Product area"
              value={filters.module}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  module: event.target.value as FeedbackFilters['module']
                })
              }
              className={FILTER_SELECT_CLASS}
            >
              <option value="All">All</option>
              {moduleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterField>
        </div>
      </div>
    </header>
  );
}
