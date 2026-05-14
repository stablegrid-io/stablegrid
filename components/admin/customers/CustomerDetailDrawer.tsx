'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, X } from 'lucide-react';
import type { Customer } from '@/components/admin/customers/types';
import { CustomersStatusBadge } from '@/components/admin/customers/CustomersStatusBadge';
import {
  formatCurrency,
  formatJoinedDate,
  formatKwh,
  formatPercent,
  formatProgressFraction,
  formatRelativeTime,
  isCustomerOnline,
  progressPercentValue
} from '@/components/admin/customers/utils';
import type { AdminCustomerProgressDetail } from '@/lib/admin/types';
import {
  ADMIN_DRAWER_SURFACE_CLASS,
  ADMIN_GHOST_BUTTON_CLASS,
  ADMIN_SECONDARY_SURFACE_CLASS,
} from '@/components/admin/theme';

const TRACK_LABEL: Record<'junior' | 'mid' | 'senior', string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior'
};

const ACTIVITY_SOURCE_LABEL: Record<string, string> = {
  'lesson-complete': 'Lesson read',
  'chapter-complete': 'Module complete',
  'practice-task-success': 'Practice task solved',
  'practice-module-complete': 'Practice module complete',
  'track-complete': 'Track complete',
  'checkpoint-pass': 'Checkpoint passed',
  'hint-unlock': 'Hint unlocked'
};

const formatActivitySource = (source: string) =>
  ACTIVITY_SOURCE_LABEL[source] ?? source.replace(/[-_]/g, ' ');

