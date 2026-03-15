import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminBugsPage } from '@/components/admin/bugs/BugsPage';
import type { BugReport } from '@/components/admin/bugs/types';

const BUG_FIXTURE: BugReport[] = [
  {
    id: 'bug-1',
    title: 'Theory lesson freezes',
    description: 'Theory lesson freezes after opening a code block.',
    shortDescription: 'Theory lesson freezes after opening a code block.',
    reporterName: 'Emma Wilson',
    reporterEmail: 'emma@stablegrid.io',
    severity: 'High',
    status: 'New',
    statusDb: 'new',
    submittedAt: '2026-03-14T12:00:00.000Z',
    module: 'Theory',
    browser: 'Chrome',
    device: 'Desktop',
    stepsToReproduce: null,
    expectedResult: null,
    actualResult: null,
    attachmentUrls: [],
    pageUrl: '/theory'
  },
  {
    id: 'bug-2',
    title: 'Task status not saving',
    description: 'Task state reverts after refresh.',
    shortDescription: 'Task state reverts after refresh.',
    reporterName: 'David Kim',
    reporterEmail: 'david@stablegrid.io',
    severity: 'Medium',
    status: 'In Review',
    statusDb: 'triaged',
    submittedAt: '2026-03-13T11:00:00.000Z',
    module: 'Tasks',
    browser: 'Safari',
    device: 'Mobile',
    stepsToReproduce: null,
    expectedResult: null,
    actualResult: null,
    attachmentUrls: [],
    pageUrl: '/tasks'
  }
];

const flushTimers = async (ms = 600) => {
  await act(async () => {
    await Promise.resolve();
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
};

describe('AdminBugsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    let reports = [...BUG_FIXTURE];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/admin/bugs') && method === 'GET') {
          return {
            ok: true,
            json: async () => ({ data: reports })
          } as Response;
        }

        if (url.includes('/api/admin/bugs/') && method === 'PATCH') {
          const id = url.split('/').at(-1) ?? '';
          const body =
            typeof init?.body === 'string'
              ? (JSON.parse(init.body) as { status?: 'new' | 'triaged' | 'resolved' })
              : {};
          const nextStatus =
            body.status === 'triaged' ? 'In Review' : body.status === 'resolved' ? 'Resolved' : 'New';
          const nextStatusDb = body.status === 'resolved' ? 'resolved' : body.status === 'triaged' ? 'triaged' : 'new';

          reports = reports.map((report) =>
            report.id === id ? { ...report, status: nextStatus, statusDb: nextStatusDb } : report
          );

          const updated = reports.find((report) => report.id === id);
          return {
            ok: true,
            json: async () => ({ data: updated })
          } as Response;
        }

        return {
          ok: false,
          json: async () => ({ error: 'Not found' })
        } as Response;
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.useRealTimers();
    cleanup();
  });

  it('filters by status and query', async () => {
    render(<AdminBugsPage />);
    await flushTimers();

    fireEvent.click(screen.getByRole('tab', { name: 'New' }));
    await flushTimers(180);

    const searchInput = screen.getByPlaceholderText('Search bug reports...');
    fireEvent.change(searchInput, { target: { value: 'theory' } });
    await flushTimers(180);

    expect(screen.getByText('Theory lesson freezes')).toBeInTheDocument();
    expect(screen.queryByText('Task status not saving')).not.toBeInTheDocument();
  });

  it('opens detail drawer and saves status', async () => {
    render(<AdminBugsPage />);
    await flushTimers();

    fireEvent.click(screen.getByRole('tab', { name: 'New' }));
    await flushTimers(180);

    expect(screen.getByText('Theory lesson freezes')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Theory lesson freezes'));
    expect(screen.getByRole('dialog', { name: 'Bug detail' })).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('New'), { target: { value: 'In Review' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await flushTimers(220);

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/admin/bugs/bug-1',
      expect.objectContaining({
        method: 'PATCH'
      })
    );
  });
});
