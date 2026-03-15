import { describe, expect, it, vi } from 'vitest';
import { listAdminFeedbackRecords } from '@/lib/admin/service';

const createQueryBuilder = (rows: Array<Record<string, unknown>>) => {
  let filtered = [...rows];
  const chain: any = {};

  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn((column: string, value: unknown) => {
    filtered = filtered.filter((row) => row[column] === value);
    return chain;
  });
  chain.in = vi.fn(async (column: string, values: unknown[]) => ({
    data: filtered.filter((row) => values.includes(row[column])),
    error: null
  }));
  chain.order = vi.fn(async (column: string, options?: { ascending?: boolean }) => ({
    data: [...filtered].sort((left, right) => {
      const leftValue = String(left[column] ?? '');
      const rightValue = String(right[column] ?? '');
      const comparison = leftValue.localeCompare(rightValue);
      return options?.ascending ? comparison : -comparison;
    }),
    error: null
  }));
  chain.maybeSingle = vi.fn(async () => ({
    data: filtered[0] ?? null,
    error: null
  }));

  return chain;
};

const createSupabase = () => {
  const bugReports = [
    {
      id: 'bug-1',
      user_id: 'user-1',
      email: 'emma@stablegrid.io',
      title: 'Task pages freeze after opening a module',
      details:
        'Pages lock for a few seconds after I move between tasks.\n[Structured context]\nCategory: Performance / slow behavior\nArea: Tasks',
      page_url: '/practice/notebooks',
      user_agent: 'Mozilla/5.0 Chrome/122.0.0.0 Safari/537.36',
      status: 'new',
      created_at: '2026-03-14T12:00:00.000Z',
      updated_at: '2026-03-14T12:00:00.000Z'
    }
  ];

  const productFunnelEvents = [
    {
      id: 'event-1',
      session_id: 'session-abcdef12',
      user_id: null,
      event_name: 'lightbulb_feedback_submitted',
      path: '/theory/module/traffic-basics',
      metadata: {
        contextType: 'module',
        contextId: 'traffic-basics',
        value: 'bright'
      },
      occurred_at: '2026-03-13T08:30:00.000Z',
      created_at: '2026-03-13T08:30:00.000Z'
    }
  ];

  const profiles = [
    {
      id: 'user-1',
      name: 'Emma Wilson',
      email: 'emma@stablegrid.io'
    }
  ];

  const triage = [
    {
      source_type: 'bug_report',
      source_id: 'bug-1',
      status: 'ignored',
      admin_notes: 'Tracked separately in the performance queue.',
      updated_by: 'admin-1',
      created_at: '2026-03-14T13:00:00.000Z',
      updated_at: '2026-03-14T13:00:00.000Z'
    },
    {
      source_type: 'lightbulb_feedback',
      source_id: 'event-1',
      status: 'reviewed',
      admin_notes: 'Strong positive signal from theory module learners.',
      updated_by: 'admin-1',
      created_at: '2026-03-13T09:00:00.000Z',
      updated_at: '2026-03-13T09:00:00.000Z'
    }
  ];

  return {
    from: vi.fn((table: string) => {
      if (table === 'bug_reports') {
        return createQueryBuilder(bugReports);
      }

      if (table === 'product_funnel_events') {
        return createQueryBuilder(productFunnelEvents);
      }

      if (table === 'profiles') {
        return createQueryBuilder(profiles);
      }

      if (table === 'admin_feedback_triage') {
        return createQueryBuilder(triage);
      }

      throw new Error(`Unexpected table: ${table}`);
    })
  };
};

describe('listAdminFeedbackRecords', () => {
  it('merges bug reports and lightbulb events into admin feedback records', async () => {
    const supabase = createSupabase();

    const records = await listAdminFeedbackRecords(supabase);

    expect(records).toHaveLength(2);

    const bugRecord = records.find((record) => record.sourceType === 'bug_report');
    expect(bugRecord).toMatchObject({
      id: 'bug_report:bug-1',
      userName: 'Emma Wilson',
      category: 'Performance',
      module: 'Tasks',
      status: 'Ignored',
      sentiment: 'Negative',
      internalNotes: 'Tracked separately in the performance queue.'
    });
    expect(bugRecord?.keywords).toEqual(
      expect.arrayContaining(['performance', 'tasks', 'freeze'])
    );

    const lightbulbRecord = records.find(
      (record) => record.sourceType === 'lightbulb_feedback'
    );
    expect(lightbulbRecord).toMatchObject({
      id: 'lightbulb_feedback:event-1',
      userName: 'Anonymous session',
      category: 'Theory Experience',
      module: 'Theory',
      status: 'Reviewed',
      type: 'Praise',
      rating: 5,
      sentiment: 'Positive',
      internalNotes: 'Strong positive signal from theory module learners.'
    });
    expect(lightbulbRecord?.keywords).toEqual(
      expect.arrayContaining(['theory experience', 'theory', 'very clear'])
    );
  });
});
