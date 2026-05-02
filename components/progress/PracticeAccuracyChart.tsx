'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* ── Types ────────────────────────────────────────────────────────────── */

interface AccuracyDay {
  date: string;
  total: number;
  success: number;
  accuracy: number | null;
}

interface AccuracyResponse {
  data: AccuracyDay[];
  days: number;
}

/* ── Visual constants — match dashboard ──────────────────────────────── */

const CARD = 'rounded-[22px] bg-[#181c20] border border-white/[0.06] p-5';
const SECTION_LABEL =
  'text-[11px] font-mono font-bold text-on-surface/75 uppercase tracking-[0.18em]';
const SECTION_SUBLABEL = 'text-[13px] text-on-surface-variant/75 leading-relaxed';
const ACCENT = '153,247,255';

/* ── Helpers ─────────────────────────────────────────────────────────── */

const fmtAccuracyPct = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? '—' : `${Math.round(n * 100)}%`;

const fmtMonthDay = (iso: string) => {
  // iso is "YYYY-MM-DD"; build a Date at UTC midnight to avoid TZ drift
  // shifting the label one day on PST/etc.
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10));
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* ── Component ────────────────────────────────────────────────────────── */

export function PracticeAccuracyChart({ days = 30 }: { days?: number }) {
  const [series, setSeries] = useState<AccuracyDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch(
          `/api/operations/practice/accuracy-by-day?days=${days}`,
          { credentials: 'same-origin' },
        );
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as AccuracyResponse;
        if (cancelled) return;
        setSeries(json.data ?? []);
        setError(null);
      } catch {
        if (!cancelled) setError('Could not load accuracy series.');
      }
    };
    void refresh();
    const onFocus = () => {
      if (!cancelled) void refresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [days]);

  // Roll-up stats above the chart — matches the structure of the focus-time
  // card (this-month / daily-avg / best-day) for visual consistency.
  const stats = useMemo(() => {
    if (!series) return null;
    let attempts = 0;
    let success = 0;
    let activeDays = 0;
    let bestDayAcc: number | null = null;
    let bestDayDate: string | null = null;
    for (const d of series) {
      attempts += d.total;
      success += d.success;
      if (d.total > 0) activeDays++;
      if (d.accuracy != null && d.total >= 3 && (bestDayAcc == null || d.accuracy > bestDayAcc)) {
        bestDayAcc = d.accuracy;
        bestDayDate = d.date;
      }
    }
    const overall = attempts > 0 ? success / attempts : null;
    return { attempts, success, activeDays, overall, bestDayAcc, bestDayDate };
  }, [series]);

  // The chart needs a numeric y-axis that recharts can plot. Empty days
  // (accuracy === null) become null in the data; recharts skips those.
  const chartData = useMemo(
    () =>
      (series ?? []).map((d) => ({
        date: d.date,
        accuracyPct: d.accuracy == null ? null : Math.round(d.accuracy * 100),
        total: d.total,
        success: d.success,
      })),
    [series],
  );

  return (
    <section
      className="space-y-4"
      style={{
        opacity: 0,
        animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 200ms forwards',
      }}
    >
      <div>
        <h2 className={SECTION_LABEL}>Practice accuracy</h2>
        <p className={SECTION_SUBLABEL + ' mt-1'}>
          Daily accuracy across all practice attempts, last {days} days.
        </p>
      </div>

      <div className={CARD}>
        {series === null ? (
          <p className="text-center py-10 text-[13px] text-on-surface-variant/40">Loading…</p>
        ) : error ? (
          <p className="text-center py-10 text-[13px] text-on-surface-variant/50">{error}</p>
        ) : stats && stats.attempts === 0 ? (
          <p className="text-center py-10 text-[13px] text-on-surface-variant/50">
            No practice attempts in the last {days} days.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 pb-5 mb-5 border-b border-white/[0.05]">
              <StatBlock
                label="Overall"
                value={fmtAccuracyPct(stats?.overall ?? null)}
                sub={
                  stats && stats.attempts > 0
                    ? `${stats.success} / ${stats.attempts} correct`
                    : undefined
                }
              />
              <StatBlock
                label="Active days"
                value={`${stats?.activeDays ?? 0}`}
                sub={`of ${days}`}
                faded
              />
              <StatBlock
                label="Best day"
                value={fmtAccuracyPct(stats?.bestDayAcc ?? null)}
                sub={stats?.bestDayDate ? fmtMonthDay(stats.bestDayDate) : '— need 3+ attempts'}
                faded
              />
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="practice-accuracy-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={`rgba(${ACCENT},0.32)`} />
                      <stop offset="100%" stopColor={`rgba(${ACCENT},0)`} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={32}
                    tickFormatter={fmtMonthDay}
                    tick={{
                      fill: 'rgba(255,255,255,0.45)',
                      fontSize: 11,
                      fontFamily: 'var(--font-jetbrains-mono)',
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickCount={5}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                    tick={{
                      fill: 'rgba(255,255,255,0.35)',
                      fontSize: 10,
                      fontFamily: 'var(--font-jetbrains-mono)',
                    }}
                    width={36}
                  />
                  <Tooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1 }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(16,18,22,0.96)',
                      color: '#fff',
                      padding: '8px 10px',
                      fontSize: 12,
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}
                    labelFormatter={(label) => fmtMonthDay(String(label))}
                    formatter={(_value, _name, item) => {
                      const total = (item?.payload as { total?: number } | undefined)?.total ?? 0;
                      const success =
                        (item?.payload as { success?: number } | undefined)?.success ?? 0;
                      const acc =
                        (item?.payload as { accuracyPct?: number | null } | undefined)
                          ?.accuracyPct;
                      return [
                        acc == null ? '—' : `${acc}% (${success}/${total})`,
                        'Accuracy',
                      ];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="accuracyPct"
                    stroke={`rgb(${ACCENT})`}
                    strokeWidth={2.2}
                    fill="url(#practice-accuracy-fill)"
                    connectNulls
                    dot={false}
                    activeDot={{
                      r: 3.5,
                      fill: `rgb(${ACCENT})`,
                      stroke: '#181c20',
                      strokeWidth: 2,
                    }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ── StatBlock — local copy to avoid pulling from ProgressDashboard ──── */

function StatBlock({
  label,
  value,
  sub,
  faded,
}: {
  label: string;
  value: string;
  sub?: string;
  faded?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-on-surface-variant/50">
        {label}
      </p>
      <p
        className="mt-1 text-[22px] font-semibold tabular-nums"
        style={{ color: faded ? 'rgba(255,255,255,0.7)' : '#fff' }}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[11px] text-on-surface-variant/45">{sub}</p>
      ) : null}
    </div>
  );
}
