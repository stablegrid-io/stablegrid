import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminFeedbackPage } from '@/components/admin/feedback/AdminFeedbackPage';
import type { FeedbackRecord } from '@/components/admin/feedback/types';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => {
      if (!isValidElement(children)) {
        return null;
      }

      return cloneElement(children as ReactElement<Record<string, unknown>>, {
        width: 860,
        height: 260
      });
    }
  };
});

const FEEDBACK_FIXTURE: FeedbackRecord[] = [
  {
    id: 'bug_report:bug-1',
    sourceId: 'bug-1',
    sourceType: 'bug_report',
    userName: 'Emma Wilson',
    userEmail: 'emma@stablegrid.io',
    submittedAt: '2026-03-14T12:00:00.000Z',
    type: 'Issue',
    rating: 2,
    sentiment: 'Negative',
    category: 'Performance',
    status: 'Submitted',
    module: 'Task Pages',
    linkedPage: '/home',
    preview: 'Task pages take too long to open on older laptops.',
    message:
      'Every task page takes a few seconds before content settles. It feels especially slow on an older laptop, and the delay is enough that I second-guess whether the click worked.',
    internalNotes: '',
    keywords: ['performance', 'task pages', 'loading']
  },
  {
    id: 'lightbulb_feedback:event-2',
    sourceId: 'event-2',
    sourceType: 'lightbulb_feedback',
    userName: 'Anonymous session',
    userEmail: 'session:abcd1234',
    submittedAt: '2026-03-13T10:00:00.000Z',
    type: 'Praise',
    rating: 5,
    sentiment: 'Positive',
    category: 'Theory Experience',
    status: 'Reviewed',
    module: 'Theory',
    linkedPage: '/theory',
    preview: 'Very clear response for theory experience in theory.',
    message:
      'This is a one-click lightbulb response marked as "Very clear" for the theory experience in Theory.',
    internalNotes: 'Keep tracking positive theory signal.',
    keywords: ['theory', 'very clear']
  }
];

// TODO(beta-tests): mocks stale after OAuth + Learn unification — rewrite post-beta
describe.skip('AdminFeedbackPage', () => {
  beforeEach(() => {
    let feedback = [...FEEDBACK_FIXTURE];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/admin/feedback') && method === 'GET') {
          return {
            ok: true,
            json: async () => ({ data: feedback })
          } as Response;
        }

        if (url.includes('/api/admin/feedback/') && method === 'PATCH') {
          const body =
            typeof init?.body === 'string'
              ? (JSON.parse(init.body) as {
                  internalNotes?: string;
                  status?: FeedbackRecord['status'];
                })
              : {};

          const [, sourceType, sourceId] =
            url.match(/\/api\/admin\/feedback\/([^/]+)\/([^/]+)/) ?? [];
          const recordId = `${sourceType}:${sourceId}`;

          feedback = feedback.map((record) =>
            record.id === recordId
              ? {
                  ...record,
                  status: body.status ?? record.status,
                  internalNotes: body.internalNotes ?? record.internalNotes
                }
              : record
          );

          return {
            ok: true,
            json: async () => ({
              data: feedback.find((record) => record.id === recordId)
            })
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
  });

  it('renders analytics, supports filtering, and saves feedback drawer updates', async () => {
    const user = userEvent.setup();

    render(<AdminFeedbackPage />);

    expect(screen.getByRole('heading', { name: 'Feedback' })).toBeInTheDocument();
    expect(await screen.findByText('Total feedback received')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Feedback trend over time' })
    ).toBeInTheDocument();

    expect(
      await screen.findByText('Task pages take too long to open on older laptops.')
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Category'), 'Performance');

    await waitFor(() => {
      expect(
        screen.queryByText('Very clear response for theory experience in theory.')
      ).not.toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Search feedback'), 'older laptops');

    const row = await screen.findByText(
      'Task pages take too long to open on older laptops.'
    );
    await user.click(row);

    const dialog = await screen.findByRole('dialog', { name: 'Feedback detail' });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText(
        'Every task page takes a few seconds before content settles. It feels especially slow on an older laptop, and the delay is enough that I second-guess whether the click worked.'
      )
    ).toBeInTheDocument();

    await user.selectOptions(
      within(dialog).getByLabelText('Feedback status'),
      'Resolved'
    );
    await user.type(
      within(dialog).getByLabelText('Internal admin notes'),
      ' Escalated to performance review.'
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        '/api/admin/feedback/bug_report/bug-1',
        expect.objectContaining({
          method: 'PATCH'
        })
      );
    });

    expect(await screen.findByText('Feedback updated.')).toBeInTheDocument();
    expect(screen.getAllByText('Resolved').length).toBeGreaterThan(0);
  });
});
