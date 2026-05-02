'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { AdminLeftRail } from '@/components/admin/AdminLeftRail';
import { OrdersFiltersBar } from '@/components/admin/orders/OrdersFiltersBar';
import { OrdersPageHeader } from '@/components/admin/orders/OrdersPageHeader';
import { OrdersPagination } from '@/components/admin/orders/OrdersPagination';
import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import {
  ADMIN_DRAWER_SURFACE_CLASS,
  ADMIN_ENTRY_ANIM_STYLE,
  ADMIN_LAYOUT_CLASS,
  ADMIN_PAGE_SHELL_CLASS,
  ADMIN_TOOLBAR_CLASS,
  AdminInlineMessage,
} from '@/components/admin/theme';
import type {
  OrderOptionalColumnId,
  OrderRecord,
  OrderSortState,
  OrderStatusFilter
} from '@/components/admin/orders/types';
import {
  buildOrdersCsv,
  createExportFileName,
  formatOrderAmount,
  formatOrderDate,
  getNextSortDirection,
  paginate,
  sortOrders
} from '@/components/admin/orders/utils';

const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_SORT: OrderSortState = {
  key: 'date',
  direction: 'desc'
};

const DEFAULT_VISIBLE_OPTIONAL_COLUMNS = new Set<OrderOptionalColumnId>();

