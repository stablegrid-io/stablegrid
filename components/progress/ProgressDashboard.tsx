'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { ArrowRight } from 'lucide-react';
import type { ReadingSession, TopicProgress } from '@/types/progress';
import type { TrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';

interface ProgressDashboardProps {
  user: User;
  topicProgress: TopicProgress[];
  allSessions: ReadingSession[];
  trackMetaByTopic: TrackMetaByTopic;
  completedModulesByTopic: Record<string, string[]>;
  stats: { totalXp: number; currentStreak: number; questionsCompleted: number };
}

const TIER_LABELS: Record<string, string> = {
  junior: 'Junior · Core Foundation',
  mid: 'Mid · Advanced Transformations',
  senior: 'Senior · Cluster Tuning'
};

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatRelativeDate(iso: string | null | undefined, nowMs: number): string {
  if (!iso) return '—';
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return '—';
  const days = Math.floor((nowMs - ts) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function deriveTier(modulesDone: number): { slug: 'junior' | 'mid' | 'senior'; label: string } {
  if (modulesDone >= 20) return { slug: 'senior', label: 'Senior' };
  if (modulesDone >= 10) return { slug: 'mid', label: 'Mid' };
  return { slug: 'junior', label: 'Junior' };
}

const SectionLabel = ({ index, title }: { index: string; title: string }) => (
  <div className="flex items-baseline gap-4 mb-8 mt-4">
    <span className="font-data-mono uppercase text-[12px] tracking-wider text-on-surface-variant tabular-nums">
      § {index}
    </span>
    <span className="font-data-mono uppercase text-[12px] tracking-wider text-on-surface">
      {title}
    </span>
    <span className="flex-1 h-px bg-surface-dim" />
  </div>
);

const StatTile = ({
  label,
  value,
  unit,
  hint
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) => (
  <div className="border border-surface-dim bg-surface px-5 py-5">
    <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant block mb-3">
      {label}
    </span>
    <div className="flex items-baseline gap-1.5">
      <span className="font-data-mono tabular-nums text-[32px] sm:text-[40px] text-on-surface leading-none">
        {value}
      </span>
      {unit && (
        <span className="font-data-mono uppercase text-[12px] tracking-wider text-on-surface-variant">
          {unit}
        </span>
      )}
    </div>
    {hint && (
      <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant tabular-nums block mt-2">
        {hint}
      </span>
    )}
  </div>
);

export function ProgressDashboard({
  user,
  topicProgress,
  allSessions,
  trackMetaByTopic,
  completedModulesByTopic,
  stats
}: ProgressDashboardProps) {
  const nowMs = Date.now();

  // PySpark-only — pull the single topic record + module list
  const pyspark = topicProgress.find((tp) => tp.topic === 'pyspark') ?? null;
  const tracks = useMemo(() => trackMetaByTopic.pyspark ?? [], [trackMetaByTopic]);
  const completedSet = useMemo(
    () => new Set(completedModulesByTopic.pyspark ?? []),
    [completedModulesByTopic]
  );

  const totalModules = tracks.reduce((sum, t) => sum + t.moduleCount, 0);
  const modulesDone = tracks.reduce(
    (sum, t) => sum + t.moduleIds.filter((id) => completedSet.has(id)).length,
    0
  );

  const totalMinutes = pyspark?.theoryTotalMinutesRead ?? 0;
  const tier = deriveTier(modulesDone);

  // Practice accuracy
  const attempted = pyspark?.practiceQuestionsAttempted ?? 0;
  const correct = pyspark?.practiceQuestionsCorrect ?? 0;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  // 14-day reading bars — sum activeSeconds per day
  const dayBuckets = useMemo(() => {
    const today = startOfDay(new Date());
    const days: { key: string; date: Date; minutes: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY_MS);
      days.push({ key: dayKey(d), date: d, minutes: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.key, i]));
    allSessions.forEach((s) => {
      if (s.topic !== 'pyspark') return;
      const t = new Date(s.lastActiveAt ?? s.startedAt);
      const k = dayKey(t);
      const i = idx.get(k);
      if (i === undefined) return;
      days[i].minutes += Math.round((s.activeSeconds ?? 0) / 60);
    });
    return days;
  }, [allSessions]);

  const maxDayMinutes = Math.max(1, ...dayBuckets.map((d) => d.minutes));
  const totalLast14 = dayBuckets.reduce((sum, d) => sum + d.minutes, 0);

  // Recent sessions — last 5 by lastActiveAt
  const recentSessions = useMemo(() => {
    const moduleTitle = new Map<string, string>();
    tracks.forEach((t) =>
      t.modules.forEach((m) => moduleTitle.set(m.id, m.title.replace(/^module\s*\d+\s*[:.]?\s*/i, '')))
    );
    return [...allSessions]
      .filter((s) => s.topic === 'pyspark')
      .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        chapterTitle: moduleTitle.get(s.chapterId) ?? s.chapterId,
        chapterNumber: s.chapterNumber,
        lastActiveAt: s.lastActiveAt,
        minutes: Math.round((s.activeSeconds ?? 0) / 60),
        sectionsRead: s.sectionsRead ?? 0,
        sectionsTotal: s.sectionsTotal ?? 0,
        completed: s.isCompleted
      }));
  }, [allSessions, tracks]);

  return (
    <main className="bg-surface min-h-[calc(100dvh-4rem)] text-on-surface">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-14">
        {/* ── Masthead ──────────────────────────────────────────────── */}
        <header className="pb-5 mb-10 border-b-2 border-on-surface flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-1">
              Operator’s Log
            </span>
            <h1 className="font-h2 text-on-surface">
              {user.email ?? 'Operator'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant tabular-nums">
              Last entry · {formatRelativeDate(pyspark?.lastActivityAt ?? null, nowMs)}
            </span>
            <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-primary px-3 py-1.5 bg-primary border border-primary">
              {tier.label}
            </span>
          </div>
        </header>

        {/* ── Stat tiles ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-surface-dim border border-surface-dim mb-12">
          <div className="bg-surface">
            <StatTile
              label="Days active"
              value={stats.currentStreak.toString()}
              unit="streak"
              hint={stats.currentStreak === 0 ? 'No activity yet' : 'Consecutive days'}
            />
          </div>
          <div className="bg-surface">
            <StatTile
              label="Modules"
              value={modulesDone.toString()}
              unit={`/ ${totalModules}`}
              hint={`${Math.round((modulesDone / Math.max(1, totalModules)) * 100)}% complete`}
            />
          </div>
          <div className="bg-surface">
            <StatTile
              label="Time logged"
              value={formatHours(totalMinutes)}
              hint={
                totalMinutes > 0
                  ? `${(totalMinutes / 60).toFixed(1)} hours of focus`
                  : 'Start a session'
              }
            />
          </div>
          <div className="bg-surface">
            <StatTile
              label="Practice"
              value={attempted > 0 ? `${accuracy}%` : '—'}
              hint={
                attempted > 0
                  ? `${correct} correct of ${attempted}`
                  : 'No drills yet'
              }
            />
          </div>
        </div>

        {/* ── § 01 · Mission progress ───────────────────────────────── */}
        <section aria-labelledby="mission-title">
          <SectionLabel index="01" title="Curriculum mission" />
          <h2 id="mission-title" className="font-serif text-[28px] sm:text-[36px] leading-tight text-on-surface mb-3 max-w-[28ch]">
            Thirty modules, plotted in three tiers.
          </h2>
          <p className="font-body text-on-surface-variant max-w-[60ch] mb-10">
            Every cell is a module. Filled means complete; empty means still on
            the to-do board. Senior unlocks once Mid is read end-to-end.
          </p>

          <div className="flex flex-col gap-8">
            {tracks.map((track) => {
              const tierDone = track.moduleIds.filter((id) =>
                completedSet.has(id)
              ).length;
              return (
                <div key={track.slug}>
                  <div className="flex items-baseline justify-between gap-4 mb-3 pb-2 border-b border-surface-dim">
                    <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface">
                      {TIER_LABELS[track.slug] ?? track.label}
                    </span>
                    <span className="font-data-mono tabular-nums text-[13px] text-on-surface-variant">
                      {tierDone}
                      <span className="text-on-surface-variant"> / {track.moduleCount}</span>
                    </span>
                  </div>
                  <ol className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                    {track.modules.map((m, i) => {
                      const done = completedSet.has(m.id);
                      return (
                        <li key={m.id} className="aspect-square">
                          <Link
                            href={`/theory/${track.slug}?chapter=${m.id}`}
                            title={`Module ${i + 1} — ${m.title}`}
                            className={`flex items-center justify-center w-full h-full font-data-mono tabular-nums text-[11px] transition-colors ${
                              done
                                ? 'bg-on-surface text-on-primary border border-on-surface'
                                : 'border border-surface-dim text-on-surface-variant hover:border-on-surface hover:text-on-surface'
                            }`}
                          >
                            {(i + 1).toString().padStart(2, '0')}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── § 02 · Reading rhythm (14 days) ───────────────────────── */}
        <section aria-labelledby="rhythm-title" className="mt-16">
          <SectionLabel index="02" title="Reading rhythm" />
          <h2 id="rhythm-title" className="font-serif text-[28px] sm:text-[36px] leading-tight text-on-surface mb-3 max-w-[28ch]">
            The last fourteen days of focus.
          </h2>
          <p className="font-body text-on-surface-variant max-w-[60ch] mb-10">
            Bars show minutes spent in a reading session per day.{' '}
            <span className="text-on-surface">
              {formatHours(totalLast14)}
            </span>{' '}
            in the last two weeks.
          </p>

          <div
            role="img"
            aria-label="Reading minutes per day for the last 14 days"
            className="border border-surface-dim bg-surface p-6"
          >
            <div className="flex items-end gap-1.5 h-[160px]">
              {dayBuckets.map((d) => {
                const ratio = d.minutes / maxDayMinutes;
                const heightPct = Math.max(d.minutes > 0 ? 6 : 0, ratio * 100);
                return (
                  <div
                    key={d.key}
                    className="flex-1 flex flex-col items-center justify-end gap-2"
                  >
                    <span className="font-data-mono tabular-nums text-[9px] text-on-surface-variant">
                      {d.minutes > 0 ? d.minutes : ''}
                    </span>
                    <div
                      className={d.minutes > 0 ? 'w-full bg-on-surface' : 'w-full bg-surface-dim'}
                      style={{ height: `${heightPct}%`, minHeight: d.minutes > 0 ? 4 : 1 }}
                      title={`${d.minutes} min on ${d.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-surface-dim font-data-mono uppercase text-[9px] tracking-wider text-on-surface-variant tabular-nums">
              <span>14 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </section>

        {/* ── § 03 · Practice ─────────────────────────────────────── */}
        <section aria-labelledby="practice-title" className="mt-16">
          <SectionLabel index="03" title="Practice accuracy" />
          <h2 id="practice-title" className="font-serif text-[28px] sm:text-[36px] leading-tight text-on-surface mb-3 max-w-[28ch]">
            Server-graded. No partial credit.
          </h2>
          <p className="font-body text-on-surface-variant max-w-[60ch] mb-10">
            {attempted > 0
              ? `Across ${attempted.toLocaleString()} attempts, you've shipped the right answer ${correct.toLocaleString()} times.`
              : 'No drills attempted yet — open a practice set to start the ledger.'}
          </p>

          <div className="border border-surface-dim bg-surface p-6">
            <div className="flex items-baseline justify-between gap-6 mb-4">
              <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
                Accuracy
              </span>
              <span className="font-data-mono tabular-nums text-[36px] sm:text-[48px] text-on-surface leading-none">
                {attempted > 0 ? `${accuracy}%` : '—'}
              </span>
            </div>
            <div className="h-2 bg-surface-container-low border border-surface-dim relative overflow-hidden">
              {attempted > 0 && (
                <div
                  className="h-full bg-on-surface"
                  style={{ width: `${accuracy}%` }}
                />
              )}
            </div>
            <div className="flex items-baseline justify-between gap-6 mt-3 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant tabular-nums">
              <span>{correct} correct</span>
              <span>{attempted} attempted</span>
            </div>
          </div>
        </section>

        {/* ── § 04 · Recent log entries ───────────────────────────── */}
        <section aria-labelledby="entries-title" className="mt-16">
          <SectionLabel index="04" title="Recent log entries" />
          <h2 id="entries-title" className="font-serif text-[28px] sm:text-[36px] leading-tight text-on-surface mb-10 max-w-[28ch]">
            Last five sessions, latest first.
          </h2>

          {recentSessions.length === 0 ? (
            <div className="border border-surface-dim bg-surface p-10 text-center">
              <p className="font-body text-on-surface-variant max-w-[44ch] mx-auto mb-6">
                No sessions logged yet. Open a module and start a reading
                session to begin the log.
              </p>
              <Link
                href="/theory"
                className="inline-flex items-center gap-2 font-data-mono uppercase text-[11px] tracking-wider text-on-primary px-5 py-3 border border-primary bg-primary hover:bg-primary-dim hover:border-primary-dim transition-colors"
              >
                Open the curriculum <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </div>
          ) : (
            <ul className="border border-on-surface bg-surface">
              {recentSessions.map((s) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[64px_1fr_auto_auto] sm:grid-cols-[80px_1fr_auto_auto_auto] items-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 border-b border-surface-dim last:border-b-0"
                >
                  <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant tabular-nums">
                    {formatRelativeDate(s.lastActiveAt, nowMs)}
                  </span>
                  <span className="font-serif text-[15px] text-on-surface leading-snug truncate">
                    Module {s.chapterNumber} · {s.chapterTitle}
                  </span>
                  <span className="font-data-mono tabular-nums text-[12px] text-on-surface-variant whitespace-nowrap">
                    {s.sectionsRead}/{s.sectionsTotal}{' '}
                    <span className="hidden sm:inline">lessons</span>
                  </span>
                  <span className="font-data-mono tabular-nums text-[12px] text-on-surface whitespace-nowrap">
                    {formatHours(s.minutes)}
                  </span>
                  <span
                    className={`hidden sm:inline-flex font-data-mono uppercase text-[9px] tracking-wider px-2 py-0.5 border ${
                      s.completed
                        ? 'border-on-surface bg-on-surface text-on-primary'
                        : 'border-surface-dim text-on-surface-variant'
                    }`}
                  >
                    {s.completed ? 'Done' : 'Open'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Colophon ──────────────────────────────────────────── */}
        <footer className="mt-20 pt-6 border-t border-surface-dim flex flex-wrap justify-between gap-4 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
          <span>Operator’s log · stablegrid.io</span>
          <span>Stamped {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </footer>
      </div>
    </main>
  );
}
