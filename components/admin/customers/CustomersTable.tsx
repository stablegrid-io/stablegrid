import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { CUSTOMER_COLUMNS } from '@/components/admin/customers/constants';
import { CustomersStatusBadge } from '@/components/admin/customers/CustomersStatusBadge';
import type { Customer, CustomerColumnId, SortState } from '@/components/admin/customers/types';
import { formatCurrency, formatJoinedDate } from '@/components/admin/customers/utils';

const alignClass = (align: 'left' | 'right' | undefined) =>
  align === 'right' ? 'text-right' : 'text-left';

const SortIcon = ({
  columnId,
  sort
}: {
  columnId: CustomerColumnId;
  sort: SortState;
}) => {
  if (sort.key !== columnId) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-[#5f7269]" />;
  }

  return sort.direction === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-[#d6e4de]" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-[#d6e4de]" />
  );
};

const SkeletonRow = ({ visibleColumnCount }: { visibleColumnCount: number }) => (
  <tr className="border-t border-outline-variant/20">
    <td className="px-4 py-4">
      <div className="h-4 w-44 animate-pulse rounded bg-surface-container-high" />
      <div className="mt-2 h-3 w-56 animate-pulse rounded bg-surface-container" />
    </td>
    {Array.from({ length: visibleColumnCount - 1 }).map((_, index) => (
      <td key={index} className="px-4 py-4">
        <div className="h-4 w-20 animate-pulse rounded bg-surface-container-high" />
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
  onRowClick
}: {
  rows: Customer[];
  loading: boolean;
  visibleColumns: Set<CustomerColumnId>;
  sort: SortState;
  onSort: (columnId: CustomerColumnId) => void;
  onRowClick: (customer: Customer) => void;
}) {
  const renderedColumns = CUSTOMER_COLUMNS.filter(
    (column) => column.toggleable === false || visibleColumns.has(column.id)
  );

  return (
    <div className="overflow-hidden  border border-outline-variant/20 bg-surface-container-low/65">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-white/[0.02]">
            <tr>
              {renderedColumns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#8ca098] ${alignClass(column.align)}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.id)}
                      className={`inline-flex items-center gap-1.5 transition hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35 ${column.align === 'right' ? 'ml-auto' : ''}`}
                    >
                      {column.label}
                      <SortIcon columnId={column.id} sort={sort} />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonRow key={`skeleton-${index}`} visibleColumnCount={renderedColumns.length} />
                ))
              : null}

            {!loading && rows.length === 0 ? (
              <tr className="border-t border-outline-variant/20">
                <td
                  colSpan={renderedColumns.length}
                  className="px-6 py-14 text-center text-sm text-[#8ea39a]"
                >
                  No customers found for the current search and filters.
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
                    className="group border-t border-outline-variant/20 transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/30"
                  >
                    {renderedColumns.map((column) => {
                      if (column.id === 'customer') {
                        return (
                          <td key={column.id} className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center  border border-outline-variant/20 bg-[#111a18] text-xs font-semibold text-[#b6c9c1]">
                                {customer.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-on-surface">
                                  {customer.fullName}
                                </p>
                                <p className="truncate text-xs text-[#7f948b]">{customer.email}</p>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      if (column.id === 'status') {
                        return (
                          <td key={column.id} className="px-4 py-3.5">
                            <CustomersStatusBadge status={customer.status} />
                          </td>
                        );
                      }

                      if (column.id === 'joinedAt') {
                        return (
                          <td key={column.id} className="px-4 py-3.5 text-sm text-[#d3e0da]">
                            {formatJoinedDate(customer.joinedAt)}
                          </td>
                        );
                      }

                      if (column.id === 'orders') {
                        return (
                          <td key={column.id} className="px-4 py-3.5 text-right text-sm text-[#d3e0da]">
                            {customer.orders}
                          </td>
                        );
                      }

                      return (
                        <td key={column.id} className="px-4 py-3.5 text-right text-sm font-semibold text-[#edf4f0]">
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
