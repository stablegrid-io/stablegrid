import { ChevronLeft, ChevronRight } from 'lucide-react';

const ACCENT = '153,247,255';
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

const navButtonStyle: React.CSSProperties = {
  borderRadius: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.78)',
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
    <div className="flex flex-col gap-3 border-t border-white/[0.06] px-4 py-3 md:flex-row md:items-center md:justify-between">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-white/55">
        Showing {start}–{end} of {totalCount} results
      </p>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <label className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] uppercase text-white/55 font-semibold">
          Rows
          <select
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            className="h-9 px-2.5 text-[12px] font-mono text-white outline-none transition-all focus:ring-2 focus:ring-[rgba(153,247,255,0.35)]"
            style={{
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {ROWS_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-[#181c20]">
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex h-9 items-center gap-1 px-2.5 transition-all hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          style={navButtonStyle}
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase font-semibold">
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
              className="inline-flex h-9 min-w-9 items-center justify-center px-2 transition-all"
              style={{
                borderRadius: 10,
                background: isCurrent
                  ? `rgba(${ACCENT},0.14)`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${
                  isCurrent ? `rgba(${ACCENT},0.4)` : 'rgba(255,255,255,0.1)'
                }`,
                color: isCurrent ? `rgb(${ACCENT})` : 'rgba(255,255,255,0.78)',
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              <span className="font-mono text-[12px] font-semibold tabular-nums">
                {value}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="inline-flex h-9 items-center gap-1 px-2.5 transition-all hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          style={navButtonStyle}
        >
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase font-semibold">
            Next
          </span>
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