const StatTile = ({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className={`${ADMIN_SECONDARY_SURFACE_CLASS} p-4`}>
    <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
      {label}
    </p>
    <p className="mt-2 font-data-mono text-[15px] font-semibold text-on-surface tabular-nums">
      {value}
    </p>
    {hint ? (
      <p className="mt-1 font-body text-[11px] text-on-surface-variant">{hint}</p>
    ) : null}
  </div>
);

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const pct = progressPercentValue(current, total);
  return (
    <div
      className="mt-2 h-1.5 w-full bg-surface-container-low"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-primary transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const TrackCard = ({
  slug,
  modulesCompleted,
  modulesTotal,
  tasksSolved,
  tasksTotal,
  checkpointsPassed,
  checkpointsTotal
}: {
  slug: 'junior' | 'mid' | 'senior';
  modulesCompleted: number;
  modulesTotal: number;
  tasksSolved: number;
  tasksTotal: number;
  checkpointsPassed: number;
  checkpointsTotal: number;
}) => (
  <div className={`${ADMIN_SECONDARY_SURFACE_CLASS} p-4`}>
    <div className="flex items-baseline justify-between">
      <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
        {TRACK_LABEL[slug]}
      </p>
      <p className="font-data-mono text-[11px] tabular-nums text-on-surface-variant">
        {formatPercent(modulesCompleted, modulesTotal)}
      </p>
    </div>
    <p className="mt-2 font-data-mono text-[14px] font-semibold text-on-surface tabular-nums">
      {formatProgressFraction(modulesCompleted, modulesTotal)} modules
    </p>
    <ProgressBar current={modulesCompleted} total={modulesTotal} />
    <div className="mt-3 grid gap-1.5 text-[11px] text-on-surface-variant">
      <div className="flex justify-between font-data-mono tabular-nums">
        <span>Practice tasks</span>
        <span className="text-on-surface">
          {formatProgressFraction(tasksSolved, tasksTotal)}
        </span>
      </div>
      <div className="flex justify-between font-data-mono tabular-nums">
        <span>Checkpoints passed</span>
        <span className="text-on-surface">
          {formatProgressFraction(checkpointsPassed, checkpointsTotal)}
        </span>
      </div>
    </div>
  </div>
);

const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-surface-container-low ${className}`} />
);

export function CustomerDetailDrawer({
  customer,
  open,
  onClose,
}: {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<AdminCustomerProgressDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !customer) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    (async () => {
      try {
        const response = await fetch(`/api/admin/customers/${customer.id}/progress`, {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });
        const payload = (await response.json()) as
          | { data: AdminCustomerProgressDetail }
          | { error: string };
        if (cancelled) return;
        if (!response.ok || !('data' in payload)) {
          setError(
            'error' in payload && typeof payload.error === 'string'
              ? payload.error
              : 'Failed to load customer progress.'
          );
          return;
        }
        setDetail(payload.data);
      } catch (fetchError) {
        if (cancelled) return;
        setError(
          fetchError instanceof Error ? fetchError.message : 'Failed to load customer progress.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, open]);

  if (!open || !customer) {
    return null;
  }

  const reading = detail?.reading;
  const practice = detail?.practice;
  const account = detail?.account;
  const recent = detail?.recentActivity ?? [];

  const lastLessonHref =
    reading?.lastChapterId && reading?.lastLessonId
      ? `/learn/pyspark/theory/all?chapter=${encodeURIComponent(
          reading.lastChapterId
        )}&lesson=${encodeURIComponent(reading.lastLessonId)}`
      : null;

  return (
    <>
      <button
        type="button"
        aria-label="Close customer detail"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-on-surface/30 backdrop-blur-[1px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Customer detail"
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto p-6 ${ADMIN_DRAWER_SURFACE_CLASS}`}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-3">
            <p className="font-data-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">
              Customer detail
            </p>
            <h2 className="mt-3 flex items-center gap-2 truncate font-h2 text-2xl font-bold tracking-tight text-on-surface">
              <span className="truncate">{customer.fullName}</span>
              {isCustomerOnline(customer.lastActiveAt) ? (
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#4ade80]/15 px-2 py-0.5 font-data-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#16a34a]"
                  title="Active within the last 5 minutes"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                  Online
                </span>
              ) : null}
            </h2>
            <p className="mt-1.5 truncate font-body text-[14px] text-on-surface-variant">
              {customer.email}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CustomersStatusBadge status={customer.status} />
              <span className="font-data-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
                Joined {formatJoinedDate(customer.joinedAt)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${ADMIN_GHOST_BUTTON_CLASS} h-9 w-9 justify-center px-0`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Top-line stat row ─────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatTile
            label="Theory"
            value={formatProgressFraction(customer.theoryModulesCompleted, customer.theoryModulesTotal)}
            hint={`${formatPercent(customer.theoryModulesCompleted, customer.theoryModulesTotal)} of modules`}
          />
          <StatTile
            label="Lessons read"
            value={formatProgressFraction(customer.lessonsCompleted, customer.lessonsTotal)}
            hint={`${formatPercent(customer.lessonsCompleted, customer.lessonsTotal)} of lessons`}
          />
          <StatTile
            label="Practice"
            value={formatProgressFraction(customer.practiceTasksSolved, customer.practiceTasksTotal)}
            hint={`${formatPercent(customer.practiceTasksSolved, customer.practiceTasksTotal)} of tasks`}
          />
          <StatTile label="kWh" value={formatKwh(customer.kwhTotal)} />
          <StatTile
            label="Last active"
            value={formatRelativeTime(customer.lastActiveAt)}
          />
        </div>

        {error ? (
          <div className="mt-6 border border-error/40 bg-error-container/40 p-3 font-body text-[12px] text-error">
            {error}
          </div>
        ) : null}

        {/* ── Per-track breakdown ──────────────────────────────────────── */}
        <section className="mt-6">
          <h3 className="font-data-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant mb-3">
            By track
          </h3>
          {loading || !detail ? (
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonBlock key={idx} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              {detail.perTrack.map((entry) => (
                <TrackCard key={entry.slug} {...entry} />
              ))}
            </div>
          )}
        </section>

        {/* ── Reading section ──────────────────────────────────────────── */}
        {reading ? (
          <section className="mt-6">
            <h3 className="font-data-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant mb-3">
              Reading
            </h3>
            <div className={`${ADMIN_SECONDARY_SURFACE_CLASS} p-4 space-y-3`}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                    Sections read
                  </p>
                  <p className="mt-1 font-data-mono text-[14px] font-semibold text-on-surface tabular-nums">
                    {formatProgressFraction(reading.sectionsRead, reading.sectionsTotal)}
                  </p>
                </div>
                <div>
                  <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                    Minutes read
                  </p>
                  <p className="mt-1 font-data-mono text-[14px] font-semibold text-on-surface tabular-nums">
                    {reading.minutesRead.toLocaleString()}
                  </p>
                </div>
              </div>
              {lastLessonHref ? (
                <Link
                  href={lastLessonHref}
                  className="inline-flex items-center gap-1.5 font-data-mono text-[11px] uppercase tracking-[0.14em] text-primary hover:underline"
                >
                  Jump to last lesson
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <p className="font-data-mono text-[11px] text-on-surface-variant">
                  No recent lesson cursor.
                </p>
              )}
            </div>
          </section>
        ) : null}

        {/* ── Practice section ─────────────────────────────────────────── */}
        {practice ? (
          <section className="mt-6">
            <h3 className="font-data-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant mb-3">
              Practice
            </h3>
            <div className={`${ADMIN_SECONDARY_SURFACE_CLASS} p-4`}>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
                <div className="flex justify-between font-data-mono tabular-nums">
                  <span className="text-on-surface-variant">Tasks solved</span>
                  <span className="text-on-surface">{practice.tasksSolved}</span>
                </div>
                <div className="flex justify-between font-data-mono tabular-nums">
                  <span className="text-on-surface-variant">Tasks attempted</span>
                  <span className="text-on-surface">{practice.tasksAttempted}</span>
                </div>
                <div className="flex justify-between font-data-mono tabular-nums">
                  <span className="text-on-surface-variant">Modules complete</span>
                  <span className="text-on-surface">{practice.modulesCompleted}</span>
                </div>
                <div className="flex justify-between font-data-mono tabular-nums">
                  <span className="text-on-surface-variant">kWh (payouts)</span>
                  <span className="text-on-surface">{practice.kwhFromPayouts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-data-mono tabular-nums">
                  <span className="text-on-surface-variant">Hints unlocked</span>
                  <span className="text-on-surface">{practice.hintsUnlocked}</span>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── Account section ──────────────────────────────────────────── */}
        {account ? (
          <section className="mt-6">
            <h3 className="font-data-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant mb-3">
              Account
            </h3>
            <div className={`${ADMIN_SECONDARY_SURFACE_CLASS} p-4`}>
              <div className="grid gap-y-2 text-[12px]">
                <div className="flex justify-between font-data-mono">
                  <span className="text-on-surface-variant">Last sign-in</span>
                  <span className="text-on-surface tabular-nums">
                    {formatRelativeTime(account.lastSignInAt)}
                  </span>
                </div>
                <div className="flex justify-between font-data-mono">
                  <span className="text-on-surface-variant">Email confirmed</span>
                  <span className="text-on-surface tabular-nums">
                    {account.emailConfirmedAt
                      ? formatJoinedDate(account.emailConfirmedAt)
                      : 'No'}
                  </span>
                </div>
                <div className="flex justify-between font-data-mono">
                  <span className="text-on-surface-variant">Plan</span>
                  <span className="text-on-surface">
                    {account.plan ?? '—'}
                    {account.subscriptionStatus
                      ? ` · ${account.subscriptionStatus}`
                      : ''}
                  </span>
                </div>
                <div className="flex justify-between font-data-mono">
                  <span className="text-on-surface-variant">Orders</span>
                  <span className="text-on-surface tabular-nums">{customer.orders}</span>
                </div>
                <div className="flex justify-between font-data-mono">
                  <span className="text-on-surface-variant">Total spent</span>
                  <span className="text-on-surface tabular-nums">
                    {formatCurrency(customer.totalSpent)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── Recent activity ──────────────────────────────────────────── */}
        <section className="mt-6">
          <h3 className="font-data-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant mb-3">
            Recent activity
          </h3>
          {loading && !detail ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonBlock key={idx} className="h-9" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="font-body text-[12px] text-on-surface-variant">
              No tracked activity yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {recent.map((event, idx) => (
                <li
                  key={`${event.timestamp}-${idx}`}
                  className="flex items-baseline justify-between gap-3 border-b border-surface-dim/60 pb-1.5 text-[12px]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-on-surface">
                      {event.label ?? formatActivitySource(event.source)}
                    </p>
                    <p className="font-data-mono text-[10px] text-on-surface-variant">
                      {formatActivitySource(event.source)}
                    </p>
                  </div>
                  <div className="text-right font-data-mono tabular-nums">
                    {event.units !== null ? (
                      <p className="text-on-surface">
                        +{Math.round(event.units).toLocaleString()} kWh
                      </p>
                    ) : null}
                    <p className="text-[10px] text-on-surface-variant">
                      {formatRelativeTime(event.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </>
  );
}
