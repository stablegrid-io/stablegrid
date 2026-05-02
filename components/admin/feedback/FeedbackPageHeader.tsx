'use client';

import {
  ADMIN_ENTRY_ANIM_STYLE,
  ADMIN_TOOLBAR_CLASS,
} from '@/components/admin/theme';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import {
  FEEDBACK_DATE_RANGE_OPTIONS,
  FEEDBACK_RATING_OPTIONS,
  FEEDBACK_STATUS_OPTIONS,
  FEEDBACK_TYPE_OPTIONS,
  type FeedbackFilters,
} from '@/components/admin/feedback/types';

const slicerClass =
  'h-9 appearance-none pl-3 pr-7 font-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-white/78 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[rgba(153,247,255,0.35)]';

const slicerStyle: React.CSSProperties = {
  borderRadius: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
};

function SlicerChevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/40">
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
  onFilterChange,
}: {
  filters: FeedbackFilters;
  categoryOptions: string[];
  moduleOptions: string[];
  onFilterChange: (next: FeedbackFilters) => void;
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Admin · Monitor"
        crumb="Feedback"
        title="Sentiment, trends & insights"
        subtitle="Analyze user sentiment, trends, and recurring issues."
      />

      <section
        aria-label="Filter feedback"
        className={ADMIN_TOOLBAR_CLASS}
        style={{
          ...ADMIN_ENTRY_ANIM_STYLE,
          animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 80ms forwards',
        }}
      >
        <div className="flex flex-wrap items-center gap-2 px-2.5 py-2.5">
          <div className="relative">
            <select
              aria-label="Date range"
              value={filters.dateRange}
              onChange={(event) =>
                onFilterChange({
                  ...filters,
                  dateRange: event.target.value as FeedbackFilters['dateRange'],
                })
              }
              className={slicerClass}
              style={slicerStyle}
            >
              {FEEDBACK_DATE_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#181c20]">
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
                  type: event.target.value as FeedbackFilters['type'],
                })
              }
              className={slicerClass}
              style={slicerStyle}
            >
              {FEEDBACK_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-[#181c20]">
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
                  rating: event.target.value as FeedbackFilters['rating'],
                })
              }
              className={slicerClass}
              style={slicerStyle}
            >
              {FEEDBACK_RATING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#181c20]">
                  {option.label}
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
                  status: event.target.value as FeedbackFilters['status'],
                })
              }
              className={slicerClass}
              style={slicerStyle}
            >
              {FEEDBACK_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-[#181c20]">
                  {option === 'All' ? 'All statuses' : option}
                </option>
              ))}
            </select>
            <SlicerChevron />
          </div>

          {categoryOptions.length > 0 ? (
            <div className="relative">
              <select
                aria-label="Category"
                value={filters.category}
                onChange={(event) =>
                  onFilterChange({
                    ...filters,
                    category: event.target.value as FeedbackFilters['category'],
                  })
                }
                className={slicerClass}
                style={slicerStyle}
              >
                <option value="All" className="bg-[#181c20]">
                  All categories
                </option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#181c20]">
                    {option}
                  </option>
                ))}
              </select>
              <SlicerChevron />
            </div>
          ) : null}

          {moduleOptions.length > 0 ? (
            <div className="relative">
              <select
                aria-label="Module"
                value={filters.module}
                onChange={(event) =>
                  onFilterChange({
                    ...filters,
                    module: event.target.value as FeedbackFilters['module'],
                  })
                }
                className={slicerClass}
                style={slicerStyle}
              >
                <option value="All" className="bg-[#181c20]">
                  All modules
                </option>
                {moduleOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#181c20]">
                    {option}
                  </option>
                ))}
              </select>
              <SlicerChevron />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
