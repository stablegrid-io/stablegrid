import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { CUSTOMER_COLUMNS } from '@/components/admin/customers/constants';
import { CustomersStatusBadge } from '@/components/admin/customers/CustomersStatusBadge';
import {
  ADMIN_TABLE_HEADER_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_SURFACE_CLASS,
} from '@/components/admin/theme';
import type { Customer, CustomerColumnId, SortState } from '@/components/admin/customers/types';
import {
  formatCurrency,
  formatJoinedDate,
  formatKwh,
  formatProgressFraction,
  formatRelativeTime,
  isCustomerOnline,
  progressPercentValue
} from '@/components/admin/customers/utils';

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
    return <ArrowUpDown className="h-3 w-3 text-on-surface-variant" strokeWidth={2} />;
  }
  return sort.direction === 'asc' ? (
    <ArrowUp className="h-3 w-3 text-primary" strokeWidth={2.5} />
  ) : (
    <ArrowDown className="h-3 w-3 text-primary" strokeWidth={2.5} />
  );
};

const SkeletonRow = ({ visibleColumnCount }: { visibleColumnCount: number }) => (
  <tr className="border-t border-surface-dim">
    <td className="px-5 py-4">
      <div className="h-4 w-44 animate-pulse bg-surface-container-low" />
      <div className="mt-2 h-3 w-56 animate-pulse bg-surface-container-low" />
    </td>
    {Array.from({ length: visibleColumnCount - 1 }).map((_, index) => (
      <td key={index} className="px-5 py-4">
        <div className="h-4 w-20 animate-pulse bg-surface-container-low" />
      </td>
    ))}
  </tr>
);

const ProgressCell = ({
  current,
  total
}: {
  current: number;
  total: number;
}) => {
  const pct = progressPercentValue(current, total);
  return (
    <div className="flex min-w-[120px] flex-col gap-1.5">
      <span className="font-data-mono text-[12px] tabular-nums text-on-surface">
        {formatProgressFraction(current, total)}
      </span>
      <div
        className="h-1 w-full bg-surface-container-low"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

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
            <tr className="border-b border-surface-dim">
              {renderedColumns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`${ADMIN_TABLE_HEADER_CLASS} ${alignClass(column.align)}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.id)}
                      className={`inline-flex items-center gap-1.5 font-data-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                        column.align === 'right' ? 'ml-auto' : ''
                      }`}
                    >
                      {column.label}
                      <SortIcon columnId={column.id} sort={sort} />
                    </button>
                  ) : (
                    <span className="font-data-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-on-surface-variant">
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
              <tr className="border-t border-surface-dim">
                <td
                  colSpan={renderedColumns.length}
                  className="px-6 py-16 text-center"
                >
                  <p className="font-data-mono text-[11px] tracking-[0.18em] uppercase text-on-surface-variant mb-1">
                    No matches
                  </p>
                  <p className="font-body text-[13px] text-on-surface-variant">
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
                    className={`group ${ADMIN_TABLE_ROW_CLASS} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30`}
                  >
                    {renderedColumns.map((column) => {
                      if (column.id === 'customer') {
                        const online = isCustomerOnline(customer.lastActiveAt);
                        return (
                          <td key={column.id} className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center border border-surface-dim bg-surface-container-low font-data-mono text-xs font-semibold text-on-surface">
                                {customer.initials}
                                {online ? (
                                  <span
                                    className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#4ade80] ring-2 ring-surface"
                                    role="img"
                                    aria-label="Online — active within the last 5 minutes"
                                    title="Online — active within the last 5 minutes"
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-body text-[14px] font-semibold text-on-surface">
                                  {customer.fullName}
                                </p>
                                <p className="truncate font-body text-[12px] text-on-surface-variant">
                                  {customer.email}
                                </p>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      if (column.id === 'lessons') {
                        return (
                          <td key={column.id} className="px-5 py-4">
                            <ProgressCell
                              current={customer.lessonsCompleted}
                              total={customer.lessonsTotal}
                            />
                          </td>
                        );
                      }

                      if (column.id === 'theoryProgress') {
                        return (
                          <td key={column.id} className="px-5 py-4">
                            <ProgressCell
                              current={customer.theoryModulesCompleted}
                              total={customer.theoryModulesTotal}
                            />
                          </td>
                        );
                      }

                      if (column.id === 'practiceProgress') {
                        return (
                          <td key={column.id} className="px-5 py-4">
                            <ProgressCell
                              current={customer.practiceTasksSolved}
                              total={customer.practiceTasksTotal}
                            />
                          </td>
                        );
                      }

                      if (column.id === 'kwh') {
                        return (
                          <td
                            key={column.id}
                            className="px-5 py-4 text-right text-[13px] text-on-surface font-data-mono tabular-nums"
                          >
                            {formatKwh(customer.kwhTotal)}
                          </td>
                        );
                      }

                      if (column.id === 'lastActive') {
                        const muted = !customer.lastActiveAt;
                        return (
                          <td
                            key={column.id}
                            className={`px-5 py-4 text-[13px] font-data-mono tabular-nums ${
                              muted ? 'text-on-surface-variant' : 'text-on-surface'
                            }`}
                          >
                            {formatRelativeTime(customer.lastActiveAt)}
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
                            className="px-5 py-4 text-[13px] text-on-surface font-data-mono tabular-nums"
                          >
                            {formatJoinedDate(customer.joinedAt)}
                          </td>
                        );
                      }

                      if (column.id === 'orders') {
                        return (
                          <td
                            key={column.id}
                            className="px-5 py-4 text-right text-[13px] text-on-surface font-data-mono tabular-nums"
                          >
                            {customer.orders}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={column.id}
                          className="px-5 py-4 text-right text-[14px] font-semibold text-on-surface font-data-mono tabular-nums"
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
