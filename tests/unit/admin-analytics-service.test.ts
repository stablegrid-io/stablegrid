import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listAdminAnalytics } from '@/lib/admin/service';

type Row = Record<string, unknown>;

interface TableSeed {
  rows?: Row[];
  missing?: boolean;
}

interface QueryResult {
  data: Row[] | null;
  error: { message?: string } | null;
  count: number | null;
}

class QueryBuilder {
  private filters: Array<(row: Row) => boolean> = [];
  private selectOptions: { count?: string; head?: boolean } | undefined;

  constructor(
    private readonly tableName: string,
    private readonly seed: TableSeed | undefined
  ) {}

  select(_columns: string, options?: { count?: string; head?: boolean }) {
    this.selectOptions = options;
    return this;
  }

  gte(column: string, value: string) {
    this.filters.push((row) => {
      const cell = row[column];
      return typeof cell === 'string' && cell >= value;
    });
    return this;
  }

  not(column: string, operator: string, value: null) {
    if (operator !== 'is' || value !== null) {
      throw new Error(`Unsupported not() usage on ${this.tableName}`);
    }

    this.filters.push((row) => row[column] != null);
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  async execute(): Promise<QueryResult> {
    if (this.tableName === 'learning_analytics_events') {
      throw new Error('Analytics service should not query learning_analytics_events.');
    }

    if (this.seed?.missing) {
      return {
        data: null,
        error: {
          message: `Could not find the table 'public.${this.tableName}' in the schema cache`
        },
        count: null
      };
    }

    const rows = (this.seed?.rows ?? []).filter((row) => this.filters.every((filter) => filter(row)));

    if (this.selectOptions?.head) {
      return {
        data: null,
        error: null,
        count: rows.length
      };
    }

    return {
      data: rows,
      error: null,
      count: this.selectOptions?.count === 'exact' ? rows.length : null
    };
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

const createSupabaseMock = (tables: Record<string, TableSeed>) => ({
  from(tableName: string) {
    return new QueryBuilder(tableName, tables[tableName]);
  }
});

describe('listAdminAnalytics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds analytics from the current progress tables without relying on removed learning analytics events', async () => {
    const supabase = createSupabaseMock({
      profiles: {
        rows: [
          { id: 'user-1', created_at: '2026-01-10T10:00:00.000Z' },
          { id: 'user-2', created_at: '2026-03-10T10:00:00.000Z' },
          { id: 'user-3', created_at: '2026-03-05T10:00:00.000Z' },
          { id: 'user-4', created_at: '2026-02-20T10:00:00.000Z' }
        ]
      },
      user_progress: {
        rows: [
          { user_id: 'user-1', last_activity: '2026-03-13T10:00:00.000Z' },
          { user_id: 'user-4', last_activity: '2026-02-25T10:00:00.000Z' }
        ]
      },
      reading_sessions: {
        rows: [
          {
            user_id: 'user-2',
            topic: 'fabric',
            last_active_at: '2026-03-11T10:00:00.000Z',
            is_completed: true,
            completed_at: '2026-03-11T10:00:00.000Z'
          },
          {
            user_id: 'user-3',
            topic: 'pyspark-data-engineering-track',
            last_active_at: '2026-03-01T10:00:00.000Z',
            is_completed: false,
            completed_at: null
          }
        ]
      },
      topic_progress: {
        rows: [
          {
            user_id: 'user-1',
            topic: 'pyspark',
            last_activity_at: '2026-03-12T10:00:00.000Z'
          },
          {
            user_id: 'user-3',
            topic: 'pyspark-data-engineering-track',
            last_activity_at: '2026-03-03T10:00:00.000Z'
          }
        ]
      },
      module_progress: {
        rows: [
          {
            user_id: 'user-1',
            topic: 'pyspark',
            updated_at: '2026-03-13T10:00:00.000Z',
            is_completed: true,
            completed_at: '2026-03-13T10:00:00.000Z'
          },
          {
            user_id: 'user-2',
            topic: 'fabric',
            updated_at: '2026-02-28T10:00:00.000Z',
            is_completed: true,
            completed_at: '2026-02-28T10:00:00.000Z'
          }
        ]
      },
      reading_lesson_history: {
        rows: [
          {
            user_id: 'user-1',
            topic: 'pyspark',
            read_at: '2026-03-13T11:00:00.000Z'
          },
          {
            user_id: 'user-1',
            topic: 'pyspark',
            read_at: '2026-03-10T11:00:00.000Z'
          },
          {
            user_id: 'user-2',
            topic: 'fabric',
            read_at: '2026-02-27T11:00:00.000Z'
          },
          {
            user_id: 'user-3',
            topic: 'pyspark-data-engineering-track',
            read_at: '2026-03-12T11:00:00.000Z'
          }
        ]
      },
      subscriptions: {
        rows: [
          {
            user_id: 'user-1',
            plan: 'pro',
            status: 'active',
            stripe_sub_id: 'sub_1',
            created_at: '2026-03-13T12:00:00.000Z',
            updated_at: '2026-03-13T12:00:00.000Z'
          },
          {
            user_id: 'user-2',
            plan: 'pro',
            status: 'trialing',
            stripe_sub_id: 'sub_2',
            created_at: '2026-03-05T12:00:00.000Z',
            updated_at: '2026-03-05T12:00:00.000Z'
          },
          {
            user_id: 'user-3',
            plan: 'free',
            status: 'active',
            stripe_sub_id: null,
            created_at: '2026-03-01T12:00:00.000Z',
            updated_at: '2026-03-01T12:00:00.000Z'
          }
        ]
      },
      user_activation_tasks: {
        rows: [
          {
            id: 'task-1',
            user_id: 'user-1',
            status: 'completed',
            started_at: '2026-03-09T09:30:00.000Z',
            completed_at: '2026-03-09T10:00:00.000Z'
          },
          {
            id: 'task-2',
            user_id: 'user-2',
            status: 'completed',
            started_at: '2026-03-02T08:00:00.000Z',
            completed_at: '2026-03-02T10:00:00.000Z'
          },
          { id: 'task-3', user_id: 'user-3', status: 'todo', started_at: null, completed_at: null },
          {
            id: 'task-4',
            user_id: 'user-4',
            status: 'in_progress',
            started_at: '2026-03-14T09:00:00.000Z',
            completed_at: null
          }
        ]
      }
    });

    const snapshot = await listAdminAnalytics(supabase, { period: 'monthly' });

    expect(snapshot.period).toBe('monthly');
    expect(snapshot.totalUsers).toBe(4);
    expect(snapshot.activeUsers).toBe(4);
    expect(snapshot.newUsers).toBe(3);
    expect(snapshot.engagedUsers).toBe(4);
    expect(snapshot.lessonCompletions).toBe(4);
    expect(snapshot.moduleCompletions).toBe(2);
    expect(snapshot.tasksCompleted).toBe(2);
    expect(snapshot.taskCompletionRatePct).toBe(50);
    expect(snapshot.openTasks).toBe(2);
    expect(snapshot.activeSubscriptions).toBe(2);
    expect(snapshot.sales).toBe(2);
    expect(snapshot.metrics.find((metric) => metric.id === 'total_users')).toMatchObject({
      label: 'Users in period',
      value: 3,
      helper: 'Profiles created in last 30 days.'
    });
    expect(snapshot.metrics.find((metric) => metric.id === 'average_platform_time')).toMatchObject({
      label: 'Avg time in stableGrid',
      value: 4500,
      displayValue: '1h 15m'
    });
    expect(snapshot.metrics.find((metric) => metric.id === 'average_task_time')).toMatchObject({
      label: 'Avg task time',
      value: 4500,
      displayValue: '1h 15m'
    });
    expect(snapshot.decisionTrees).toHaveLength(5);
    expect(snapshot.decisionTrees[0]).toMatchObject({
      id: 'paid_vs_free',
      rootCount: 4,
      segments: [
        {
          label: 'Paid users',
          count: 2
        },
        {
          label: 'Free users',
          count: 2
        }
      ]
    });
    const paidVsFreeTree = snapshot.decisionTrees.find((tree) => tree.id === 'paid_vs_free');
    const freeUsersSegment = paidVsFreeTree?.segments.find((segment) => segment.id === 'free_users');
    const freeTheoryOutcome = freeUsersSegment?.outcomes.find(
      (outcome) => outcome.id === 'theory_completion_rate'
    );
    expect(freeTheoryOutcome).toMatchObject({
      completedUsers: 0,
      totalUsers: 2,
      ratePct: 0
    });
    expect(snapshot.topicStats).toEqual([
      {
        topic: 'pyspark',
        label: 'PySpark: The Full Stack',
        activeUsers: 1,
        lessonCompletions: 2,
        moduleCompletions: 1
      },
      {
        topic: 'fabric',
        label: 'Fabric: End-to-End Platform',
        activeUsers: 1,
        lessonCompletions: 1,
        moduleCompletions: 1
      },
      {
        topic: 'pyspark-data-engineering-track',
        label: 'PySpark: Data Engineering Track',
        activeUsers: 1,
        lessonCompletions: 1,
        moduleCompletions: 0
      }
    ]);
  });

  it('degrades gracefully when optional analytics tables are missing from the schema cache', async () => {
    const supabase = createSupabaseMock({
      profiles: {
        rows: [{ id: 'user-1', created_at: '2026-03-10T10:00:00.000Z' }]
      },
      user_progress: {
        rows: [{ user_id: 'user-1', last_activity: '2026-03-14T10:00:00.000Z' }]
      },
      reading_sessions: {
        rows: [
          {
            user_id: 'user-1',
            topic: 'pyspark',
            last_active_at: '2026-03-14T10:00:00.000Z',
            is_completed: true,
            completed_at: '2026-03-14T10:00:00.000Z'
          }
        ]
      },
      topic_progress: {
        rows: [{ user_id: 'user-1', topic: 'pyspark', last_activity_at: '2026-03-14T10:00:00.000Z' }]
      },
      module_progress: { missing: true },
      reading_lesson_history: { missing: true },
      subscriptions: {
        rows: [
          {
            user_id: 'user-1',
            plan: 'pro',
            status: 'active',
            stripe_sub_id: 'sub_1',
            created_at: '2026-03-14T12:00:00.000Z',
            updated_at: '2026-03-14T12:00:00.000Z'
          }
        ]
      },
      user_activation_tasks: {
        rows: [
          {
            id: 'task-1',
            user_id: 'user-1',
            status: 'todo',
            started_at: null,
            completed_at: null
          }
        ]
      }
    });

    const snapshot = await listAdminAnalytics(supabase, { period: 'daily' });

    expect(snapshot.period).toBe('daily');
    expect(snapshot.totalUsers).toBe(1);
    expect(snapshot.activeUsers).toBe(1);
    expect(snapshot.moduleCompletions).toBe(1);
    expect(snapshot.lessonCompletions).toBe(0);
    expect(snapshot.activeSubscriptions).toBe(1);
    expect(snapshot.sales).toBe(1);
    expect(snapshot.metrics.find((metric) => metric.id === 'total_users')).toMatchObject({
      label: 'Users in period',
      value: 0,
      helper: 'Profiles created in today.'
    });
    expect(snapshot.decisionTrees[1]).toMatchObject({
      id: 'active_vs_inactive',
      segments: [
        {
          label: 'Active users',
          count: 1
        },
        {
          label: 'Inactive users',
          count: 0
        }
      ]
    });
    expect(snapshot.topicStats).toEqual([
      {
        topic: 'pyspark',
        label: 'PySpark: The Full Stack',
        activeUsers: 1,
        lessonCompletions: 0,
        moduleCompletions: 1
      }
    ]);
  });
});