const getOrderedVisibleOptionalColumns = (
  visibleColumns: Set<OrderOptionalColumnId>
): OrderOptionalColumnId[] => {
  const order: OrderOptionalColumnId[] = [
    'paymentMethod',
    'country',
    'planType',
    'renewalDate',
    'salesChannel'
  ];

  return order.filter((column) => visibleColumns.has(column));
};

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<OrderSortState>(DEFAULT_SORT);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableBusy, setTableBusy] = useState(false);
  const [visibleOptionalColumns, setVisibleOptionalColumns] = useState<Set<OrderOptionalColumnId>>(
    DEFAULT_VISIBLE_OPTIONAL_COLUMNS
  );
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const timer = window.setTimeout(() => {
      setOrders([]);
      setLoading(false);
    }, 240);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    setTableBusy(true);
    const timer = window.setTimeout(() => setTableBusy(false), 120);
    return () => window.clearTimeout(timer);
  }, [loading, page, query, rowsPerPage, sort, statusFilter, visibleOptionalColumns]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== 'All' && order.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        order.orderNumber.toLowerCase().includes(normalizedQuery) ||
        order.customerName.toLowerCase().includes(normalizedQuery) ||
        order.customerEmail.toLowerCase().includes(normalizedQuery) ||
        order.product.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [orders, query, statusFilter]);

  const sortedOrders = useMemo(() => sortOrders(filteredOrders, sort), [filteredOrders, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedOrders.length / rowsPerPage));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const pagedOrders = useMemo(
    () => paginate(sortedOrders, page, rowsPerPage),
    [page, rowsPerPage, sortedOrders]
  );

  const orderedVisibleOptionalColumns = useMemo(
    () => getOrderedVisibleOptionalColumns(visibleOptionalColumns),
    [visibleOptionalColumns]
  );

  const isTableLoading = loading || tableBusy;

  const handleExport = useCallback(() => {
    if (sortedOrders.length === 0) {
      return;
    }

    const csv = buildOrdersCsv(sortedOrders, orderedVisibleOptionalColumns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = createExportFileName();
    anchor.click();
    URL.revokeObjectURL(url);

    setNotice('Exported current filtered orders.');
  }, [orderedVisibleOptionalColumns, sortedOrders]);

  const handleToggleOptionalColumn = useCallback((columnId: OrderOptionalColumnId) => {
    setVisibleOptionalColumns((current) => {
      const next = new Set(current);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }, []);

  const handleToggleRowSelection = useCallback((orderId: string) => {
    setSelectedOrderIds((current) => {
      const next = new Set(current);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const handleToggleAllSelection = useCallback(() => {
    if (pagedOrders.length === 0) {
      return;
    }

    const allIds = pagedOrders.map((order) => order.id);

    setSelectedOrderIds((current) => {
      const allSelected = allIds.every((id) => current.has(id));
      const next = new Set(current);

      if (allSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }

      return next;
    });
  }, [pagedOrders]);

  return (
    <>
      <main className={ADMIN_PAGE_SHELL_CLASS}>
        <div className={ADMIN_LAYOUT_CLASS}>
          <aside className="hidden lg:block">
            <AdminLeftRail activeSection="orders" />
          </aside>

          <div className="space-y-6">
            <OrdersPageHeader />

            {notice ? <AdminInlineMessage tone="success" message={notice} /> : null}

            <section
              aria-label="Filter orders"
              className={ADMIN_TOOLBAR_CLASS}
              style={{
                ...ADMIN_ENTRY_ANIM_STYLE,
                animation:
                  'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 80ms forwards',
              }}
            >
              <OrdersFiltersBar
                statusFilter={statusFilter}
                onStatusFilterChange={(next) => {
                  setStatusFilter(next);
                  setPage(1);
                }}
                query={query}
                onQueryChange={(next) => {
                  setQuery(next);
                  setPage(1);
                }}
                onNewOrder={() => setNotice('New order flow placeholder.')}
                onExport={handleExport}
                exportDisabled={sortedOrders.length === 0}
                visibleOptionalColumns={visibleOptionalColumns}
                onToggleOptionalColumn={handleToggleOptionalColumn}
                onResetOptionalColumns={() =>
                  setVisibleOptionalColumns(new Set<OrderOptionalColumnId>())
                }
                resultCount={sortedOrders.length}
              />
            </section>

            <div
              style={{
                ...ADMIN_ENTRY_ANIM_STYLE,
                animation:
                  'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 160ms forwards',
              }}
            >
              <OrdersTable
                rows={pagedOrders}
                loading={isTableLoading}
                sort={sort}
                visibleOptionalColumns={visibleOptionalColumns}
                selectedOrderIds={selectedOrderIds}
                onSort={(nextKey) => {
                  setSort((current) => ({
                    key: nextKey,
                    direction: getNextSortDirection(current, nextKey)
                  }));
                  setPage(1);
                }}
                onToggleRowSelection={handleToggleRowSelection}
                onToggleAllSelection={handleToggleAllSelection}
                onRowClick={setSelectedOrder}
                onRowAction={(order, action) => setNotice(`${action} · ${order.orderNumber}`)}
              />

              <div className="mt-3">
                <OrdersPagination
                  page={page}
                  pageCount={pageCount}
                  totalCount={sortedOrders.length}
                  rowsPerPage={rowsPerPage}
                  onPageChange={setPage}
                  onRowsPerPageChange={(next) => {
                    setRowsPerPage(next);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedOrder ? (
        <>
          <button
            type="button"
            aria-label="Close order detail"
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Order detail"
            className={`fixed right-0 top-0 z-50 h-full w-full max-w-md p-6 ${ADMIN_DRAWER_SURFACE_CLASS}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Order detail
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
                  {selectedOrder.orderNumber}
                </h2>
                <p className="mt-1.5 text-[14px] text-white/60">{selectedOrder.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="inline-flex h-9 w-9 items-center justify-center transition-all"
                style={{
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                  Status
                </p>
                <div className="mt-2">
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                  Product
                </p>
                <p className="mt-2 text-[14px] font-medium text-white">{selectedOrder.product}</p>
              </div>
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                  Date
                </p>
                <p className="mt-2 text-[14px] font-medium text-white font-mono tabular-nums">
                  {formatOrderDate(selectedOrder.date)}
                </p>
              </div>
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                  Amount
                </p>
                <p className="mt-2 text-[16px] font-semibold text-white font-mono tabular-nums">
                  {formatOrderAmount(selectedOrder.amount)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[14px] border border-dashed border-white/[0.1] bg-white/[0.02] p-4 text-[13px] text-white/55">
              Detail placeholder. Connect this drawer to the final order timeline,
              payment records, and fulfillment actions.
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
