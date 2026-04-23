'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Lock, Zap, BookOpen, FlaskConical, Layers, Clock, Trophy } from 'lucide-react';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { getTrackConceptMeta } from '@/data/learn/theory/trackConceptMeta';
import { useTheoryModuleProgressSnapshots } from '@/lib/hooks/useTheoryModuleProgressSnapshots';
import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import { getModuleCheckpointMeta } from '@/lib/learn/moduleCheckpoints';
import {
  clampLessonProgress,
  summarizeTrackLessonProgress
} from '@/lib/learn/theoryTrackProgress';
import type { TheoryDoc } from '@/types/theory';
import type { TheoryTrackSummary } from '@/data/learn/theory/tracks';
import type { PracticeSet } from '@/data/operations/practice-sets';
import type {
  ServerTheoryChapterProgressSnapshot,
  ServerTheoryModuleProgressSnapshot
} from '@/lib/learn/serverTheoryProgress';

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface TheoryTrackPathProps {
  doc: TheoryDoc;
  track: TheoryTrackSummary;
  completedChapterIds: string[];
  chapterProgressById?: Record<string, ServerTheoryChapterProgressSnapshot>;
  moduleProgressById?: Record<string, ServerTheoryModuleProgressSnapshot>;
  practiceSets?: PracticeSet[];
  practiceBasePath?: string;
}

type ModuleStatus = 'completed' | 'active' | 'available' | 'locked';

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const parseRouteQuery = (route: string) => {
  const [path, query = ''] = route.split('?');
  return { path, params: new URLSearchParams(query) };
};

const buildModuleHref = ({
  topic, trackSlug, chapterId, currentLessonId, lastVisitedRoute
}: {
  topic: string; trackSlug: string; chapterId: string;
  currentLessonId: string | null; lastVisitedRoute: string | null;
}) => {
  const fp = new URLSearchParams();
  fp.set('chapter', chapterId);
  if (currentLessonId) fp.set('lesson', currentLessonId);
  const fallback = `/learn/${topic}/theory/${trackSlug}?${fp.toString()}`;
  if (typeof lastVisitedRoute !== 'string') return fallback;
  const prefix = `/learn/${topic}/theory/`;
  if (!lastVisitedRoute.startsWith(prefix)) return fallback;
  const { path, params } = parseRouteQuery(lastVisitedRoute);
  if (params.get('chapter') !== chapterId) return fallback;
  if (!params.get('lesson') && currentLessonId) params.set('lesson', currentLessonId);
  const q = params.toString();
  return q ? `${path}?${q}` : path;
};

const stripModulePrefix = (title: string) =>
  title.replace(/^module\s*\d+\s*:\s*/i, '').trim();

/* ── Track accent colours ───────────────────────────────────────────────────── */

const TRACK_LEVEL_ACCENT: Record<string, { color: string; rgb: string }> = {
  junior: { color: '#99f7ff', rgb: '153,247,255' },
  mid:    { color: '#ffc965', rgb: '255,201,101' },
  senior: { color: '#ff716c', rgb: '255,113,108' },
};

const getTrackAccent = (slug: string) =>
  TRACK_LEVEL_ACCENT[slug] ?? TRACK_LEVEL_ACCENT.junior;

/* ── Category eyebrows for theory nodes ─────────────────────────────────────── */

const THEORY_EYEBROWS = ['Architecture', 'Processing', 'Optimization', 'Integration', 'Analysis', 'Streaming', 'Governance', 'Deployment', 'Orchestration', 'Migration'];
const PRACTICE_EYEBROWS = ['Operations', 'Response', 'Simulation', 'Diagnostics', 'Drill', 'Lab', 'Challenge', 'Scenario', 'Assessment', 'Validation'];

/* ── Component ──────────────────────────────────────────────────────────────── */

