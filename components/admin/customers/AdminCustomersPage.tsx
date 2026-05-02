'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { AdminLeftRail } from '@/components/admin/AdminLeftRail';
import { CUSTOMER_COLUMNS } from '@/components/admin/customers/constants';
import { CustomerDetailDrawer } from '@/components/admin/customers/CustomerDetailDrawer';
import { CustomersColumnsDropdown } from '@/components/admin/customers/CustomersColumnsDropdown';
import { CustomersPageHeader } from '@/components/admin/customers/CustomersPageHeader';
import { CustomersPagination } from '@/components/admin/customers/CustomersPagination';
import { CustomersSearchInput } from '@/components/admin/customers/CustomersSearchInput';
import { CustomersStatusTabs } from '@/components/admin/customers/CustomersStatusTabs';
import { CustomersTable } from '@/components/admin/customers/CustomersTable';
import {
  ADMIN_ENTRY_ANIM_STYLE,
  ADMIN_LAYOUT_CLASS,
  ADMIN_PAGE_SHELL_CLASS,
  ADMIN_TOOLBAR_CLASS,
  AdminInlineMessage,
} from '@/components/admin/theme';
import type { Customer, CustomerColumnId, SortState, StatusFilter } from '@/components/admin/customers/types';
import { buildCustomersCsv, getNextSortDirection, paginate, sortCustomers } from '@/components/admin/customers/utils';

const DEFAULT_SORT: SortState = {
  key: 'joinedAt',
  direction: 'desc'
};

const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_VISIBLE_COLUMNS = new Set<CustomerColumnId>(
  CUSTOMER_COLUMNS.filter((column) => column.toggleable !== false).map((column) => column.id)
);

const createExportFileName = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `customers-${year}-${month}-${day}.csv`;
};

interface ApiEnvelope<T> {
  data: T;
  error?: string;
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed.');
  }

  return payload.data;
}

export function AdminCustomersPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] =
    useState<Set<CustomerColumnId>>(DEFAULT_VISIBLE_COLUMNS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableBusy, setTableBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await requestJson<Customer[]>('/api/admin/customers');
      setCustomers(data);
    } catch (loadError) {
      setCustomers([]);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (loading) {
      return;
    }

    setTableBusy(true);
    const timer = window.setTimeout(() => setTableBusy(false), 120);
    return () => window.clearTimeout(timer);
  }, [loading, page, query, rowsPerPage, sort, statusFilter]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return customers.filter((customer) => {
      if (statusFilter !== 'All' && customer.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        customer.fullName.toLowerCase().includes(normalizedQuery) ||
        customer.email.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [customers, query, statusFilter]);

  const sortedCustomers = useMemo(
    () => sortCustomers(filteredCustomers, sort),
    [filteredCustomers, sort]
  );

  const pageCount = Math.max(1, Math.ceil(sortedCustomers.length / rowsPerPage));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const pagedCustomers = useMemo(
    () => paginate(sortedCustomers, page, rowsPerPage),
    [page, rowsPerPage, sortedCustomers]
  );

  const handleSort = useCallback((columnId: CustomerColumnId) => {
    setSort((current) => ({
      key: columnId,
      direction: getNextSortDirection(current, columnId)
    }));
    setPage(1);
  }, []);

  const handleToggleColumn = useCallback((columnId: CustomerColumnId) => {
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    const csv = buildCustomersCsv(sortedCustomers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = createExportFileName();
    anchor.click();
    URL.revokeObjectURL(url);
  }, [sortedCustomers]);

  const isTableLoading = loading || tableBusy;

  return (
    <main className={ADMIN_PAGE_SHELL_CLASS}>
      <div className={ADMIN_LAYOUT_CLASS}>
        <aside className="hidden lg:block">
          <AdminLeftRail activeSection="customers" />
        </aside>

        <div className="space-y-6">
          <CustomersPageHeader />

          {error ? <AdminInlineMessage tone="error" message={error} /> : null}

          {/* Unified frosted toolbar — search + tabs + count + columns + export */}
          <section
            aria-label="Filter customers"
            className={ADMIN_TOOLBAR_CLASS}
            style={{
              ...ADMIN_ENTRY_ANIM_STYLE,
              animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 80ms forwards',
            }}
          >
            <div className="flex flex-wrap items-center gap-2 px-2.5 py-2.5">
              <CustomersSearchInput
                value={query}
                onChange={(next) => {
                  setQuery(next);
                  setPage(1);
                }}
              />

              {/* Result count */}
              <div className="hidden sm:flex items-baseline gap-1 shrink-0 px-1">
                <span className="font-mono text-[15px] tabular-nums text-white/95 leading-none">
                  {sortedCustomers.length}
                </span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/55 font-semibold">
                  {sortedCustomers.length === 1 ? 'result' : 'results'}
                </span>
              </div>

              <CustomersStatusTabs
                value={statusFilter}
                onChange={(next) => {
                  setStatusFilter(next);
                  setPage(1);
                }}
              />

              <CustomersColumnsDropdown
                visibleColumns={visibleColumns}
                onToggle={handleToggleColumn}
                onReset={() => setVisibleColumns(new Set(DEFAULT_VISIBLE_COLUMNS))}
              />

              <button
                type="button"
                onClick={handleExport}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 px-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
                style={{
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                <Download className="h-3.5 w-3.5 text-white/55" strokeWidth={2} />
                <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold text-white/78">
                  Export
                </span>
              </button>
            </div>
          </section>

          <div
            style={{
              ...ADMIN_ENTRY_ANIM_STYLE,
              animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 160ms forwards',
            }}
          >
            <CustomersTable
              rows={pagedCustomers}
              loading={isTableLoading}
              visibleColumns={visibleColumns}
              sort={sort}
              onSort={handleSort}
              onRowClick={setSelectedCustomer}
            />

            <div className="mt-3">
              <CustomersPagination
                page={page}
                pageCount={pageCount}
                totalCount={sortedCustomers.length}
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

      <CustomerDetailDrawer
        customer={selectedCustomer}
        open={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
      />
    </main>
  );
}
