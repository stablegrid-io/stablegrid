import { Search } from 'lucide-react';
import { CustomersPagination } from '@/components/admin/customers/CustomersPagination';
import {
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

const ACCENT = '153,247,255';

const slicerStyle: React.CSSProperties = {
  borderRadius: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
};

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
      {/* Frosted toolbar — search + sort */}
      <div className={ADMIN_TOOLBAR_CLASS}>
        <div className="flex flex-wrap items-center gap-2 px-2.5 py-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search feedback, keywords, user, or page"
              aria-label="Search feedback"
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

          <div className="hidden sm:flex items-baseline gap-1 shrink-0 px-1">
            <span className="font-mono text-[15px] tabular-nums text-white/95 leading-none">
              {totalCount}
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/55 font-semibold">
              {totalCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          <div className="relative shrink-0">
            <select
              aria-label="Sort"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as FeedbackSortOption)}
              className="h-9 appearance-none pl-3 pr-7 font-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-white/78 outline-none cursor-pointer transition-all"
              style={slicerStyle}
            >
              {FEEDBACK_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#181c20]">
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/40">
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
              <tr className="border-b border-white/[0.06]">
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
                    className="px-5 py-3.5 text-left font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-white/55"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={`loading-${index}`} className="border-t border-white/[0.04]">
                    {Array.from({ length: 8 }, (_, cellIndex) => (
                      <td key={cellIndex} className="px-5 py-4">
                        <div className="h-4 animate-pulse rounded bg-white/[0.06]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr className="border-t border-white/[0.04]">
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-white/40 mb-1">
                      No matches
                    </p>
                    <p className="text-[13px] text-white/55">
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
                    className="group border-t border-white/[0.04] cursor-pointer align-top transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(153,247,255,0.3)]"
                  >
                    <td className="px-5 py-4">
                      <p className="text-[14px] font-semibold text-white">{record.userName}</p>
                      <p className="mt-0.5 text-[12px] text-white/50">{record.userEmail}</p>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-white/70 font-mono tabular-nums">
                      {formatFeedbackDateShort(record.submittedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[14px] font-semibold text-white">{record.category}</p>
                      <p className="mt-0.5 text-[12px] text-white/50">{record.module}</p>
                    </td>
                    <td className="px-5 py-4 text-[14px] font-semibold text-white font-mono tabular-nums">
                      {record.rating}/5
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${getSentimentBadgeClass(record.sentiment)}`}
                      >
                        {record.sentiment}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-[22rem]">
                        <p className="line-clamp-2 text-[13px] leading-relaxed text-white/70">
                          {record.preview}
                        </p>
                        <p className="mt-1 text-[11px] text-white/40">{record.linkedPage}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${getStatusBadgeClass(record.status)}`}
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
                        className="inline-flex h-8 items-center rounded-lg px-3 transition-all hover:bg-white/[0.07]"
                        style={slicerStyle}
                      >
                        <span className="font-mono text-[10px] tracking-[0.14em] uppercase font-semibold text-white/78">
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