export const TheoryTrackPath = ({
  doc, track, completedChapterIds,
  chapterProgressById = {}, moduleProgressById = {},
  practiceSets = [], practiceBasePath = '',
}: TheoryTrackPathProps) => {
  const {
    completedChapterIds: liveCompletedChapterIds,
    moduleProgressById: liveModuleProgressById,
  } = useTheoryModuleProgressSnapshots({
    topic: doc.topic,
    initialCompletedChapterIds: completedChapterIds,
    initialModuleProgressById: moduleProgressById,
  });

  const modules = sortModulesByOrder(track.chapters);
  const ta = getTrackAccent(track.slug);
  const vars = { '--ta-rgb': ta.rgb, '--ta-color': ta.color, '--theory-accent': ta.rgb } as CSSProperties;
  const completedSet = new Set(liveCompletedChapterIds);
  const trackProgress = summarizeTrackLessonProgress({
    chapters: modules, completedChapterIds: liveCompletedChapterIds, chapterProgressById,
  });

  /* Build module cards */
  const moduleCards = modules.map((module) => {
    const mp = liveModuleProgressById[module.id];
    const cp = chapterProgressById[module.id];
    const isCompleted = mp ? mp.isCompleted : completedSet.has(module.id);
    const lessonsDone = clampLessonProgress(cp, module.sections.length, isCompleted);
    const hasAny = Boolean(lessonsDone > 0 || mp?.currentLessonId || mp?.lastVisitedRoute || cp?.currentLessonId || cp?.lastVisitedRoute);
    const href = buildModuleHref({
      topic: doc.topic, trackSlug: track.slug, chapterId: module.id,
      currentLessonId: mp?.currentLessonId ?? cp?.currentLessonId ?? null,
      lastVisitedRoute: mp?.lastVisitedRoute ?? cp?.lastVisitedRoute ?? null,
    });
    return { module, lessonsDone, lessonsTotal: module.sections.length, isCompleted, hasAny, href };
  });

  const activeId =
    [...moduleCards].filter((c) => !c.isCompleted && c.hasAny).sort((a, b) =>
      new Date((liveModuleProgressById[b.module.id]?.updatedAt ?? chapterProgressById[b.module.id]?.lastActiveAt) ?? 0).getTime() -
      new Date((liveModuleProgressById[a.module.id]?.updatedAt ?? chapterProgressById[a.module.id]?.lastActiveAt) ?? 0).getTime()
    )[0]?.module.id
    ?? moduleCards.find((c) => !c.isCompleted)?.module.id
    ?? null;

  const cards = moduleCards.map((c) => ({
    ...c,
    status: (c.isCompleted ? 'completed' : c.module.id === activeId ? 'active' : 'available') as ModuleStatus,
    progressPct: c.lessonsTotal > 0 ? Math.round((c.lessonsDone / c.lessonsTotal) * 100) : 0,
  }));

  // Build paired rows: each row has a theory card (left) + optional practice card (right)
  // Match positionally (1st theory ↔ 1st practice, 2nd ↔ 2nd, etc.) since
  // moduleIds don't always match across theory/practice (e.g. PSI1 vs PM1).
  type RowItem = {
    theory: typeof cards[number];
    theoryIdx: number;
    practice: PracticeSet | null;
    practiceIdx: number;
  };

  const rows: RowItem[] = cards.map((card, i) => ({
    theory: card,
    theoryIdx: i,
    practice: practiceSets[i] ?? null,
    practiceIdx: i,
  }));

  // Any extra practice sets beyond the theory count go as standalone rows
  const standalonePs = practiceSets.slice(cards.length).map((ps, i) => ({ ps, idx: cards.length + i }));

  const { completedModules, progressPct: overallPct } = trackProgress;

  return (
    <div className="min-h-screen pb-24 lg:pb-8" style={vars}>
      <div className="mx-auto max-w-5xl px-4 py-8">

        <Link
          href={`/learn/${doc.topic}/theory`}
          className="mb-8 inline-flex items-center gap-2 font-mono text-[11px] text-on-surface-variant/50 hover:text-on-surface-variant transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="h-4 w-4" />
          Track Selection
        </Link>

        {/* ── Title ── */}
        <div className="text-center mb-16" style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) forwards' }}>
          <div
            className="inline-block w-10 h-1.5 mb-6 rounded-full"
            style={{ backgroundColor: ta.color, boxShadow: `0 0 12px rgba(${ta.rgb},0.5)` }}
          />
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-on-surface">
            Learning Path
          </h1>
          <p className="mt-3 font-mono text-[12px] tracking-widest text-on-surface-variant/35 uppercase">
            Master each node to unlock the next stage
          </p>
        </div>

        {/* ── Zigzag tree map ── */}
        <div className="relative">
          {/* Center vertical connector line */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px hidden md:block"
            style={{ background: `linear-gradient(to bottom, rgba(${ta.rgb},0.25), rgba(${ta.rgb},0.05))` }}
          />

          {cards.map((card, i) => {
            const isLeft = i % 2 === 0;
            const stagger = i * 70 + 100;
            const isCompleted = card.status === 'completed';
            const isActive = card.status === 'active';

            return (
              <div
                key={card.module.id}
                className="relative flex items-center mb-16 md:mb-20"
                style={{ opacity: 0, animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${stagger}ms forwards` }}
              >
                {/* Center connector dot */}
                <div className="absolute left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center justify-center">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: isCompleted ? ta.color : '#0c0e10',
                      border: `2px solid ${isCompleted ? ta.color : isActive ? ta.color : 'rgba(255,255,255,0.12)'}`,
                      boxShadow: isCompleted ? `0 0 12px rgba(${ta.rgb},0.6)` : isActive ? `0 0 8px rgba(${ta.rgb},0.3)` : 'none',
                    }}
                  />
                </div>

                {/* Card — alternating left/right */}
                <div className={`w-full md:w-[calc(50%-32px)] ${isLeft ? 'md:mr-auto' : 'md:ml-auto'}`}>
                  <TheoryNode card={card} idx={i} ta={ta} topic={doc.topic} />
                </div>
              </div>
            );
          })}

          {/* ── Capstone Project (hidden for now) ── */}
          {false && (doc.topic === 'pyspark' || doc.topic === 'PySpark' || doc.topic === 'fabric' || doc.topic === 'Fabric' || doc.topic === 'airflow' || doc.topic === 'Airflow') && (track.slug === 'junior' || track.slug === 'mid' || track.slug === 'senior') ? (<div
            className="relative flex items-center mb-16 md:mb-20"
            style={{ opacity: 0, animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${cards.length * 70 + 100}ms forwards` }}
          >
            {/* Center connector dot */}
            <div className="absolute left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center justify-center">
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  backgroundColor: overallPct >= 100 ? ta.color : '#0c0e10',
                  border: `2px solid ${overallPct >= 100 ? ta.color : `rgba(${ta.rgb},0.2)`}`,
                  boxShadow: overallPct >= 100 ? `0 0 12px rgba(${ta.rgb},0.5)` : 'none',
                }}
              >
                {overallPct >= 100 && <Trophy className="h-2.5 w-2.5 m-auto" style={{ color: '#0c0e10' }} />}
              </div>
            </div>

            {/* Card — opposite side of the last theory card */}
            <div className={`w-full md:w-[calc(50%-32px)] ${cards.length % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'}`}>
              <Link href={`/learn/${doc.topic}/theory/${track.slug}?capstone=true`} className="group block h-full">
                <div
                  className="relative p-7 h-full flex flex-col transition-all duration-300 group-hover:scale-[1.01]"
                  style={{
                    background: '#181c20',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '22px',
                  }}
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-[22px] overflow-hidden" style={{
                    background: `linear-gradient(90deg, transparent 5%, rgba(${ta.rgb},0.5), transparent 95%)`,
                  }} />

                  {/* Eyebrow */}
                  <div className="flex items-start justify-between mb-4">
                    <span className="font-mono text-[10px] font-bold tracking-widest uppercase" style={{ color: ta.color }}>
                      Capstone Project
                    </span>
                    <Trophy className="h-5 w-5" style={{ color: `rgba(${ta.rgb},0.3)` }} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold tracking-tight text-on-surface mb-2">
                    Final Project
                  </h3>

                  {/* Description */}
                  <p className="text-[12px] leading-relaxed text-on-surface-variant/40 mb-5">
                    Apply everything you learned in a real-world scenario. Build a complete data pipeline from raw ingestion to clean output.
                  </p>

                  {/* CTA */}
                  <div
                    className="mt-auto w-full py-3 text-center font-mono text-[12px] font-bold tracking-widest uppercase transition-all duration-300"
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.7)',
                      borderRadius: '14px',
                    }}
                  >
                    Start Project
                  </div>
                </div>
              </Link>
            </div>
          </div>) : null}

          {/* ── Mastery node ── */}
          <div
            className="relative flex justify-center py-12"
            style={{ opacity: 0, animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${cards.length * 70 + 200}ms forwards` }}
          >
            <div
              className="w-14 h-14 flex items-center justify-center z-10"
              style={{
                background: overallPct >= 100 ? `rgba(${ta.rgb},0.15)` : '#0c0e10',
                border: `3px solid ${overallPct >= 100 ? ta.color : 'rgba(255,255,255,0.06)'}`,
                boxShadow: overallPct >= 100 ? `0 0 24px rgba(${ta.rgb},0.5), 0 0 8px rgba(${ta.rgb},0.3)` : 'none',
                borderRadius: '50%',
              }}
            >
              <Check className="h-6 w-6" style={{ color: overallPct >= 100 ? ta.color : 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Theory Node Card ───────────────────────────────────────────────────────── */

function TheoryNode({ card, idx, ta, topic }: {
  card: { module: any; lessonsDone: number; lessonsTotal: number; isCompleted: boolean; status: ModuleStatus; progressPct: number; href: string };
  idx: number;
  ta: { color: string; rgb: string }; topic: string;
}) {
  const title = stripModulePrefix(card.module.title) || card.module.title;
  const desc = card.module.description || '';
  const isCompleted = card.status === 'completed';
  const isActive = card.status === 'active';
  const eyebrow = THEORY_EYEBROWS[idx % THEORY_EYEBROWS.length];

  const ctaLabel = isCompleted ? 'Review Theory' : isActive ? 'Resume Theory' : 'Begin Theory';

  return (
    <Link href={card.href} className="group block h-full">
          <div
            className="relative p-7 h-full flex flex-col transition-all duration-300 group-hover:scale-[1.01]"
            style={{
              background: '#181c20',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: isCompleted ? `0 0 30px rgba(${ta.rgb},0.08)` : 'none',
              borderRadius: '22px',
            }}
          >
            {/* Top row: eyebrow + icon */}
            <div className="flex items-start justify-between mb-4">
              <span
                className="font-mono text-[10px] font-bold tracking-widest uppercase"
                style={{ color: ta.color }}
              >
                {eyebrow}
              </span>
              <BookOpen className="h-5 w-5" style={{ color: isCompleted ? ta.color : 'rgba(255,255,255,0.12)' }} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold tracking-tight text-on-surface mb-4">
              {title}
            </h3>

            {/* Description */}
            {desc && (
              <p className="text-[12px] leading-relaxed text-on-surface-variant/40 mb-5 line-clamp-2">{desc}</p>
            )}

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-on-surface-variant/35 tracking-wide">Module Progress</span>
                <span className="font-mono text-[13px] font-bold" style={{ color: ta.color }}>{card.progressPct}%</span>
              </div>
              <div className="w-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
                <div style={{ width: `${card.progressPct}%`, height: '100%', background: '#fff', borderRadius: 100, opacity: 0.85, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
              </div>
            </div>

            {/* CTA button */}
            <div
              className="mt-auto w-full py-3 text-center font-mono text-[12px] font-bold tracking-widest uppercase transition-all duration-300"
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
                borderRadius: '14px',
              }}
            >
              {ctaLabel}
            </div>
          </div>
    </Link>
  );
}

/* ── Practice Node Card ─────────────────────────────────────────────────────── */

function PracticeNode({ ps, idx, ta, practiceBasePath }: {
  ps: PracticeSet; idx: number;
  ta: { color: string; rgb: string }; practiceBasePath: string;
}) {
  const taskCount = ps.tasks?.length ?? 0;
  const duration = ps.tasks?.reduce((s: number, t: { estimatedMinutes?: number }) => s + (t.estimatedMinutes ?? 0), 0) ?? 0;
  const practiceTitle = ps.title.replace(/^Practice Set \d+\s*—?\s*/i, '');
  const eyebrow = PRACTICE_EYEBROWS[idx % PRACTICE_EYEBROWS.length];

  return (
    <Link
      href={`${practiceBasePath}?practice=${ps.metadata?.moduleId ?? ''}`}
      className="group block h-full"
    >
          <div
            className="relative p-7 h-full flex flex-col transition-all duration-300 group-hover:scale-[1.01]"
            style={{
              background: '#181c20',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '22px',
            }}
          >
            {/* Top row: eyebrow + icon */}
            <div className="flex items-start justify-between mb-4">
              <span
                className="font-mono text-[10px] font-bold tracking-widest uppercase"
                style={{ color: ta.color }}
              >
                {eyebrow}
              </span>
              <FlaskConical className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.12)' }} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold tracking-tight text-on-surface mb-3">
              {practiceTitle}
            </h3>

            {/* Stats row */}
            <div className="flex gap-3 mb-5">
              <div className="flex-1 p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '14px' }}>
                <span className="block font-mono text-[9px] text-on-surface-variant/30 uppercase tracking-widest mb-1">Tasks</span>
                <span className="text-lg font-bold text-on-surface">{taskCount}</span>
              </div>
              <div className="flex-1 p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '14px' }}>
                <span className="block font-mono text-[9px] text-on-surface-variant/30 uppercase tracking-widest mb-1">Duration</span>
                <span className="text-lg font-bold text-on-surface">{duration} min</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-[12px] leading-relaxed text-on-surface-variant/35 mb-5 line-clamp-2">
              {ps.description}
            </p>

            {/* CTA */}
            <div
              className="mt-auto w-full py-3 text-center font-mono text-[12px] font-bold tracking-widest uppercase transition-all duration-300"
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
                borderRadius: '14px',
              }}
            >
              Engage Lab
            </div>
          </div>
    </Link>
  );
}
