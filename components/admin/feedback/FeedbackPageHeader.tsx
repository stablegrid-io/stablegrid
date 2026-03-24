import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  FEEDBACK_DATE_RANGE_OPTIONS,
  FEEDBACK_RATING_OPTIONS,
  FEEDBACK_STATUS_OPTIONS,
  FEEDBACK_TYPE_OPTIONS,
  type FeedbackFilters
} from '@/components/admin/feedback/types';

const SLICER_CLASS =
  'h-8 appearance-none rounded-full border border-white/[0.08] bg-white/[0.04] pl-3 pr-7 text-[12px] font-medium text-on-surface/80 outline-none transition-all cursor-pointer hover:bg-white/[0.07] hover:border-white/[0.12] focus:border-white/[0.18] focus:bg-white/[0.06]';

function SlicerChevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant/30">
      <svg aria-hidden="true" viewBox="0 0 12 8" className="h-[7px] w-[7px] fill-current">
        <path d="M6 8 0 0h12L6 8Z" />
      </svg>
    </span>
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
    <header className="space-y-5">
      <div>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-[13px] text-on-surface-variant/40"
        >
          <Link
            href="/admin"
            className="rounded-md px-1.5 py-0.5 transition hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3 text-on-surface-variant/25" />
          <span className="text-on-surface-variant/70">Feedback</span>
        </nav>

        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/50">Feedback</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
            Sentiment, trends &amp; insights
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] text-on-surface-variant/40">
            Analyze user sentiment, trends, and recurring issues.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            aria-label="Date range"
            value={filters.dateRange}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                dateRange: event.target.value as FeedbackFilters['dateRange']
              })
            }
            className={SLICER_CLASS}
          >
            {FEEDBACK_DATE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <SlicerChevron />
        </div>

        <div className="relative">
          <select
            aria-label="Feedback type"
            value={filters.type}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                type: event.target.value as FeedbackFilters['type']
              })
            }
            className={SLICER_CLASS}
          >
            {FEEDBACK_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All types' : option}
              </option>
            ))}
          </select>
          <SlicerChevron />
        </div>

        <div className="relative">
          <select
            aria-label="Rating"
            value={filters.rating}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                rating: event.target.value as FeedbackFilters['rating']
              })
            }
            className={SLICER_CLASS}
          >
            {FEEDBACK_RATING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <SlicerChevron />
        </div>

        <div className="relative">
          <select
            aria-label="Category"
            value={filters.category}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                category: event.target.value as FeedbackFilters['category']
              })
            }
            className={SLICER_CLASS}
          >
            <option value="All">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <SlicerChevron />
        </div>

        <div className="relative">
          <select
            aria-label="Status"
            value={filters.status}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                status: event.target.value as FeedbackFilters['status']
              })
            }
            className={SLICER_CLASS}
          >
            {FEEDBACK_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All statuses' : option}
              </option>
            ))}
          </select>
          <SlicerChevron />
        </div>

        <div className="relative">
          <select
            aria-label="Product area"
            value={filters.module}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                module: event.target.value as FeedbackFilters['module']
              })
            }
            className={SLICER_CLASS}
          >
            <option value="All">All areas</option>
            {moduleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <SlicerChevron />
        </div>
      </div>
    </header>
  );
}
