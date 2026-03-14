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

const Surface = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-[24px] border border-white/10 bg-[#060b0a] shadow-[0_24px_45px_-35px_rgba(0,0,0,0.9)]">
    {children}
  </section>
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
    <main className="min-h-screen bg-[#050908] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1460px] lg:mx-0 lg:grid lg:grid-cols-[13.25rem_minmax(0,1fr)] lg:gap-3 xl:grid-cols-[13.75rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <AdminLeftRail activeSection="customers" />
        </aside>

        <div className="space-y-5">
          <CustomersPageHeader />

          {error ? (
            <section className="rounded-[18px] border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </section>
          ) : null}

          <Surface>
            <div className="space-y-4 border-b border-white/8 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CustomersStatusTabs
                  value={statusFilter}
                  onChange={(next) => {
                    setStatusFilter(next);
                    setPage(1);
                  }}
                />
                <div className="flex items-center gap-2">
                  <CustomersColumnsDropdown
                    visibleColumns={visibleColumns}
                    onToggle={handleToggleColumn}
                    onReset={() => setVisibleColumns(new Set(DEFAULT_VISIBLE_COLUMNS))}
                  />
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-white/12 bg-white/[0.04] px-3.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/35"
                  >
                    <Download className="h-4 w-4 text-[#9cb0a7]" />
                    Export
                  </button>
                </div>
              </div>

              <CustomersSearchInput
                value={query}
                onChange={(next) => {
                  setQuery(next);
                  setPage(1);
                }}
              />
            </div>

            <CustomersTable
              rows={pagedCustomers}
              loading={isTableLoading}
              visibleColumns={visibleColumns}
              sort={sort}
              onSort={handleSort}
              onRowClick={setSelectedCustomer}
            />

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
          </Surface>
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
