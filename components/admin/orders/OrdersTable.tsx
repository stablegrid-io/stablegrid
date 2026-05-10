import { useEffect, useMemo, useRef } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { ORDER_COLUMNS } from '@/components/admin/orders/constants';
import { OrderRowActions } from '@/components/admin/orders/OrderRowActions';
import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge';
import { OrderTrendSparkline } from '@/components/admin/orders/OrderTrendSparkline';
import {
  ADMIN_TABLE_HEADER_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_SURFACE_CLASS,
} from '@/components/admin/theme';
import type {
  OrderOptionalColumnId,
  OrderRecord,
  OrderSortKey,
  OrderSortState
} from '@/components/admin/orders/types';
import {
  formatOrderAmount,
  formatOrderDate
} from '@/components/admin/orders/utils';

const alignClass = (align: 'left' | 'right' | undefined) =>
  align === 'right' ? 'text-right' : 'text-left';

const SortIcon = ({
  sort,
  sortKey
}: {
  sort: OrderSortState;
  sortKey: OrderSortKey;
}) => {
  if (sort.key !== sortKey) {
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
    <td className="px-3 py-4">
      <div className="h-4 w-4 animate-pulse bg-surface-container-low" />
    </td>
    <td className="px-5 py-4">
      <div className="h-4 w-24 animate-pulse bg-surface-container-low" />
    </td>
    <td className="px-5 py-4">
      <div className="h-4 w-44 animate-pulse bg-surface-container-low" />
      <div className="mt-2 h-3 w-56 animate-pulse bg-surface-container-low" />
    </td>
    {Array.from({ length: visibleColumnCount - 3 }).map((_, index) => (
      <td key={index} className="px-5 py-4">
        <div className="h-4 w-20 animate-pulse bg-surface-container-low" />
      </td>
    ))}
  </tr>
);

export function OrdersTable({
  rows,
  loading,
  sort,
  visibleOptionalColumns,
  selectedOrderIds,
  onSort,
  onToggleRowSelection,
  onToggleAllSelection,
  onRowClick,
  onRowAction
}: {
  rows: OrderRecord[];
  loading: boolean;
  sort: OrderSortState;
  visibleOptionalColumns: Set<OrderOptionalColumnId>;
  selectedOrderIds: Set<string>;
  onSort: (sortKey: OrderSortKey) => void;
  onToggleRowSelection: (orderId: string) => void;
  onToggleAllSelection: () => void;
  onRowClick: (order: OrderRecord) => void;
  onRowAction: (order: OrderRecord, action: string) => void;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);

  const renderedColumns = useMemo(
    () =>
      ORDER_COLUMNS.filter(
        (column) => column.toggleable === false || visibleOptionalColumns.has(column.id as OrderOptionalColumnId)
      ),
    [visibleOptionalColumns]
  );

  const selectedInPage = rows.filter((order) => selectedOrderIds.has(order.id)).length;
  const allSelected = rows.length > 0 && selectedInPage === rows.length;
  const someSelected = selectedInPage > 0 && selectedInPage < rows.length;

  useEffect(() => {
    if (!selectAllRef.current) {
      return;
    }

    selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  return (
    <div className={`overflow-hidden ${ADMIN_TABLE_SURFACE_CLASS}`}>
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
                  {column.id === 'selection' ? (
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={onToggleAllSelection}
                      disabled={rows.length === 0}
                      className="h-4 w-4 border-surface-dim bg-surface text-primary focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Select all visible orders"
                    />
                  ) : null}

                  {column.sortable && column.sortKey ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sortKey!)}
                      className={`inline-flex items-center gap-1.5 font-data-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-on-surface-variant transition-colors hover:text-on-surface ${
                        column.align === 'right' ? 'ml-auto' : ''
                      }`}
                    >
                      {column.label}
                      <SortIcon sort={sort} sortKey={column.sortKey} />
                    </button>
                  ) : null}

                  {!column.sortable && column.id !== 'selection' ? column.label : null}
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
              <tr className="border-t border-surface-dim">
                <td colSpan={renderedColumns.length} className="px-6 py-16 text-center">
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
              ? rows.map((order) => (
                  <tr
                    key={order.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => onRowClick(order)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(order);
                      }
                    }}
                    className={`group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus:ring-primary/30 ${ADMIN_TABLE_ROW_CLASS}`}
                  >
                    {renderedColumns.map((column) => {
                      if (column.id === 'selection') {
                        return (
                          <td key={column.id} className="px-3 py-3.5">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.has(order.id)}
                              onChange={() => onToggleRowSelection(order.id)}
                              onClick={(event) => event.stopPropagation()}
                              className="h-4 w-4 border-surface-dim bg-surface text-primary focus:ring-primary/30"
                              aria-label={`Select order ${order.orderNumber}`}
                            />
                          </td>
                        );
                      }

                      if (column.id === 'orderNumber') {
                        return (
                          <td key={column.id} className="px-5 py-4 font-data-mono text-[14px] font-semibold tabular-nums text-on-surface">
                            {order.orderNumber}
                          </td>
                        );
                      }

                      if (column.id === 'customer') {
                        return (
                          <td key={column.id} className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-surface-dim bg-surface-container-low font-data-mono text-xs font-semibold text-on-surface">
                                {order.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-body text-[14px] font-semibold text-on-surface">
                                  {order.customerName}
                                </p>
                                <p className="truncate font-body text-[12px] text-on-surface-variant">
                                  {order.customerEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      if (column.id === 'product') {
                        return (
                          <td key={column.id} className="px-5 py-4 font-body text-[13px] text-on-surface">
                            {order.product}
                          </td>
                        );
                      }

                      if (column.id === 'status') {
                        return (
                          <td key={column.id} className="px-5 py-4">
                            <OrderStatusBadge status={order.status} />
                          </td>
                        );
                      }

                      if (column.id === 'date') {
                        return (
                          <td
                            key={column.id}
                            className="px-5 py-4 font-data-mono text-[13px] tabular-nums text-on-surface"
                          >
                            {formatOrderDate(order.date)}
                          </td>
                        );
                      }

                      if (column.id === 'trend') {
                        return (
                          <td key={column.id} className="px-5 py-4">
                            <OrderTrendSparkline trend={order.trend} status={order.status} />
                          </td>
                        );
                      }

                      if (
                        column.id === 'paymentMethod' ||
                        column.id === 'country' ||
                        column.id === 'planType' ||
                        column.id === 'salesChannel'
                      ) {
                        const value =
                          column.id === 'paymentMethod'
                            ? order.paymentMethod
                            : column.id === 'country'
                              ? order.country
                              : column.id === 'planType'
                                ? order.planType
                                : order.salesChannel;
                        return (
                          <td key={column.id} className="px-5 py-4 font-body text-[13px] text-on-surface">
                            {value}
                          </td>
                        );
                      }

                      if (column.id === 'renewalDate') {
                        return (
                          <td
                            key={column.id}
                            className="px-5 py-4 font-data-mono text-[13px] tabular-nums text-on-surface"
                          >
                            {formatOrderDate(order.renewalDate)}
                          </td>
                        );
                      }

                      if (column.id === 'amount') {
                        return (
                          <td
                            key={column.id}
                            className="px-5 py-4 text-right font-data-mono text-[14px] font-semibold tabular-nums text-on-surface"
                          >
                            {formatOrderAmount(order.amount)}
                          </td>
                        );
                      }

                      return (
                        <td key={column.id} className="px-5 py-4 text-right">
                          <OrderRowActions
                            orderNumber={order.orderNumber}
                            onAction={(action) => onRowAction(order, action)}
                          />
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
