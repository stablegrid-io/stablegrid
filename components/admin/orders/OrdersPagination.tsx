import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ADMIN_GHOST_BUTTON_CLASS } from '@/components/admin/theme';

const ROWS_OPTIONS = [10, 20, 50];

const buildPageNumbers = (page: number, pageCount: number) => {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  return Array.from(pages)
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((left, right) => left - right);
};

export function OrdersPagination({
  page,
  pageCount,
  totalCount,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  rowsPerPage: number;
  onPageChange: (nextPage: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}) {
  const start = totalCount === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end = totalCount === 0 ? 0 : Math.min(page * rowsPerPage, totalCount);
  const pageNumbers = buildPageNumbers(page, pageCount);

  return (
    <div className="flex flex-col gap-3 border-t border-surface-dim px-4 py-3 md:flex-row md:items-center md:justify-between">
      <p className="font-data-mono text-[11px] tracking-[0.14em] uppercase text-on-surface-variant">
        Showing {start}–{end} of {totalCount} results
      </p>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <label className="inline-flex items-center gap-2 font-data-mono text-[10px] tracking-[0.16em] uppercase text-on-surface-variant font-semibold">
          Rows
          <select
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            className="h-9 px-2.5 text-[12px] font-data-mono text-on-surface outline-none transition-colors border border-surface-dim bg-surface focus:border-primary focus:ring-2 focus:ring-primary/30"
          >
            {ROWS_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-surface">
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={`${ADMIN_GHOST_BUTTON_CLASS} h-9 gap-1 px-2.5 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="font-data-mono text-[10px] tracking-[0.14em] uppercase font-semibold">
            Previous
          </span>
        </button>

        {pageNumbers.map((value) => {
          const isCurrent = value === page;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onPageChange(value)}
              aria-current={isCurrent ? 'page' : undefined}
              className={`inline-flex h-9 min-w-9 items-center justify-center px-2 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus:ring-primary/30 ${
                isCurrent
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-surface-dim bg-surface text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="font-data-mono text-[12px] font-semibold tabular-nums">
                {value}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className={`${ADMIN_GHOST_BUTTON_CLASS} h-9 gap-1 px-2.5 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <span className="font-data-mono text-[10px] tracking-[0.14em] uppercase font-semibold">
            Next
          </span>
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
