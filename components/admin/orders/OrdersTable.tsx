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
    return <ArrowUpDown className="h-3 w-3 text-white/30" strokeWidth={2} />;
  }
  return sort.direction === 'asc' ? (
    <ArrowUp className="h-3 w-3" style={{ color: 'rgb(153,247,255)' }} strokeWidth={2.5} />
  ) : (
    <ArrowDown className="h-3 w-3" style={{ color: 'rgb(153,247,255)' }} strokeWidth={2.5} />
  );
};

const SkeletonRow = ({ visibleColumnCount }: { visibleColumnCount: number }) => (
  <tr className="border-t border-white/[0.04]">
    <td className="px-3 py-4">
      <div className="h-4 w-4 animate-pulse rounded bg-white/[0.06]" />
    </td>
    <td className="px-5 py-4">
      <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
    </td>
    <td className="px-5 py-4">
      <div className="h-4 w-44 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-2 h-3 w-56 animate-pulse rounded bg-white/[0.04]" />
    </td>
    {Array.from({ length: visibleColumnCount - 3 }).map((_, index) => (
      <td key={index} className="px-5 py-4">
        <div className="h-4 w-20 animate-pulse rounded bg-white/[0.06]" />
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
    <div className="overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#181c20]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {renderedColumns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`px-5 py-3.5 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-white/55 ${alignClass(column.align)}`}
                >
                  {column.id === 'selection' ? (
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={onToggleAllSelection}
                      disabled={rows.length === 0}
                      className="h-4 w-4 rounded border-white/20 bg-white/[0.04] text-[rgb(153,247,255)] focus:ring-[rgba(153,247,255,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Select all visible orders"
                    />
                  ) : null}

                  {column.sortable && column.sortKey ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sortKey!)}
                      className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-white/55 transition hover:text-white ${
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
              <tr className="border-t border-white/[0.04]">
                <td colSpan={renderedColumns.length} className="px-6 py-16 text-center">
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
                    className="group border-t border-white/[0.04] cursor-pointer transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(153,247,255,0.3)]"
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
                              className="h-4 w-4 rounded border-white/20 bg-white/[0.04] text-[rgb(153,247,255)] focus:ring-[rgba(153,247,255,0.35)]"
                              aria-label={`Select order ${order.orderNumber}`}
                            />
                          </td>
                        );
                      }

                      if (column.id === 'orderNumber') {
                        return (
                          <td key={column.id} className="px-5 py-4 text-[14px] font-semibold text-white font-mono tabular-nums">
                            {order.orderNumber}
                          </td>
                        );
                      }

                      if (column.id === 'customer') {
                        return (
                          <td key={column.id} className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] font-mono text-xs font-semibold"
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  color: 'rgba(255,255,255,0.78)',
                                }}
                              >
                                {order.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-[14px] font-semibold text-white">
                                  {order.customerName}
                                </p>
                                <p className="truncate text-[12px] text-white/50">
                                  {order.customerEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      if (column.id === 'product') {
                        return (
                          <td key={column.id} className="px-5 py-4 text-[13px] text-white/70">
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
                            className="px-5 py-4 text-[13px] text-white/70 font-mono tabular-nums"
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
                          <td key={column.id} className="px-5 py-4 text-[13px] text-white/70">
                            {value}
                          </td>
                        );
                      }

                      if (column.id === 'renewalDate') {
                        return (
                          <td
                            key={column.id}
                            className="px-5 py-4 text-[13px] text-white/70 font-mono tabular-nums"
                          >
                            {formatOrderDate(order.renewalDate)}
                          </td>
                        );
                      }

                      if (column.id === 'amount') {
                        return (
                          <td
                            key={column.id}
                            className="px-5 py-4 text-right text-[14px] font-semibold text-white font-mono tabular-nums"
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
