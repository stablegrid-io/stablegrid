import { Search } from 'lucide-react';
import { CustomersPagination } from '@/components/admin/customers/CustomersPagination';
import type {
  FeedbackRecord,
  FeedbackSortOption
} from '@/components/admin/feedback/types';
import { FEEDBACK_SORT_OPTIONS } from '@/components/admin/feedback/types';
import {
  formatFeedbackDateShort,
  getSentimentBadgeClass,
  getStatusBadgeClass
} from '@/components/admin/feedback/utils';

export function FeedbackTableSection({
  records,
  totalCount,
  page,
  pageCount,
  rowsPerPage,
  query,
  sort,
  loading,
  onQueryChange,
  onSortChange,
  onPageChange,
  onRowsPerPageChange,
  onOpenRecord
}: {
  records: FeedbackRecord[];
  totalCount: number;
  page: number;
  pageCount: number;
  rowsPerPage: number;
  query: string;
  sort: FeedbackSortOption;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSortChange: (value: FeedbackSortOption) => void;
  onPageChange: (value: number) => void;
  onRowsPerPageChange: (value: number) => void;
  onOpenRecord: (record: FeedbackRecord) => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(153,247,255,0.02),transparent_60%)] pointer-events-none" />

      <div className="relative border-b border-white/[0.06] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-on-surface">
              Feedback details
            </h2>
            <p className="mt-1 text-[12px] text-on-surface-variant/35">
              Search, sort, and inspect individual feedback.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem] xl:min-w-[34rem]">
            <label className="relative">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">
                Search
              </span>
              <Search className="pointer-events-none absolute left-3 top-[2.15rem] h-3.5 w-3.5 text-on-surface-variant/30" />
              <input
                aria-label="Search feedback"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search feedback, keywords, user, or page"
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-9 pr-3 text-[13px] font-medium text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/25 focus:border-white/[0.15]"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">
                Sort
              </span>
              <div className="relative">
                <select
                  aria-label="Sort"
                  value={sort}
                  onChange={(event) =>
                    onSortChange(event.target.value as FeedbackSortOption)
                  }
                  className="h-9 w-full appearance-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 pr-8 text-[13px] font-medium text-on-surface outline-none transition-colors cursor-pointer focus:border-white/[0.15]"
                >
                  {FEEDBACK_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-on-surface-variant/40">
                  <svg aria-hidden="true" viewBox="0 0 12 8" className="h-2 w-2 fill-current">
                    <path d="M6 8 0 0h12L6 8Z" />
                  </svg>
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/35">
              <th className="border-b border-white/[0.06] px-5 py-3">User</th>
              <th className="border-b border-white/[0.06] px-4 py-3">Date</th>
              <th className="border-b border-white/[0.06] px-4 py-3">Category</th>
              <th className="border-b border-white/[0.06] px-4 py-3">Rating</th>
              <th className="border-b border-white/[0.06] px-4 py-3">Sentiment</th>
              <th className="border-b border-white/[0.06] px-4 py-3">Preview</th>
              <th className="border-b border-white/[0.06] px-4 py-3">Status</th>
              <th className="border-b border-white/[0.06] px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, index) => (
                <tr key={`loading-${index}`} className="animate-pulse">
                  {Array.from({ length: 8 }, (_, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border-b border-white/[0.04] px-5 py-4"
                    >
                      <div className="h-4 rounded-md bg-white/[0.04]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <div className="mx-auto max-w-md rounded-xl border border-dashed border-white/[0.06] bg-white/[0.02] px-6 py-8">
                    <p className="text-[14px] font-medium text-on-surface">
                      No feedback matches the current filters.
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant/35">
                      Try widening the date range or clearing one of the optional filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => onOpenRecord(record)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onOpenRecord(record);
                    }
                  }}
                  tabIndex={0}
                  className="cursor-pointer align-top text-[13px] text-on-surface-variant/60 transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/20"
                >
                  <td className="border-b border-white/[0.04] px-5 py-4">
                    <div>
                      <p className="font-medium text-on-surface">{record.userName}</p>
                      <p className="mt-1 text-[11px] text-on-surface-variant/30">{record.userEmail}</p>
                    </div>
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4 text-on-surface-variant/40">
                    {formatFeedbackDateShort(record.submittedAt)}
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4">
                    <div>
                      <p className="font-medium text-on-surface">{record.category}</p>
                      <p className="mt-1 text-[11px] text-on-surface-variant/30">{record.module}</p>
                    </div>
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4">
                    <span className="font-medium text-on-surface">{record.rating}/5</span>
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium ${getSentimentBadgeClass(record.sentiment)}`}
                    >
                      {record.sentiment}
                    </span>
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4">
                    <div className="max-w-[22rem]">
                      <p className="line-clamp-2 text-[13px] leading-relaxed text-on-surface-variant/60">
                        {record.preview}
                      </p>
                      <p className="mt-1 text-[11px] text-on-surface-variant/25">{record.linkedPage}</p>
                    </div>
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium ${getStatusBadgeClass(record.status)}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-4">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenRecord(record);
                      }}
                      className="inline-flex h-8 items-center rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-[13px] font-medium text-on-surface transition-colors hover:bg-white/[0.08] hover:text-on-surface"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="relative">
        <CustomersPagination
          page={page}
          pageCount={pageCount}
          totalCount={totalCount}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      </div>
    </section>
  );
}
