import { useEffect, useMemo, useRef } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { ORDER_COLUMNS } from '@/components/admin/orders/constants';
import { OrderRowActions } from '@/components/admin/orders/OrderRowActions';
import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge';
import { OrderTrendSparkline } from '@/components/admin/orders/OrderTrendSparkline';
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
    <td className="px-3 py-4">
      <div className="h-4 w-4 animate-pulse rounded bg-surface-container-high" />
    </td>
    <td className="px-4 py-4">
      <div className="h-4 w-24 animate-pulse rounded bg-surface-container-high" />
    </td>
    <td className="px-4 py-4">
      <div className="h-4 w-44 animate-pulse rounded bg-surface-container-high" />
      <div className="mt-2 h-3 w-56 animate-pulse rounded bg-surface-container" />
    </td>
    {Array.from({ length: visibleColumnCount - 3 }).map((_, index) => (
      <td key={index} className="px-4 py-4">
        <div className="h-4 w-20 animate-pulse rounded bg-surface-container-high" />
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
                  {column.id === 'selection' ? (
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={onToggleAllSelection}
                      disabled={rows.length === 0}
                      className="h-4 w-4 rounded border-white/20 bg-surface-container-low text-primary focus:ring-brand-400/35 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Select all visible orders"
                    />
                  ) : null}

                  {column.sortable && column.sortKey ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sortKey!)}
                      className={`inline-flex items-center gap-1.5 transition hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35 ${
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
              <tr className="border-t border-outline-variant/20">
                <td
                  colSpan={renderedColumns.length}
                  className="px-6 py-14 text-center text-sm text-[#8ea39a]"
                >
                  No orders match the current filters.
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
                    className="group border-t border-outline-variant/20 transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/30"
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
                              className="h-4 w-4 rounded border-white/20 bg-surface-container-low text-primary focus:ring-brand-400/35"
                              aria-label={`Select order ${order.orderNumber}`}
                            />
                          </td>
                        );
                      }

                      if (column.id === 'orderNumber') {
                        return (
                          <td key={column.id} className="px-4 py-3.5 text-sm font-semibold text-on-surface">
                            {order.orderNumber}
                          </td>
                        );
                      }

                      if (column.id === 'customer') {
                        return (
                          <td key={column.id} className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center  border border-outline-variant/20 bg-[#111a18] text-xs font-semibold text-[#b6c9c1]">
                                {order.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-on-surface">
                                  {order.customerName}
                                </p>
                                <p className="truncate text-xs text-[#7f948b]">{order.customerEmail}</p>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      if (column.id === 'product') {
                        return (
                          <td key={column.id} className="px-4 py-3.5 text-sm text-[#d3e0da]">
                            {order.product}
                          </td>
                        );
                      }

                      if (column.id === 'status') {
                        return (
                          <td key={column.id} className="px-4 py-3.5">
                            <OrderStatusBadge status={order.status} />
                          </td>
                        );
                      }

                      if (column.id === 'date') {
                        return (
                          <td key={column.id} className="px-4 py-3.5 text-sm text-[#d3e0da]">
                            {formatOrderDate(order.date)}
                          </td>
                        );
                      }

                      if (column.id === 'trend') {
                        return (
                          <td key={column.id} className="px-4 py-3.5">
                            <OrderTrendSparkline trend={order.trend} status={order.status} />
                          </td>
                        );
                      }

                      if (column.id === 'paymentMethod') {
                        return (
                          <td key={column.id} className="px-4 py-3.5 text-sm text-[#d3e0da]">
                            {order.paymentMethod}
                          </td>
                        );
                      }

                      if (column.id === 'country') {
                        return (
                          <td key={column.id} className="px-4 py-3.5 text-sm text-[#d3e0da]">
                            {order.country}
                          </td>
                        );
                      }

                      if (column.id === 'planType') {
                        return (
                          <td key={column.id} className="px-4 py-3.5 text-sm text-[#d3e0da]">
                            {order.planType}
                          </td>
                        );
                      }

                      if (column.id === 'renewalDate') {
                        return (
                          <td key={column.id} className="px-4 py-3.5 text-sm text-[#d3e0da]">
                            {formatOrderDate(order.renewalDate)}
                          </td>
                        );
                      }

                      if (column.id === 'salesChannel') {
                        return (
                          <td key={column.id} className="px-4 py-3.5 text-sm text-[#d3e0da]">
                            {order.salesChannel}
                          </td>
                        );
                      }

                      if (column.id === 'amount') {
                        return (
                          <td key={column.id} className="px-4 py-3.5 text-right text-sm font-semibold text-[#edf4f0]">
                            {formatOrderAmount(order.amount)}
                          </td>
                        );
                      }

                      return (
                        <td key={column.id} className="px-4 py-3.5 text-right">
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
