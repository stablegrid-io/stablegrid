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
    <section className="rounded-[24px] border border-white/10 bg-[#07100f]/68 shadow-[0_24px_45px_-35px_rgba(0,0,0,0.9)]">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Feedback details
            </h2>
            <p className="mt-1 text-sm text-[#8ea39a]">
              Search, sort, and inspect individual feedback without losing the broader
              signal.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem] xl:min-w-[34rem]">
            <label className="relative">
              <span className="mb-1.5 block text-[0.64rem] uppercase tracking-[0.18em] text-[#7f948b]">
                Search
              </span>
              <Search className="pointer-events-none absolute left-3 top-[2.35rem] h-4 w-4 text-[#799087]" />
              <input
                aria-label="Search feedback"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search feedback, keywords, user, or page"
                className="h-10 w-full rounded-[14px] border border-white/12 bg-white/[0.04] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-[#70847b] focus:border-brand-400/35 focus:ring-2 focus:ring-brand-400/15"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-[0.64rem] uppercase tracking-[0.18em] text-[#7f948b]">
                Sort
              </span>
              <select
                aria-label="Sort"
                value={sort}
                onChange={(event) =>
                  onSortChange(event.target.value as FeedbackSortOption)
                }
                className="h-10 w-full rounded-[14px] border border-white/12 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-brand-400/35 focus:ring-2 focus:ring-brand-400/15"
              >
                {FEEDBACK_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[0.68rem] uppercase tracking-[0.18em] text-[#7f948b]">
              <th className="border-b border-white/10 px-4 py-3 font-medium sm:px-5">
                User
              </th>
              <th className="border-b border-white/10 px-4 py-3 font-medium">Date</th>
              <th className="border-b border-white/10 px-4 py-3 font-medium">Category</th>
              <th className="border-b border-white/10 px-4 py-3 font-medium">Rating</th>
              <th className="border-b border-white/10 px-4 py-3 font-medium">
                Sentiment
              </th>
              <th className="border-b border-white/10 px-4 py-3 font-medium">
                Short feedback preview
              </th>
              <th className="border-b border-white/10 px-4 py-3 font-medium">Status</th>
              <th className="border-b border-white/10 px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, index) => (
                <tr key={`loading-${index}`} className="animate-pulse">
                  {Array.from({ length: 8 }, (_, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border-b border-white/[0.08] px-4 py-4 sm:px-5"
                    >
                      <div className="h-4 rounded-full bg-white/[0.06]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center sm:px-5">
                  <div className="mx-auto max-w-md rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-8">
                    <p className="text-base font-medium text-white">
                      No feedback matches the current filters.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#8ea39a]">
                      Try widening the date range or clearing one of the optional filters
                      to recover more signal.
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
                  className="cursor-pointer align-top text-sm text-[#d7e2dd] transition hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400/30"
                >
                  <td className="border-b border-white/[0.08] px-4 py-4 sm:px-5">
                    <div>
                      <p className="font-medium text-white">{record.userName}</p>
                      <p className="mt-1 text-xs text-[#8ea39a]">{record.userEmail}</p>
                    </div>
                  </td>
                  <td className="border-b border-white/[0.08] px-4 py-4 text-[#9ab0a7]">
                    {formatFeedbackDateShort(record.submittedAt)}
                  </td>
                  <td className="border-b border-white/[0.08] px-4 py-4">
                    <div>
                      <p className="font-medium text-white">{record.category}</p>
                      <p className="mt-1 text-xs text-[#8ea39a]">{record.module}</p>
                    </div>
                  </td>
                  <td className="border-b border-white/[0.08] px-4 py-4">
                    <span className="font-medium text-white">{record.rating}/5</span>
                  </td>
                  <td className="border-b border-white/[0.08] px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getSentimentBadgeClass(record.sentiment)}`}
                    >
                      {record.sentiment}
                    </span>
                  </td>
                  <td className="border-b border-white/[0.08] px-4 py-4">
                    <div className="max-w-[22rem]">
                      <p className="line-clamp-2 text-sm leading-6 text-[#d7e2dd]">
                        {record.preview}
                      </p>
                      <p className="mt-1 text-xs text-[#7f948b]">{record.linkedPage}</p>
                    </div>
                  </td>
                  <td className="border-b border-white/[0.08] px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(record.status)}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="border-b border-white/[0.08] px-4 py-4">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenRecord(record);
                      }}
                      className="inline-flex h-9 items-center rounded-[12px] border border-white/12 bg-white/[0.04] px-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07]"
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

      <CustomersPagination
        page={page}
        pageCount={pageCount}
        totalCount={totalCount}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </section>
  );
}
