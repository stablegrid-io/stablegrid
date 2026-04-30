'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronDown, Lock } from 'lucide-react';
import { StableGridMark } from '@/components/brand/StableGridLogo';
import { getCodingTopic } from '@/lib/practice/codingTopics';
import {
  getPracticeTopicTiers,
  type PracticeTier,
  type PracticeTopicTierEntry,
} from '@/lib/practice/topicTierMap';
import { getPracticeSet } from '@/data/operations/practice-sets';

/* ── Per-tier visual config ─────────────────────────────────────────────────── */

const TIER = [
  {
    slug: 'junior' as PracticeTier,
    color: '#99f7ff',
    rgb: '153,247,255',
    label: 'JUNIOR',
    subtitle: 'FOUNDATIONAL TASKS',
    xp: '1.0X',
  },
  {
    slug: 'mid' as PracticeTier,
    color: '#ffc965',
    rgb: '255,201,101',
    label: 'MID',
    subtitle: 'ADVANCED PATTERNS',
    xp: '1.5X',
  },
  {
    slug: 'senior' as PracticeTier,
    color: '#ff716c',
    rgb: '255,113,108',
    label: 'SENIOR',
    subtitle: 'PLATFORM SCENARIOS',
    xp: '3.0X',
  },
] as const;

interface CodingTopicTiersProps {
  topicId: string;
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export function CodingTopicTiers({ topicId }: CodingTopicTiersProps) {
  // Look up topic + tiers up-front, but DO NOT early-return before the
  // hooks below — rules-of-hooks requires every hook to run on every
  // render. The render path handles a missing topic at the bottom.
  const topic = getCodingTopic(topicId);
  const tiers = useMemo(
    () => (topic ? getPracticeTopicTiers(topic.id) : {}),
    [topic],
  );

  // Resolve real tasks (id + title) from each tier's practice set so the
  // Mastery panel renders matching IDs that the API can correlate against.
  const resolvedTiers = useMemo(() => {
    const out: Partial<
      Record<
        PracticeTier,
        {
          entry: PracticeTopicTierEntry;
          moduleId: string;
          tasks: Array<{ id: string; title: string }>;
        }
      >
    > = {};
    (Object.keys(tiers) as PracticeTier[]).forEach((slug) => {
      const entry = tiers[slug];
      if (!entry) return;
      const set = getPracticeSet(entry.language, entry.practiceSetId);
      if (!set) return;
      out[slug] = {
        entry,
        moduleId: set.metadata.moduleId,
        tasks: set.tasks.map((t) => ({ id: t.id, title: t.title })),
      };
    });
    return out;
  }, [tiers]);

  // Per-task best result per tier, indexed by moduleId.
  // Shape: moduleId → taskId → 'success' | 'failure' | 'self_review'
  const [progressByModule, setProgressByModule] = useState<
    Record<string, Record<string, 'success' | 'failure' | 'self_review'>>
  >({});

  const moduleIds = useMemo(
    () =>
      Object.values(resolvedTiers)
        .map((t) => t?.moduleId)
        .filter((id): id is string => Boolean(id)),
    [resolvedTiers],
  );
  const moduleIdsKey = moduleIds.join(',');

  // Hoisted fetch so we can call it on mount AND on focus/visibility — when
  // the user finishes a practice set in another tab and switches back, the
  // Mastery panel updates automatically instead of staying stuck on the
  // mount-time snapshot.
  const refresh = useMemo(() => {
    return async () => {
      if (moduleIds.length === 0) return;
      const entries = await Promise.all(
        moduleIds.map(async (moduleId) => {
          try {
            const res = await fetch(
              `/api/operations/practice/task-attempt?moduleId=${encodeURIComponent(moduleId)}`,
              { credentials: 'same-origin' },
            );
            if (!res.ok) return [moduleId, {}] as const;
            const json = (await res.json()) as {
              data: Array<{
                taskId: string;
                bestResult: 'success' | 'failure' | 'self_review';
              }>;
            };
            const map: Record<string, 'success' | 'failure' | 'self_review'> = {};
            for (const row of json.data ?? []) {
              map[row.taskId] = row.bestResult;
            }
            return [moduleId, map] as const;
          } catch {
            return [moduleId, {}] as const;
          }
        }),
      );
      const next: Record<string, Record<string, 'success' | 'failure' | 'self_review'>> = {};
      for (const [moduleId, map] of entries) {
        next[moduleId] = map;
      }
      setProgressByModule(next);
    };
    // moduleIdsKey is the cheap structural fingerprint of moduleIds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleIdsKey]);

  useEffect(() => {
    let cancelled = false;
    void refresh();

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        void refresh();
      }
    };
    const onFocus = () => {
      if (!cancelled) void refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  // Hooks done — now safe to bail on a missing topic.
  if (!topic) {
    return null;
  }
  const Icon = topic.icon;

  return (
    <div
      className="relative min-h-screen pb-24 lg:pb-10"
      style={{ '--topic-accent': topic.accentRgb } as CSSProperties}
    >
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">

        {/* Back */}
        <Link
          href="/practice/coding"
          className="mb-6 sm:mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/80 hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Coding Practice
        </Link>

        {/* Title block */}
        <header className="mb-8 sm:mb-10">
          <div className="mb-3">
            <span
              className="inline-block font-mono text-[10px] font-bold tracking-[0.18em] uppercase rounded-full px-2 py-0.5"
              style={{
                color: `rgb(${topic.accentRgb})`,
                border: `1px solid rgba(${topic.accentRgb},0.3)`,
                backgroundColor: `rgba(${topic.accentRgb},0.06)`,
              }}
            >
              {topic.category}
            </span>
          </div>
          <h1
            className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-4 font-black text-3xl sm:text-5xl lg:text-[4rem] tracking-tighter text-on-surface mb-4"
            style={{
              opacity: 0,
              animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) forwards',
              fontFamily:
                '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
            }}
          >
            <span
              className="inline-flex h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-[14px]"
              style={{
                backgroundColor: `rgba(${topic.accentRgb},0.08)`,
                border: `1px solid rgba(${topic.accentRgb},0.18)`,
              }}
            >
              <Icon
                className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8"
                style={{ color: `rgb(${topic.accentRgb})` }}
              />
            </span>
            <span className="uppercase">{topic.title}</span>
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-on-surface-variant/75">
            {topic.description}
          </p>
          <div
            aria-hidden="true"
            className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
        </header>

        {/* Practice Mastery */}
        <PracticeMasteryPanel
          tiers={tiers}
          resolvedTiers={resolvedTiers}
          progressByModule={progressByModule}
          accentRgb={topic.accentRgb}
        />

        {/* Tier grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {TIER.map((tier, i) => {
            const entry = tiers[tier.slug];
            const resolved = resolvedTiers[tier.slug];
            const isAvailable = Boolean(entry);
            const taskCount = resolved?.tasks.length ?? 0;
            const moduleProgress = resolved
              ? progressByModule[resolved.moduleId] ?? {}
              : {};
            const solvedCount = resolved
              ? resolved.tasks.filter((t) => moduleProgress[t.id] === 'success').length
              : 0;

            const cta = !isAvailable
              ? 'Coming Soon'
              : solvedCount === taskCount && taskCount > 0
                ? `All ${taskCount} solved · Review`
                : `Start · ${taskCount} task${taskCount === 1 ? '' : 's'}`;

            const wrapperKey = tier.slug;
            const cardInner = (
              <div
                className="relative overflow-hidden h-full flex flex-col rounded-[22px] transition-all duration-500 hover:scale-[1.015]"
                style={{
                  background: '#181c20',
                  border: `1px solid ${
                    isAvailable
                      ? `rgba(${tier.rgb},0.12)`
                      : 'rgba(255,255,255,0.05)'
                  }`,
                }}
              >
                <Corner pos="top-left" rgb={tier.rgb} dim={!isAvailable} />
                <Corner pos="bottom-right" rgb={tier.rgb} dim={!isAvailable} />

                {/* Banner */}
                <div className="relative h-32 sm:h-40 lg:h-44 overflow-hidden shrink-0">
                  {isAvailable ? (
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
                      style={{ color: tier.color }}
                    >
                      <StableGridMark className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Lock className="h-10 w-10 text-white/[0.12]" />
                    </div>
                  )}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to bottom, transparent 30%, #181c20 95%)',
                    }}
                  />
                </div>

                {/* Body */}
                <div
                  className={`relative flex-1 flex flex-col px-5 pb-5 pt-2 sm:px-6 sm:pb-6 ${
                    isAvailable ? '' : 'opacity-40'
                  }`}
                >
                  <h2 className="text-[2rem] sm:text-[2.4rem] font-black tracking-tight text-on-surface leading-none mb-1">
                    {tier.label}
                  </h2>
                  <p
                    className="font-mono font-medium text-[10px] tracking-[0.18em] uppercase mb-6 sm:mb-8"
                    style={{ color: tier.color }}
                  >
                    {tier.subtitle}
                  </p>

                  <div className="space-y-0 flex-1">
                    <StatRow
                      label="Tasks Solved"
                      value={
                        isAvailable
                          ? `${String(solvedCount).padStart(2, '0')} / ${String(taskCount).padStart(2, '0')}`
                          : '—'
                      }
                    />
                    <StatRow
                      label="kWh Multiplier"
                      value={isAvailable ? tier.xp : '—'}
                    />
                  </div>

                  <div className="mt-6">
                    <div
                      className="w-full py-3.5 text-center font-mono text-[12px] font-bold tracking-[0.2em] uppercase rounded-[14px] transition-all duration-300"
                      style={
                        isAvailable
                          ? {
                              border: '1px solid rgba(255,255,255,0.4)',
                              backgroundColor: 'rgba(255,255,255,0.08)',
                              color: '#ffffff',
                            }
                          : {
                              border: '1px dashed rgba(255,255,255,0.08)',
                              color: 'rgba(255,255,255,0.2)',
                            }
                      }
                    >
                      {cta}
                    </div>
                  </div>
                </div>
              </div>
            );

            if (!isAvailable) {
              return (
                <div
                  key={wrapperKey}
                  className="group block cursor-default"
                  style={{
                    opacity: 0,
                    animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${i * 80 + 120}ms forwards`,
                  }}
                >
                  {cardInner}
                </div>
              );
            }

            // `from` survives the round-trip so the practice viewer's back
            // button returns here, not to the theory track map it would
            // otherwise derive from the URL pattern.
            const fromHref = `/practice/coding/${topic.id}`;
            const href = `/operations/practice/${entry!.language}/${tier.slug}/${entry!.practiceSetId}?from=${encodeURIComponent(fromHref)}`;
            return (
              <Link
                key={wrapperKey}
                href={href}
                className="group block"
                style={{
                  opacity: 0,
                  animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${i * 80 + 120}ms forwards`,
                }}
              >
                {cardInner}
              </Link>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Practice Mastery — concept-matrix-style panel ──────────────────────────── */

function PracticeMasteryPanel({
  tiers,
  resolvedTiers,
  progressByModule,
  accentRgb,
}: {
  tiers: ReturnType<typeof getPracticeTopicTiers>;
  resolvedTiers: Partial<
    Record<
      PracticeTier,
      {
        entry: PracticeTopicTierEntry;
        moduleId: string;
        tasks: Array<{ id: string; title: string }>;
      }
    >
  >;
  progressByModule: Record<string, Record<string, 'success' | 'failure' | 'self_review'>>;
  accentRgb: string;
}) {
  const [expanded, setExpanded] = useState(true);

  const totalTasks = TIER.reduce(
    (sum, t) => sum + (resolvedTiers[t.slug]?.tasks.length ?? 0),
    0,
  );
  const totalSolved = TIER.reduce((sum, t) => {
    const r = resolvedTiers[t.slug];
    if (!r) return sum;
    const map = progressByModule[r.moduleId] ?? {};
    return sum + r.tasks.filter((task) => map[task.id] === 'success').length;
  }, 0);

  return (
    <div
      className="relative mb-8 rounded-[22px] overflow-hidden"
      style={{
        background: '#181c20',
        border: '1px solid rgba(255,255,255,0.06)',
        opacity: 0,
        animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) forwards',
      }}
    >
      <div className="absolute top-0 left-0 z-10 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-4 h-[1px]"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        />
        <div
          className="absolute top-0 left-0 w-[1px] h-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        />
      </div>
      <div className="absolute bottom-0 right-0 z-10 pointer-events-none">
        <div
          className="absolute bottom-0 right-0 w-4 h-[1px]"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-[1px] h-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        />
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 sm:px-6 text-left transition-colors hover:bg-white/[0.02]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono font-bold text-[11px] tracking-[0.22em] uppercase text-on-surface shrink-0">
            Practice Mastery
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant/35 shrink-0">
            {totalTasks > 0
              ? `${totalSolved} / ${totalTasks} tasks solved`
              : 'No tasks yet'}
          </span>
        </div>
        <ChevronDown
          className="h-4 w-4 text-on-surface-variant/50 transition-transform duration-300 shrink-0"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 sm:px-6 sm:pb-6 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
            {TIER.map((tier) => {
              const resolved = resolvedTiers[tier.slug];
              const tasks = resolved?.tasks ?? [];
              const isLocked = !resolved;
              const moduleProgress = resolved
                ? progressByModule[resolved.moduleId] ?? {}
                : {};
              const solvedCount = tasks.filter(
                (t) => moduleProgress[t.id] === 'success',
              ).length;

              return (
                <div key={tier.slug} className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="font-mono font-bold text-[10px] tracking-[0.2em] uppercase"
                      style={{
                        color: isLocked ? 'rgba(255,255,255,0.25)' : tier.color,
                      }}
                    >
                      {tier.label}
                    </span>
                    {!isLocked ? (
                      <span
                        className="font-mono text-[10px] tracking-widest uppercase"
                        style={{
                          color:
                            solvedCount === tasks.length && tasks.length > 0
                              ? tier.color
                              : 'rgba(255,255,255,0.35)',
                        }}
                      >
                        {solvedCount} / {tasks.length}
                      </span>
                    ) : (
                      <Lock className="h-3 w-3 text-white/[0.15]" />
                    )}
                  </div>

                  <div
                    aria-hidden="true"
                    className="h-px w-full mb-2"
                    style={{
                      background: isLocked
                        ? 'rgba(255,255,255,0.04)'
                        : `linear-gradient(to right, rgba(${tier.rgb},0.35), transparent)`,
                    }}
                  />

                  {isLocked ? (
                    <p
                      className="text-[12px] italic mt-1"
                      style={{ color: 'rgba(255,255,255,0.28)' }}
                    >
                      Coming soon
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {tasks.map((task) => {
                        const result = moduleProgress[task.id];
                        const isSolved = result === 'success';
                        const isFailed = result === 'failure';
                        return (
                          <li
                            key={task.id}
                            className="flex items-center gap-2.5 py-1"
                          >
                            <div
                              className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px] transition-colors"
                              style={{
                                background: isSolved
                                  ? `rgba(${tier.rgb},0.18)`
                                  : isFailed
                                    ? 'rgba(255,113,108,0.10)'
                                    : 'rgba(255,255,255,0.03)',
                                border: isSolved
                                  ? `1px solid rgba(${tier.rgb},0.5)`
                                  : isFailed
                                    ? '1px solid rgba(255,113,108,0.35)'
                                    : '1px solid rgba(255,255,255,0.08)',
                              }}
                            >
                              {isSolved && (
                                <Check
                                  className="h-[9px] w-[9px]"
                                  style={{ color: tier.color }}
                                  strokeWidth={3.5}
                                />
                              )}
                            </div>
                            <span
                              className="text-[12.5px] leading-tight truncate"
                              style={{
                                color: isSolved
                                  ? 'rgba(255,255,255,0.88)'
                                  : 'rgba(255,255,255,0.55)',
                                fontWeight: isSolved ? 500 : 400,
                              }}
                              title={task.title}
                            >
                              {task.title}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat row ───────────────────────────────────────────────────────────────── */

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
    >
      <span className="font-mono font-medium text-[10px] tracking-widest text-on-surface-variant/35 uppercase">
        {label}
      </span>
      <span className="font-mono text-[13px] font-bold text-on-surface/80">
        {value}
      </span>
    </div>
  );
}

/* ── Corner brackets ────────────────────────────────────────────────────────── */

function Corner({
  pos,
  rgb,
  dim,
}: {
  pos: 'top-left' | 'bottom-right';
  rgb: string;
  dim: boolean;
}) {
  const c = dim ? 'rgba(255,255,255,0.04)' : `rgba(${rgb},0.25)`;
  if (pos === 'top-left') {
    return (
      <div className="absolute top-0 left-0 z-10 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-4 h-[1px]"
          style={{ backgroundColor: c }}
        />
        <div
          className="absolute top-0 left-0 w-[1px] h-4"
          style={{ backgroundColor: c }}
        />
      </div>
    );
  }
  return (
    <div className="absolute bottom-0 right-0 z-10 pointer-events-none">
      <div
        className="absolute bottom-0 right-0 w-4 h-[1px]"
        style={{ backgroundColor: c }}
      />
      <div
        className="absolute bottom-0 right-0 w-[1px] h-4"
        style={{ backgroundColor: c }}
      />
    </div>
  );
}
