'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPayloadRequestKey } from '@/lib/api/requestKeys';
import { AdminLeftRail } from '@/components/admin/AdminLeftRail';
import { FeedbackAnalyticsSection } from '@/components/admin/feedback/FeedbackAnalyticsSection';
import { FeedbackDetailDrawer } from '@/components/admin/feedback/FeedbackDetailDrawer';
import { FeedbackKpiRow } from '@/components/admin/feedback/FeedbackKpiRow';
import { FeedbackPageHeader } from '@/components/admin/feedback/FeedbackPageHeader';
import { FeedbackTableSection } from '@/components/admin/feedback/FeedbackTableSection';
import {
  DEFAULT_FEEDBACK_FILTERS,
  type FeedbackFilters,
  type FeedbackRecord,
  type FeedbackSortOption
} from '@/components/admin/feedback/types';
import {
  buildFeedbackAnalytics,
  filterFeedbackRecords,
  paginateFeedback,
  sortFeedbackRecords
} from '@/components/admin/feedback/utils';
import {
  ADMIN_LAYOUT_CLASS,
  ADMIN_PAGE_SHELL_CLASS,
  ADMIN_SECONDARY_SURFACE_CLASS,
  AdminInlineMessage
} from '@/components/admin/theme';

const DEFAULT_ROWS_PER_PAGE = 10;

interface ApiEnvelope<T> {
  data: T;
  error?: string;
}

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

const getReferenceDate = (records: FeedbackRecord[]) => {
  if (records.length === 0) {
    return new Date();
  }

  const latestTimestamp = Math.max(
    ...records.map((record) => new Date(record.submittedAt).getTime())
  );

  return new Date(latestTimestamp);
};

const buildFilterOptions = (records: FeedbackRecord[], key: 'category' | 'module') =>
  Array.from(
    new Set(
      records.map((record) => record[key].trim()).filter((value) => value.length > 0)
    )
  ).sort((left, right) => left.localeCompare(right));

export function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [filters, setFilters] = useState<FeedbackFilters>(DEFAULT_FEEDBACK_FILTERS);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<FeedbackSortOption>('newest');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [loading, setLoading] = useState(true);
  const [tableBusy, setTableBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  const referenceDate = useMemo(() => getReferenceDate(feedback), [feedback]);
  const categoryOptions = useMemo(
    () => buildFilterOptions(feedback, 'category'),
    [feedback]
  );
  const moduleOptions = useMemo(() => buildFilterOptions(feedback, 'module'), [feedback]);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await requestJson<FeedbackRecord[]>('/api/admin/feedback');
      setFeedback(data);
    } catch (loadError) {
      setFeedback([]);
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load feedback.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    if (loading) {
      return;
    }

    setTableBusy(true);
    const timer = window.setTimeout(() => setTableBusy(false), 120);
    return () => window.clearTimeout(timer);
  }, [filters, loading, page, query, rowsPerPage, sort]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredFeedback = useMemo(
    () => filterFeedbackRecords(feedback, filters, query, referenceDate),
    [feedback, filters, query, referenceDate]
  );

  const sortedFeedback = useMemo(
    () => sortFeedbackRecords(filteredFeedback, sort),
    [filteredFeedback, sort]
  );

  const pageCount = Math.max(1, Math.ceil(sortedFeedback.length / rowsPerPage));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const pagedFeedback = useMemo(
    () => paginateFeedback(sortedFeedback, page, rowsPerPage),
    [page, rowsPerPage, sortedFeedback]
  );

  const analytics = useMemo(
    () => buildFeedbackAnalytics(filteredFeedback, filters.dateRange, referenceDate),
    [filteredFeedback, filters.dateRange, referenceDate]
  );

  const selectedFeedback = useMemo(
    () => feedback.find((record) => record.id === selectedFeedbackId) ?? null,
    [feedback, selectedFeedbackId]
  );

  const isTableLoading = loading || tableBusy;

  const handleSaveRecord = useCallback(
    async ({
      record,
      status,
      internalNotes
    }: {
      record: FeedbackRecord;
      status: FeedbackRecord['status'];
      internalNotes: string;
    }) => {
      setSavingFeedbackId(record.id);
      setError(null);

      try {
        const updated = await requestJson<FeedbackRecord>(
          `/api/admin/feedback/${record.sourceType}/${record.sourceId}`,
          {
            method: 'PATCH',
            headers: {
              'Idempotency-Key': createPayloadRequestKey('admin_feedback_update', {
                sourceType: record.sourceType,
                sourceId: record.sourceId,
                status,
                internalNotes
              })
            },
            body: JSON.stringify({
              status,
              internalNotes
            })
          }
        );

        setFeedback((current) =>
          current.map((entry) => (entry.id === updated.id ? updated : entry))
        );
        setSelectedFeedbackId(updated.id);
        setNotice('Feedback updated.');
      } catch (saveError) {
        setError(
          saveError instanceof Error ? saveError.message : 'Failed to update feedback.'
        );
      } finally {
        setSavingFeedbackId(null);
      }
    },
    []
  );

  return (
    <main className={ADMIN_PAGE_SHELL_CLASS}>
      <div className={ADMIN_LAYOUT_CLASS}>
        <aside className="hidden lg:block">
          <AdminLeftRail activeSection="feedback" />
        </aside>

        <div className="space-y-5">
          <FeedbackPageHeader
            filters={filters}
            categoryOptions={categoryOptions}
            moduleOptions={moduleOptions}
            onFilterChange={(next) => {
              setFilters(next);
              setPage(1);
            }}
          />

          {notice ? <AdminInlineMessage tone="success" message={notice} /> : null}
          {error ? <AdminInlineMessage tone="error" message={error} /> : null}

          {loading && feedback.length === 0 ? (
            <section
              className={`${ADMIN_SECONDARY_SURFACE_CLASS} px-5 py-10 text-sm text-[#90a49b]`}
            >
              Loading feedback analytics...
            </section>
          ) : (
            <>
              <FeedbackKpiRow metrics={analytics.metrics} />
              <FeedbackAnalyticsSection analytics={analytics} />
              <FeedbackTableSection
                records={pagedFeedback}
                totalCount={sortedFeedback.length}
                page={page}
                pageCount={pageCount}
                rowsPerPage={rowsPerPage}
                query={query}
                sort={sort}
                loading={isTableLoading}
                onQueryChange={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                onSortChange={(value) => {
                  setSort(value);
                  setPage(1);
                }}
                onPageChange={setPage}
                onRowsPerPageChange={(value) => {
                  setRowsPerPage(value);
                  setPage(1);
                }}
                onOpenRecord={(record) => setSelectedFeedbackId(record.id)}
              />
            </>
          )}
        </div>
      </div>

      <FeedbackDetailDrawer
        record={selectedFeedback}
        open={Boolean(selectedFeedback)}
        saving={selectedFeedback?.id === savingFeedbackId}
        onClose={() => setSelectedFeedbackId(null)}
        onSave={handleSaveRecord}
      />
    </main>
  );
}
