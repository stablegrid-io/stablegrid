import { NextResponse } from 'next/server';
import { toApiErrorResponse } from '@/lib/api/http';
import { createClient } from '@/lib/supabase/server';

// Daily practice accuracy series for the /stats dashboard.
//
// GET /api/operations/practice/accuracy-by-day?days=30
//   → { data: [{ date, total, success, accuracy }] }
//
// Aggregates client-side rather than via SQL FILTER WHERE so the route
// stays portable across older Postgres / Supabase environments and we
// don't need a new RPC. Bounded query: 30 days × ~50 attempts/day max
// is well within a single fetch.

type AttemptResult = 'success' | 'failure' | 'self_review';

interface AttemptRow {
  result: AttemptResult;
  attempted_at: string;
}

const isMissingTableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('practice_task_attempts') &&
    (msg.includes('does not exist') || msg.includes('42p01'))
  );
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawDays = Number(url.searchParams.get('days') ?? '30');
  const days = Math.max(7, Math.min(180, Number.isFinite(rawDays) ? Math.round(rawDays) : 30));

  try {
    const since = new Date(Date.now() - days * MS_PER_DAY);
    const sinceIso = since.toISOString();

    const { data, error } = await supabase
      .from('practice_task_attempts')
      .select('result, attempted_at')
      .eq('user_id', user.id)
      .gte('attempted_at', sinceIso)
      .order('attempted_at', { ascending: true });

    if (error) {
      if (isMissingTableError(new Error(error.message))) {
        return NextResponse.json({ data: [], days });
      }
      throw new Error(error.message);
    }

    // Bucket attempts by UTC date. Using UTC keeps the buckets stable
    // across browser timezones — the chart's x-axis is just date labels,
    // so a small per-user TZ offset on the boundary is acceptable.
    const byDate = new Map<string, { total: number; success: number }>();
    for (const row of (data ?? []) as AttemptRow[]) {
      const date = isoDate(new Date(row.attempted_at));
      const e = byDate.get(date) ?? { total: 0, success: 0 };
      e.total++;
      // self_review and failure both count as "not yet success" — the
      // accuracy metric is success / total, mirroring the per-task
      // bestResult collapse logic in /api/.../task-attempt.
      if (row.result === 'success') e.success++;
      byDate.set(date, e);
    }

    // Fill the full window with zero-rows so the chart is dense (no
    // gaps that would hide a streak break or a no-activity stretch).
    const series: Array<{
      date: string;
      total: number;
      success: number;
      accuracy: number | null;
    }> = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * MS_PER_DAY);
      const key = isoDate(d);
      const e = byDate.get(key);
      series.push({
        date: key,
        total: e?.total ?? 0,
        success: e?.success ?? 0,
        accuracy: e && e.total > 0 ? e.success / e.total : null,
      });
    }

    return NextResponse.json({ data: series, days });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to load accuracy series.');
  }
}
