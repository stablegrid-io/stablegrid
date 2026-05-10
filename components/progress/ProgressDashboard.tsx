'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { ArrowRight } from 'lucide-react';
import type { ReadingSession, TopicProgress } from '@/types/progress';
import type {
  TrackMetaByTopic,
  TrackMetaSummary,
} from '@/lib/learn/theoryTrackMeta';
import {
  CAPABILITY_AREAS,
  CAPABILITIES,
  type CapabilityTier,
} from '@/lib/learn/capabilityTaxonomy';

interface PracticeModuleSummary {
  moduleId: string;
  family: 'modules' | 'fundamentals';
  title: string;
  totalTasks: number;
  tasksSolved: number;
  tasksAttempted: number;
  href: string;
}

interface ProgressDashboardProps {
  user: User;
  topicProgress: TopicProgress[];
  allSessions: ReadingSession[];
  trackMetaByTopic: TrackMetaByTopic;
  completedModulesByTopic: Record<string, string[]>;
  practiceByTier?: Record<'junior' | 'mid' | 'senior', PracticeModuleSummary[]>;
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

/**
 * Capability map — a 7×3 grid where each cell answers "what can I do?".
 *
 * Rows are skill *areas* operators describe their day in (joins, plans,
 * memory, streaming, …). Columns are tier (Junior / Mid / Senior). Each
 * cell is one verb-led capability statement, plus its state:
 *
 *   ○  locked       — neither the chapter nor the drill is done
 *   ◐  read         — chapter read, drill not yet solved
 *   ●  drilled      — both chapter read and drill fully solved
 *
 * The taxonomy lives in `lib/learn/capabilityTaxonomy.ts`; this component
 * is purely presentation. Empty cells (e.g. plans aren't introduced until
 * Mid) render as muted hairline placeholders so the grid stays rectangular
 * without implying a missing skill.
 */
interface CapabilityMapProps {
  tracks: TrackMetaSummary[];
  completedSet: Set<string>;
  /** Optional practice progress — `moduleId → { tasksSolved, totalTasks }`. */
  practiceProgress?: Map<string, { tasksSolved: number; totalTasks: number }>;
}

const TIER_ORDER = ['junior', 'mid', 'senior'] as const;
type TierSlug = (typeof TIER_ORDER)[number];

function CapabilityMap({ tracks, completedSet, practiceProgress }: CapabilityMapProps) {
  void tracks; // tracks unused in the grid view; kept on the prop type for backwards compat
  type CellState = 'locked' | 'read' | 'drilled' | 'empty';

  const cells = useMemo(() => {
    const lookup = new Map<string, { tasksSolved: number; totalTasks: number }>(
      practiceProgress ?? [],
    );
    return CAPABILITY_AREAS.map((area) => {
      const row: Array<{
        tier: CapabilityTier;
        state: CellState;
        statement: string | null;
        chapterIds: string[];
        practiceModuleIds: string[];
        href: string;
      }> = [];
      TIER_ORDER.forEach((tier) => {
        const cap = CAPABILITIES.find((c) => c.area === area.id && c.tier === tier);
        if (!cap || !cap.statement) {
          row.push({
            tier,
            state: 'empty',
            statement: null,
            chapterIds: [],
            practiceModuleIds: [],
            href: '#',
          });
          return;
        }
        const isRead = cap.chapterIds.some((id) => completedSet.has(id));
        const isDrilled =
          (cap.practiceModuleIds ?? []).some((id) => {
            const p = lookup.get(id);
            return p && p.totalTasks > 0 && p.tasksSolved >= p.totalTasks;
          });
        const state: CellState = isDrilled ? 'drilled' : isRead ? 'read' : 'locked';
        // Open the first chapter; if none, fall back to the first practice module.
        const firstChapter = cap.chapterIds[0];
        const href = firstChapter
          ? `/theory/${tier}?chapter=${firstChapter}`
          : '#';
        row.push({
          tier,
          state,
          statement: cap.statement,
          chapterIds: cap.chapterIds,
          practiceModuleIds: cap.practiceModuleIds ?? [],
          href,
        });
      });
      return { area, row };
    });
  }, [completedSet, practiceProgress]);

  const totals = useMemo(() => {
    let read = 0;
    let drilled = 0;
    let total = 0;
    cells.forEach(({ row }) => {
      row.forEach((c) => {
        if (c.state === 'empty') return;
        total++;
        if (c.state === 'read' || c.state === 'drilled') read++;
        if (c.state === 'drilled') drilled++;
      });
    });
    return { read, drilled, total };
  }, [cells]);

  const STATE_GLYPH: Record<CellState, string> = {
    locked: '○',
    read: '◐',
    drilled: '●',
    empty: '',
  };

  return (
    <div className="border border-on-surface bg-surface">
      {/* Header strip — totals + legend, matches the section's masthead vibe. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-5 py-4 border-b border-surface-dim">
        <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant tabular-nums">
          {totals.read} / {totals.total} unlocked
          <span className="text-on-surface-variant/60"> · </span>
          {totals.drilled} drilled
        </span>
        <span className="flex items-center gap-4 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="text-on-surface-variant">○</span> locked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-on-surface">◐</span> read
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-primary">●</span> drilled
          </span>
        </span>
      </div>

      {/* Tier column headers. */}
      <div className="hidden md:grid grid-cols-[180px_repeat(3,minmax(0,1fr))] border-b border-surface-dim bg-surface-container-low">
        <span /> {/* spacer above area labels */}
        {TIER_ORDER.map((tier) => (
          <span
            key={tier}
            className="px-4 py-2.5 font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface border-l border-surface-dim"
          >
            {tier}
          </span>
        ))}
      </div>

      {/* Mobile body — one card per area, three tier rows stacked inside.
          The desktop tier-grid (3-col by area) doesn't translate to phones:
          empty tier cells become awkward stacked blocks, and statement text
          can't share a row at 360px. The mobile layout keeps the same data
          but presents it as readable per-area cards with inline tier
          labels, so a phone reader still sees "Foundations · Junior =
          read · build a DataFrame…" without horizontal squeeze. */}
      <div className="md:hidden flex flex-col">
        {cells.map(({ area, row }, areaIdx) => {
          const renderable = row.filter((c) => c.state !== 'empty');
          if (renderable.length === 0) return null;
          return (
            <div
              key={area.id}
              className={areaIdx > 0 ? 'border-t border-surface-dim' : ''}
            >
              <div className="px-4 py-3 bg-surface-container-low border-b border-surface-dim">
                <p className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface mb-1">
                  {area.label}
                </p>
                <p className="font-body text-[12px] leading-snug text-on-surface-variant">
                  {area.blurb}
                </p>
              </div>
              <ul className="flex flex-col">
                {renderable.map((cell) => {
                  const isLocked = cell.state === 'locked';
                  const isDrilled = cell.state === 'drilled';
                  const isRead = cell.state === 'read';
                  const cellBg = isDrilled
                    ? 'bg-primary/[0.06]'
                    : isRead
                      ? 'bg-surface'
                      : 'bg-surface-container-low/60';
                  const accentBorder = isDrilled
                    ? 'border-l-[3px] border-l-primary'
                    : isRead
                      ? 'border-l-[3px] border-l-on-surface'
                      : 'border-l-[3px] border-l-transparent';
                  const tagClass = isDrilled
                    ? 'border-primary text-primary'
                    : isRead
                      ? 'border-on-surface text-on-surface'
                      : 'border-on-surface-variant/30 text-on-surface-variant/60';
                  const tagLabel = isDrilled ? 'Drilled' : isRead ? 'Read' : 'Locked';
                  return (
                    <li key={cell.tier}>
                      <Link
                        href={cell.href}
                        className={`flex flex-col gap-1.5 px-4 py-3 border-b border-surface-dim/60 last:border-b-0 ${cellBg} ${accentBorder}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-data-mono uppercase text-[10px] tracking-[0.16em] text-on-surface-variant">
                            {cell.tier}
                          </span>
                          <span
                            className={`font-data-mono uppercase text-[9px] tracking-[0.18em] px-1.5 py-0.5 border ${tagClass}`}
                          >
                            {tagLabel}
                          </span>
                        </div>
                        <span
                          className={`font-body text-[13px] leading-snug ${
                            isLocked
                              ? 'text-on-surface-variant/55 line-through decoration-on-surface-variant/30 decoration-1'
                              : isDrilled
                                ? 'text-on-surface font-medium'
                                : 'text-on-surface'
                          }`}
                        >
                          {cell.statement}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Desktop body — area row labels on the left, three cells across. */}
      <div className="hidden md:flex flex-col">
        {cells.map(({ area, row }, areaIdx) => (
          <div
            key={area.id}
            className={`grid grid-cols-[180px_repeat(3,minmax(0,1fr))] ${
              areaIdx > 0 ? 'border-t border-surface-dim' : ''
            }`}
          >
            <div className="px-4 py-4 bg-surface-container-low border-r border-surface-dim">
              <p className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface mb-1">
                {area.label}
              </p>
              <p className="font-body text-[12px] leading-snug text-on-surface-variant">
                {area.blurb}
              </p>
            </div>

            {row.map((cell) => {
              if (cell.state === 'empty') {
                return (
                  <div
                    key={cell.tier}
                    aria-hidden
                    className="px-4 py-4 bg-surface-container-low/40 border-l border-surface-dim"
                  >
                    <span className="font-data-mono text-[10px] tracking-wider text-on-surface-variant/40">
                      —
                    </span>
                  </div>
                );
              }
              const isLocked = cell.state === 'locked';
              const isDrilled = cell.state === 'drilled';
              const isRead = cell.state === 'read';
              // Three loud visual states so the grid scans like a checklist:
              //   locked  — washed warm-paper bg, text muted, no left accent
              //   read    — ink-on-cream + ink left accent stripe + READ tag
              //   drilled — vermillion wash, vermillion left stripe, vermillion ●,
              //             DRILLED tag in primary so completed cells "pop" first
              const cellBg = isDrilled
                ? 'bg-primary/[0.06] hover:bg-primary/[0.10]'
                : isRead
                  ? 'bg-surface hover:bg-surface-container-low'
                  : 'bg-surface-container-low/60 hover:bg-surface-container-low';
              const accentBorder = isDrilled
                ? 'border-l-[3px] border-l-primary'
                : isRead
                  ? 'border-l-[3px] border-l-on-surface'
                  : 'border-l-[3px] border-l-transparent';
              const tagClass = isDrilled
                ? 'border-primary text-primary'
                : isRead
                  ? 'border-on-surface text-on-surface'
                  : 'border-on-surface-variant/30 text-on-surface-variant/60';
              const tagLabel = isDrilled ? 'Drilled' : isRead ? 'Read' : 'Locked';
              return (
                <Link
                  key={cell.tier}
                  href={cell.href}
                  className={`group flex flex-col gap-2 px-4 py-4 transition-colors border-l border-surface-dim ${cellBg} ${accentBorder}`}
                  title={
                    isDrilled
                      ? 'Read & drilled'
                      : isRead
                        ? 'Read · drill not yet solved'
                        : 'Locked — read the chapter to unlock'
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-data-mono text-[16px] leading-none ${
                        isDrilled
                          ? 'text-primary'
                          : isRead
                            ? 'text-on-surface'
                            : 'text-on-surface-variant/40'
                      }`}
                      aria-hidden
                    >
                      {STATE_GLYPH[cell.state]}
                    </span>
                    <span
                      className={`font-data-mono uppercase text-[9px] tracking-[0.18em] px-1.5 py-0.5 border ${tagClass}`}
                    >
                      {tagLabel}
                    </span>
                  </div>
                  <span
                    className={`font-body text-[13px] leading-snug ${
                      isLocked
                        ? 'text-on-surface-variant/55 line-through decoration-on-surface-variant/30 decoration-1 group-hover:text-on-surface-variant group-hover:decoration-on-surface-variant/50'
                        : isDrilled
                          ? 'text-on-surface font-medium'
                          : 'text-on-surface'
                    }`}
                  >
                    {cell.statement}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}


export function ProgressDashboard({
  user,
  topicProgress,
  allSessions,
  trackMetaByTopic,
  completedModulesByTopic,
  practiceByTier,
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

  // Flatten the per-tier practice list into a moduleId → progress lookup
  // so the capability map can ask "is this drill solved?" without iterating.
  const practiceProgressMap = useMemo(() => {
    const map = new Map<string, { tasksSolved: number; totalTasks: number }>();
    if (!practiceByTier) return map;
    (['junior', 'mid', 'senior'] as const).forEach((tier) => {
      practiceByTier[tier].forEach((p) => {
        map.set(p.moduleId, { tasksSolved: p.tasksSolved, totalTasks: p.totalTasks });
      });
    });
    return map;
  }, [practiceByTier]);

  const totalMinutes = pyspark?.theoryTotalMinutesRead ?? 0;
  const tier = deriveTier(modulesDone);

  // Practice — derived from per-module practice_task_attempts (the table
  // that's actually written to today). The legacy
  // topic_progress.practice_questions_* columns aren't populated for the new
  // PS/PM/PX + FND tracks, so reading them showed 0/0 even when the user had
  // solved tasks. We sum across every module the user has touched instead.
  const practiceTotals = useMemo(() => {
    let solved = 0;
    let attempted = 0;
    let totalAvailable = 0;
    let modulesTouched = 0;
    let modulesCleared = 0;
    if (practiceByTier) {
      (['junior', 'mid', 'senior'] as const).forEach((tier) => {
        practiceByTier[tier].forEach((p) => {
          solved += p.tasksSolved;
          attempted += p.tasksAttempted;
          totalAvailable += p.totalTasks;
          if (p.tasksAttempted > 0) modulesTouched++;
          if (p.totalTasks > 0 && p.tasksSolved >= p.totalTasks) modulesCleared++;
        });
      });
    }
    return { solved, attempted, totalAvailable, modulesTouched, modulesCleared };
  }, [practiceByTier]);
  const attempted = practiceTotals.attempted;
  const correct = practiceTotals.solved;
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

  // Each section is its own full-width band so /stats reads as a sequence
  // of distinct spreads (masthead → capability → rhythm → practice → log).
  // Tones alternate between cream (`bg-surface`) and warm-paper
  // (`bg-surface-container-low`) so the reader feels page-flips, with each
  // band carrying a top hairline that sells the break.
  const BAND_BASE = 'border-t border-surface-dim';
  const BAND_INNER =
    'max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16';

  return (
    <main className="bg-surface min-h-[calc(100dvh-4rem)] text-on-surface">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pt-10 lg:pt-14 pb-12">
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
      </div>

      {/* ── § 01 · Capability map (band: cream) ───────────────────────── */}
      <div className={`${BAND_BASE} bg-surface`}>
        <div className={BAND_INNER}>
        <section aria-labelledby="mission-title">
          <SectionLabel index="01" title="Capability map" />
          <h2 id="mission-title" className="font-serif text-[28px] sm:text-[36px] leading-tight text-on-surface mb-3 max-w-[28ch]">
            What you can already do.
          </h2>
          <p className="font-body text-on-surface-variant max-w-[64ch] mb-10">
            Seven skill areas down the side, three tiers across. Each cell is
            a verb — a concrete thing you can do once you’ve read the chapter
            (◐) and cemented it in the matching drill (●). Empty cells are
            tier gaps in the curriculum, not gaps in you. Click any cell to
            open its chapter.
          </p>

          <CapabilityMap
            tracks={tracks}
            completedSet={completedSet}
            practiceProgress={practiceProgressMap}
          />

        </section>
        </div>
      </div>

      {/* ── § 02 · Reading rhythm (band: warm paper) ─────────────────── */}
      <div className={`${BAND_BASE} bg-surface-container-low`}>
        <div className={BAND_INNER}>
        <section aria-labelledby="rhythm-title">
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

          {(() => {
            // Round the y-axis up to the next "nice" number so ticks always
            // land on clean values (5, 10, 15, 30, 60, 90, 120, …) instead of
            // an arbitrary peak. With only a few minutes logged this gives
            // the bar real height and a meaningful scale.
            const niceMax = (raw: number): number => {
              if (raw <= 0) return 10;
              const candidates = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480];
              for (const c of candidates) if (raw <= c) return c;
              return Math.ceil(raw / 60) * 60;
            };
            const yMax = niceMax(maxDayMinutes);
            // Five ticks (0, 25%, 50%, 75%, 100%) — readable without
            // crowding the bars. Top-down so the rendered order matches
            // the y-axis (max at top).
            const tickFractions = [1, 0.75, 0.5, 0.25, 0];
            const ticks = tickFractions.map((f) => ({
              fraction: f,
              value: Math.round(yMax * f),
            }));

            return (
              <div
                role="img"
                aria-label={`Reading minutes per day for the last 14 days, scaled to ${yMax} min`}
                className="border border-surface-dim bg-surface p-6"
              >
                <div className="flex items-stretch gap-3 h-[200px]">
                  {/* Y-axis labels — column on the left, top-down. Each
                      label sits flush against its tick gridline so the
                      reader can read a bar's value without hovering. */}
                  <div className="relative w-9 shrink-0 font-data-mono tabular-nums text-[10px] text-on-surface-variant">
                    {ticks.map((t) => (
                      <span
                        key={t.fraction}
                        className="absolute right-1 -translate-y-1/2"
                        style={{ top: `${(1 - t.fraction) * 100}%` }}
                      >
                        {t.value}
                      </span>
                    ))}
                  </div>

                  {/* Plot area — bars sit on a background of horizontal
                      gridlines drawn at each tick fraction. */}
                  <div className="relative flex-1">
                    {/* Gridlines */}
                    <div className="absolute inset-0 pointer-events-none">
                      {ticks.map((t) => (
                        <div
                          key={t.fraction}
                          className={`absolute left-0 right-0 ${
                            t.fraction === 0 ? 'h-px bg-on-surface/30' : 'h-px bg-surface-dim'
                          }`}
                          style={{ top: `${(1 - t.fraction) * 100}%` }}
                        />
                      ))}
                    </div>

                    {/* Bars — items-stretch (the default) so each column
                        inherits the full chart height; bars then resolve
                        their `height: %` against that height. (Previous
                        `items-end` collapsed columns to intrinsic size,
                        which made every bar render as a thin sliver.) */}
                    <div className="relative h-full flex gap-1.5">
                      {dayBuckets.map((d) => {
                        const ratio = Math.min(1, d.minutes / yMax);
                        const heightPct = Math.max(d.minutes > 0 ? 4 : 0, ratio * 100);
                        return (
                          <div
                            key={d.key}
                            className="flex-1 h-full flex flex-col items-center justify-end gap-2"
                          >
                            <span className="font-data-mono tabular-nums text-[9px] text-on-surface-variant">
                              {d.minutes > 0 ? d.minutes : ''}
                            </span>
                            <div
                              className={d.minutes > 0 ? 'w-full bg-on-surface' : 'w-full bg-surface-dim/60'}
                              style={{ height: `${heightPct}%`, minHeight: d.minutes > 0 ? 4 : 1 }}
                              title={`${d.minutes} min on ${d.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-surface-dim font-data-mono uppercase text-[9px] tracking-wider text-on-surface-variant tabular-nums">
                  <span className="ml-12">14 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            );
          })()}
        </section>
        </div>
      </div>

      {/* ── § 03 · Practice (band: cream) ────────────────────────────── */}
      <div className={`${BAND_BASE} bg-surface`}>
        <div className={BAND_INNER}>
        <section aria-labelledby="practice-title">
          <SectionLabel index="03" title="Practice accuracy" />
          <h2 id="practice-title" className="font-serif text-[28px] sm:text-[36px] leading-tight text-on-surface mb-3 max-w-[28ch]">
            Server-graded. No partial credit.
          </h2>
          <p className="font-body text-on-surface-variant max-w-[60ch] mb-10">
            {attempted > 0
              ? `Across ${attempted.toLocaleString()} attempts, you’ve shipped the right answer ${correct.toLocaleString()} times — ${practiceTotals.modulesCleared} modules cleared end-to-end.`
              : 'No drills attempted yet — open a practice set to start the ledger.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-surface-dim border border-surface-dim">
            {/* Accuracy panel — % correct of attempted, with the inline bar. */}
            <div className="bg-surface p-6">
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

            {/* Tasks solved panel — absolute count of tasks the user has
                shipped, against the total available across all modules. */}
            <div className="bg-surface p-6">
              <div className="flex items-baseline justify-between gap-6 mb-4">
                <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
                  Tasks solved
                </span>
                <span className="font-data-mono tabular-nums text-[36px] sm:text-[48px] text-on-surface leading-none">
                  {practiceTotals.solved}
                </span>
              </div>
              <div className="h-2 bg-surface-container-low border border-surface-dim relative overflow-hidden">
                {practiceTotals.totalAvailable > 0 && (
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (practiceTotals.solved / practiceTotals.totalAvailable) * 100,
                        ),
                      )}%`,
                    }}
                  />
                )}
              </div>
              <div className="flex items-baseline justify-between gap-6 mt-3 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant tabular-nums">
                <span>of {practiceTotals.totalAvailable} available</span>
                <span>
                  {practiceTotals.totalAvailable > 0
                    ? `${Math.round((practiceTotals.solved / practiceTotals.totalAvailable) * 100)}%`
                    : '—'}
                </span>
              </div>
            </div>

            {/* Modules cleared panel — count of practice modules where every
                task is solved. The headline outcome the operator is after. */}
            <div className="bg-surface p-6">
              <div className="flex items-baseline justify-between gap-6 mb-4">
                <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
                  Modules cleared
                </span>
                <span className="font-data-mono tabular-nums text-[36px] sm:text-[48px] text-on-surface leading-none">
                  {practiceTotals.modulesCleared}
                </span>
              </div>
              <div className="h-2 bg-surface-container-low border border-surface-dim relative overflow-hidden">
                {practiceTotals.modulesTouched > 0 && (
                  <div
                    className="h-full bg-on-surface"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (practiceTotals.modulesCleared /
                            Math.max(1, practiceTotals.modulesTouched)) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                )}
              </div>
              <div className="flex items-baseline justify-between gap-6 mt-3 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant tabular-nums">
                <span>{practiceTotals.modulesTouched} started</span>
                <span>
                  {practiceTotals.modulesTouched > 0
                    ? `${Math.round((practiceTotals.modulesCleared / practiceTotals.modulesTouched) * 100)}% finished`
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </section>
        </div>
      </div>

      {/* ── § 04 · Recent log entries (band: warm paper) ─────────────── */}
      <div className={`${BAND_BASE} bg-surface-container-low`}>
        <div className={BAND_INNER}>
        <section aria-labelledby="entries-title">
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
        </div>
      </div>

      {/* ── Colophon (band: cream) ────────────────────────────────── */}
      <div className={`${BAND_BASE} bg-surface`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-6">
          <footer className="flex flex-wrap justify-between gap-4 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
            <span>Operator’s log · stablegrid.io</span>
            <span>Stamped {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
