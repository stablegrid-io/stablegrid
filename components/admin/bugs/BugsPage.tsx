'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLeftRail } from '@/components/admin/AdminLeftRail';
import { BugDetailDrawer } from '@/components/admin/bugs/BugDetailDrawer';
import { BugFiltersBar } from '@/components/admin/bugs/BugFiltersBar';
import { BugsPageHeader } from '@/components/admin/bugs/BugsPageHeader';
import { BugReportsTable } from '@/components/admin/bugs/BugReportsTable';
import type { BugReport, BugSeverityFilter, BugSortState, BugStatus, BugStatusFilter } from '@/components/admin/bugs/types';
import { buildBugReportsCsv, getNextSortDirection, paginate, sortBugReports } from '@/components/admin/bugs/utils';
import { CustomersPagination } from '@/components/admin/customers/CustomersPagination';
import {
  ADMIN_LAYOUT_CLASS,
  ADMIN_PAGE_SHELL_CLASS,
  AdminInlineMessage,
  AdminSurface
} from '@/components/admin/theme';
import { createPayloadRequestKey } from '@/lib/api/requestKeys';

const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_SORT: BugSortState = {
  key: 'submittedAt',
  direction: 'desc'
};

const Surface = AdminSurface;

interface ApiEnvelope<T> {
  data: T;
  error?: string;
}

const createExportFileName = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `bug-reports-${year}-${month}-${day}.csv`;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed.');
  }

  return payload.data;
}

const statusToDbValue = (status: BugStatus) => {
  if (status === 'New') {
    return 'new';
  }
  if (status === 'In Review') {
    return 'triaged';
  }
  return 'resolved';
};

export function AdminBugsPage() {
  const [statusFilter, setStatusFilter] = useState<BugStatusFilter>('All');
  const [severityFilter, setSeverityFilter] = useState<BugSeverityFilter>('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<BugSortState>(DEFAULT_SORT);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableBusy, setTableBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await requestJson<BugReport[]>('/api/admin/bugs');
      setReports(data);
    } catch (loadError) {
      setReports([]);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load bug reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (loading) {
      return;
    }

    setTableBusy(true);
    const timer = window.setTimeout(() => setTableBusy(false), 120);
    return () => window.clearTimeout(timer);
  }, [loading, page, query, rowsPerPage, severityFilter, sort, statusFilter]);

  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reports.filter((report) => {
      if (statusFilter !== 'All' && report.status !== statusFilter) {
        return false;
      }

      if (severityFilter !== 'All' && report.severity !== severityFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        report.title.toLowerCase().includes(normalizedQuery) ||
        report.shortDescription.toLowerCase().includes(normalizedQuery) ||
        report.reporterName.toLowerCase().includes(normalizedQuery) ||
        report.reporterEmail.toLowerCase().includes(normalizedQuery) ||
        report.module.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, reports, severityFilter, statusFilter]);

  const sortedReports = useMemo(() => sortBugReports(filteredReports, sort), [filteredReports, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedReports.length / rowsPerPage));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const pagedReports = useMemo(
    () => paginate(sortedReports, page, rowsPerPage),
    [page, rowsPerPage, sortedReports]
  );

  const handleSort = useCallback((key: BugSortState['key']) => {
    setSort((current) => ({
      key,
      direction: getNextSortDirection(current, key)
    }));
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    if (sortedReports.length === 0) {
      return;
    }

    const csv = buildBugReportsCsv(sortedReports);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = createExportFileName();
    anchor.click();
    URL.revokeObjectURL(url);
  }, [sortedReports]);

  const handleSaveStatus = useCallback(
    async (nextStatus: BugStatus) => {
      if (!selectedReport) {
        return;
      }

      setStatusSaving(true);
      setError(null);

      try {
        const requestBody = {
          status: statusToDbValue(nextStatus)
        };
        const updated = await requestJson<BugReport>(`/api/admin/bugs/${selectedReport.id}`, {
          method: 'PATCH',
          headers: {
            'Idempotency-Key': createPayloadRequestKey('admin_bug_status_update', {
              reportId: selectedReport.id,
              ...requestBody
            })
          },
          body: JSON.stringify(requestBody)
        });

        setReports((current) =>
          current.map((report) => (report.id === updated.id ? updated : report))
        );
        setSelectedReport(updated);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to update bug status.');
      } finally {
        setStatusSaving(false);
      }
    },
    [selectedReport]
  );

  const isTableLoading = loading || tableBusy;

  return (
    <main className={ADMIN_PAGE_SHELL_CLASS}>
      <div className={ADMIN_LAYOUT_CLASS}>
        <aside className="hidden lg:block">
          <AdminLeftRail activeSection="bugs" />
        </aside>

        <div className="space-y-5">
          <BugsPageHeader />

          {error ? <AdminInlineMessage tone="error" message={error} /> : null}

          <Surface>
            <BugFiltersBar
              statusFilter={statusFilter}
              onStatusFilterChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              severityFilter={severityFilter}
              onSeverityFilterChange={(value) => {
                setSeverityFilter(value);
                setPage(1);
              }}
              query={query}
              onQueryChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              onExport={handleExport}
              exportDisabled={sortedReports.length === 0}
            />

            <BugReportsTable
              rows={pagedReports}
              loading={isTableLoading}
              sort={sort}
              onSort={handleSort}
              onRowClick={setSelectedReport}
            />

            <CustomersPagination
              page={page}
              pageCount={pageCount}
              totalCount={sortedReports.length}
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

      <BugDetailDrawer
        report={selectedReport}
        open={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        onSaveStatus={handleSaveStatus}
        savingStatus={statusSaving}
      />
    </main>
  );
}
