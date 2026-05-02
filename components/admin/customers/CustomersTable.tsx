import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { CUSTOMER_COLUMNS } from '@/components/admin/customers/constants';
import { CustomersStatusBadge } from '@/components/admin/customers/CustomersStatusBadge';
import { ADMIN_TABLE_SURFACE_CLASS } from '@/components/admin/theme';
import type { Customer, CustomerColumnId, SortState } from '@/components/admin/customers/types';
import { formatCurrency, formatJoinedDate } from '@/components/admin/customers/utils';

const ACCENT = '153,247,255';

const alignClass = (align: 'left' | 'right' | undefined) =>
  align === 'right' ? 'text-right' : 'text-left';

const SortIcon = ({
  columnId,
  sort,
}: {
  columnId: CustomerColumnId;
  sort: SortState;
}) => {
  if (sort.key !== columnId) {
    return <ArrowUpDown className="h-3 w-3 text-white/30" strokeWidth={2} />;
  }
  return sort.direction === 'asc' ? (
    <ArrowUp className="h-3 w-3" style={{ color: `rgb(${ACCENT})` }} strokeWidth={2.5} />
  ) : (
    <ArrowDown className="h-3 w-3" style={{ color: `rgb(${ACCENT})` }} strokeWidth={2.5} />
  );
};

const SkeletonRow = ({ visibleColumnCount }: { visibleColumnCount: number }) => (
  <tr className="border-t border-white/[0.04]">
    <td className="px-5 py-4">
      <div className="h-4 w-44 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-2 h-3 w-56 animate-pulse rounded bg-white/[0.04]" />
    </td>
    {Array.from({ length: visibleColumnCount - 1 }).map((_, index) => (
      <td key={index} className="px-5 py-4">
        <div className="h-4 w-20 animate-pulse rounded bg-white/[0.06]" />
      </td>
    ))}
  </tr>
);

export function CustomersTable({
  rows,
  loading,
  visibleColumns,
  sort,
  onSort,
  onRowClick,
}: {
  rows: Customer[];
  loading: boolean;
  visibleColumns: Set<CustomerColumnId>;
  sort: SortState;
  onSort: (columnId: CustomerColumnId) => void;
  onRowClick: (customer: Customer) => void;
}) {
  const renderedColumns = CUSTOMER_COLUMNS.filter(
    (column) => column.toggleable === false || visibleColumns.has(column.id),
  );

  return (
    <div className={ADMIN_TABLE_SURFACE_CLASS}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {renderedColumns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`px-5 py-3.5 ${alignClass(column.align)}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.id)}
                      className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-white/55 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)] ${
                        column.align === 'right' ? 'ml-auto' : ''
                      }`}
                    >
                      {column.label}
                      <SortIcon columnId={column.id} sort={sort} />
                    </button>
                  ) : (
                    <span className="font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-white/55">
                      {column.label}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonRow
                    key={`skeleton-${index}`}
                    visibleColumnCount={renderedColumns.length}
                  />
                ))
              : null}

            {!loading && rows.length === 0 ? (
              <tr className="border-t border-white/[0.04]">
                <td
                  colSpan={renderedColumns.length}
                  className="px-6 py-16 text-center"
                >
                  <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-white/40 mb-1">
                    No matches
                  </p>
                  <p className="text-[13px] text-white/55">
                    Try clearing the search or relaxing the filters.
                  </p>
                </td>
              </tr>
            ) : null}

            {!loading
              ? rows.map((customer) => (
                  <tr
                    key={customer.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => onRowClick(customer)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(customer);
                      }
                    }}
                    className="group border-t border-white/[0.04] transition-colors cursor-pointer hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(153,247,255,0.3)]"
                  >
                    {renderedColumns.map((column) => {
                      if (column.id === 'customer') {
                        return (
                          <td key={column.id} className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] font-mono text-xs font-semibold transition-colors"
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  color: 'rgba(255,255,255,0.78)',
                                }}
                              >
                                {customer.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-[14px] font-semibold text-white">
                                  {customer.fullName}
                                </p>
                                <p className="truncate text-[12px] text-white/50">
                                  {customer.email}
                                </p>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      if (column.id === 'status') {
                        return (
                          <td key={column.id} className="px-5 py-4">
                            <CustomersStatusBadge status={customer.status} />
                          </td>
                        );
                      }

                      if (column.id === 'joinedAt') {
                        return (
                          <td
                            key={column.id}
                            className="px-5 py-4 text-[13px] text-white/70 font-mono tabular-nums"
                          >
                            {formatJoinedDate(customer.joinedAt)}
                          </td>
                        );
                      }

                      if (column.id === 'orders') {
                        return (
                          <td
                            key={column.id}
                            className="px-5 py-4 text-right text-[13px] text-white/70 font-mono tabular-nums"
                          >
                            {customer.orders}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={column.id}
                          className="px-5 py-4 text-right text-[14px] font-semibold text-white font-mono tabular-nums"
                        >
                          {formatCurrency(customer.totalSpent)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
