import { ChevronLeft, ChevronRight } from 'lucide-react';

const rowsOptions = [10, 20, 50];

const buildPageNumbers = (page: number, pageCount: number) => {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  return Array.from(pages)
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((left, right) => left - right);
};

export function CustomersPagination({
  page,
  pageCount,
  totalCount,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange
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
    <div className="flex flex-col gap-3 border-t border-white/8 px-4 py-3 text-sm text-[#8da29a] md:flex-row md:items-center md:justify-between">
      <p>
        Showing {start}-{end} of {totalCount} results
      </p>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-[#7f948b]">
          Rows
          <select
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            className="h-8 rounded-[10px] border border-white/12 bg-white/[0.04] px-2 text-sm text-white outline-none transition focus:border-brand-400/35 focus:ring-2 focus:ring-brand-400/15"
          >
            {rowsOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-[10px] border border-white/12 bg-white/[0.04] px-2.5 text-[#d4e1db] transition hover:border-white/22 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {pageNumbers.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPageChange(value)}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-[10px] border px-2 text-sm font-medium transition ${
              value === page
                ? 'border-brand-400/35 bg-brand-500/14 text-[#d5f4ea]'
                : 'border-white/12 bg-white/[0.04] text-[#d4e1db] hover:border-white/22 hover:bg-white/[0.07]'
            }`}
            aria-current={value === page ? 'page' : undefined}
          >
            {value}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="inline-flex h-8 items-center gap-1 rounded-[10px] border border-white/12 bg-white/[0.04] px-2.5 text-[#d4e1db] transition hover:border-white/22 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
