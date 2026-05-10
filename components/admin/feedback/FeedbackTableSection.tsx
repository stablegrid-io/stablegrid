import { Search } from 'lucide-react';
import { CustomersPagination } from '@/components/admin/customers/CustomersPagination';
import {
  ADMIN_GHOST_BUTTON_CLASS,
  ADMIN_MONO_BUTTON_TEXT_CLASS,
  ADMIN_TABLE_HEADER_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_SURFACE_CLASS,
  ADMIN_TOOLBAR_CLASS,
} from '@/components/admin/theme';
import type {
  FeedbackRecord,
  FeedbackSortOption,
} from '@/components/admin/feedback/types';
import { FEEDBACK_SORT_OPTIONS } from '@/components/admin/feedback/types';
import {
  formatFeedbackDateShort,
  getSentimentBadgeClass,
  getStatusBadgeClass,
} from '@/components/admin/feedback/utils';

const slicerClass =
  'h-9 appearance-none pl-3 pr-7 border border-surface-dim bg-surface font-data-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-on-surface outline-none cursor-pointer transition-colors hover:bg-surface-container focus:ring-2 focus:ring-primary/30 focus:border-primary';

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
  onOpenRecord,
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
    <section className="space-y-3">
      {/* Editorial toolbar — search + sort */}
      <div className={ADMIN_TOOLBAR_CLASS}>
        <div className="flex flex-wrap items-center gap-2 px-2.5 py-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search feedback, keywords, user, or page"
              aria-label="Search feedback"
              className="h-9 w-full pl-9 pr-3 border border-surface-dim bg-surface-container-low font-body text-[13px] text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="hidden sm:flex items-baseline gap-1 shrink-0 px-1">
            <span className="font-data-mono text-[15px] tabular-nums text-on-surface leading-none">
              {totalCount}
            </span>
            <span className="font-data-mono text-[9px] tracking-[0.2em] uppercase text-on-surface-variant font-semibold">
              {totalCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          <div className="relative shrink-0">
            <select
              aria-label="Sort"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as FeedbackSortOption)}
              className={slicerClass}
            >
              {FEEDBACK_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-surface">
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant">
              <svg aria-hidden="true" viewBox="0 0 12 8" className="h-[7px] w-[7px] fill-current">
                <path d="M6 8 0 0h12L6 8Z" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className={ADMIN_TABLE_SURFACE_CLASS}>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-surface-dim">
                {[
                  'User',
                  'Date',
                  'Category',
                  'Rating',
                  'Sentiment',
                  'Preview',
                  'Status',
                  'Actions',
                ].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className={`${ADMIN_TABLE_HEADER_CLASS} text-left`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={`loading-${index}`} className="border-t border-surface-dim">
                    {Array.from({ length: 8 }, (_, cellIndex) => (
                      <td key={cellIndex} className="px-5 py-4">
                        <div className="h-4 animate-pulse bg-surface-container-low" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr className="border-t border-surface-dim">
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <p className="font-data-mono text-[11px] tracking-[0.18em] uppercase text-on-surface-variant mb-1">
                      No matches
                    </p>
                    <p className="font-body text-[13px] text-on-surface-variant">
                      Try widening the date range or clearing one of the optional filters.
                    </p>
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
                    className={`${ADMIN_TABLE_ROW_CLASS} group cursor-pointer align-top focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-body text-[14px] font-semibold text-on-surface">{record.userName}</p>
                      <p className="mt-0.5 font-body text-[12px] text-on-surface-variant">{record.userEmail}</p>
                    </td>
                    <td className="px-5 py-4 font-data-mono text-[13px] text-on-surface tabular-nums">
                      {formatFeedbackDateShort(record.submittedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-body text-[14px] font-semibold text-on-surface">{record.category}</p>
                      <p className="mt-0.5 font-body text-[12px] text-on-surface-variant">{record.module}</p>
                    </td>
                    <td className="px-5 py-4 font-data-mono text-[14px] font-semibold text-on-surface tabular-nums">
                      {record.rating}/5
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center border px-2.5 py-1 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${getSentimentBadgeClass(record.sentiment)}`}
                      >
                        {record.sentiment}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-[22rem]">
                        <p className="line-clamp-2 font-body text-[13px] leading-relaxed text-on-surface">
                          {record.preview}
                        </p>
                        <p className="mt-1 font-data-mono text-[11px] text-on-surface-variant">{record.linkedPage}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center border px-2.5 py-1 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${getStatusBadgeClass(record.status)}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenRecord(record);
                        }}
                        className={ADMIN_GHOST_BUTTON_CLASS}
                      >
                        <span className={ADMIN_MONO_BUTTON_TEXT_CLASS}>
                          Open
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
