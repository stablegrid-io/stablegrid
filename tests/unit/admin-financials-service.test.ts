import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listAdminFinancials } from '@/lib/admin/service';

type Row = Record<string, unknown>;

interface TableSeed {
  rows?: Row[];
}

interface QueryResult {
  data: Row[] | null;
  error: { message?: string } | null;
  count: number | null;
}

class QueryBuilder {
  private filters: Array<(row: Row) => boolean> = [];

  constructor(private readonly seed: TableSeed | undefined) {}

  select(_columns: string, _options?: { count?: string; head?: boolean }) {
    return this;
  }

  gte(column: string, value: string) {
    this.filters.push((row) => {
      const cell = row[column];
      return typeof cell === 'string' && cell >= value;
    });
    return this;
  }

  lte(column: string, value: string) {
    this.filters.push((row) => {
      const cell = row[column];
      return typeof cell === 'string' && cell <= value;
    });
    return this;
  }

  async execute(): Promise<QueryResult> {
    const rows = (this.seed?.rows ?? []).filter((row) => this.filters.every((filter) => filter(row)));

    return {
      data: rows,
      error: null,
      count: null
    };
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

const createSupabaseMock = (tables: Record<string, TableSeed>) => ({
  from(tableName: string) {
    return new QueryBuilder(tables[tableName]);
  }
});

describe('listAdminFinancials', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds monthly financial KPIs from real subscriptions and profile growth data', async () => {
    const supabase = createSupabaseMock({
      subscriptions: {
        rows: [
          {
            user_id: 'user-1',
            plan: 'pro',
            status: 'active',
            stripe_sub_id: 'sub_current_1',
            created_at: '2026-02-20T10:00:00.000Z',
            updated_at: '2026-02-20T10:00:00.000Z'
          },
          {
            user_id: 'user-2',
            plan: 'pro',
            status: 'canceled',
            stripe_sub_id: 'sub_current_2',
            created_at: '2026-03-01T10:00:00.000Z',
            updated_at: '2026-03-08T10:00:00.000Z'
          },
          {
            user_id: 'user-3',
            plan: 'pro',
            status: 'active',
            stripe_sub_id: 'sub_previous_1',
            created_at: '2026-01-20T10:00:00.000Z',
            updated_at: '2026-01-20T10:00:00.000Z'
          },
          {
            user_id: 'user-free',
            plan: 'free',
            status: 'active',
            stripe_sub_id: null,
            created_at: '2026-02-24T10:00:00.000Z',
            updated_at: '2026-02-24T10:00:00.000Z'
          }
        ]
      },
      profiles: {
        rows: [
          { id: 'user-1', created_at: '2026-02-18T10:00:00.000Z' },
          { id: 'user-2', created_at: '2026-02-21T10:00:00.000Z' },
          { id: 'user-4', created_at: '2026-03-03T10:00:00.000Z' },
          { id: 'user-5', created_at: '2026-03-11T10:00:00.000Z' },
          { id: 'user-3', created_at: '2026-01-17T10:00:00.000Z' },
          { id: 'user-6', created_at: '2026-01-30T10:00:00.000Z' }
        ]
      }
    });

    const snapshot = await listAdminFinancials(supabase);

    expect(snapshot.periodLabel).toBe('Last 30 days');
    expect(snapshot.monthlyRevenue).toBe(24);
    expect(snapshot.previousMonthlyRevenue).toBe(12);
    expect(snapshot.dailyRevenue).toHaveLength(30);
    expect(snapshot.heroTrend).toHaveLength(12);
    expect(snapshot.dailyRevenue.reduce((sum, point) => sum + point.revenue, 0)).toBe(24);

    expect(snapshot.kpis.find((kpi) => kpi.id === 'total_orders')).toMatchObject({
      value: 2,
      displayValue: '2',
      changePct: 100
    });
    expect(snapshot.kpis.find((kpi) => kpi.id === 'avg_order_value')).toMatchObject({
      value: 12,
      displayValue: '€12.00',
      changePct: 0
    });
    expect(snapshot.kpis.find((kpi) => kpi.id === 'conversion_rate')).toMatchObject({
      value: 50,
      displayValue: '50.0%',
      changePct: 0
    });
    expect(snapshot.kpis.find((kpi) => kpi.id === 'refund_rate')).toMatchObject({
      value: 50,
      displayValue: '50.0%',
      changePct: 100
    });
  });
});
