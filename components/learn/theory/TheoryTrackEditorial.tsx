'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Lock, Check, Play, ChevronDown, Flag } from 'lucide-react';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { useHoverPrefetch } from '@/lib/hooks/useHoverPrefetch';
import { useTheoryModuleProgressSnapshots } from '@/lib/hooks/useTheoryModuleProgressSnapshots';
import { summarizeTrackLessonProgress } from '@/lib/learn/theoryTrackProgress';
import { isModuleCheckpointLesson } from '@/lib/learn/moduleCheckpoints';
import type { TheoryDoc, TheoryChapter } from '@/types/theory';
import type { TheoryTrackSummary } from '@/data/learn/theory/tracks';
import type {
  ServerTheoryChapterProgressSnapshot,
  ServerTheoryModuleProgressSnapshot
} from '@/lib/learn/serverTheoryProgress';

interface TheoryTrackEditorialProps {
  doc: TheoryDoc;
  tracks: TheoryTrackSummary[];
  completedChapterIds: string[];
  chapterProgressById?: Record<string, ServerTheoryChapterProgressSnapshot>;
  moduleProgressById?: Record<string, ServerTheoryModuleProgressSnapshot>;
}

interface LockGate {
  unlocked: boolean;
  reason?: string;
}

const TIER_HEADERS: Record<string, { headline: string; subhead: string }> = {
  junior: { headline: 'JUNIOR', subhead: 'CORE FOUNDATION' },
  mid: { headline: 'MID', subhead: 'ADVANCED TRANSFORMATIONS' },
  senior: { headline: 'SENIOR', subhead: 'CLUSTER TUNING' }
};

const computeLessonsRead = (
  chapter: TheoryChapter,
  snapshot: ServerTheoryChapterProgressSnapshot | undefined,
  isCompleted: boolean
): number => {
  if (isCompleted) return chapter.sections.length;
  const raw = Number(snapshot?.sectionsRead ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(chapter.sections.length, Math.round(raw)));
};

const formatMinutes = (mins: number): string => {
  if (!Number.isFinite(mins) || mins <= 0) return '—';
  return `${Math.round(mins)}m`;
};

const padNumber = (n: number) => n.toString().padStart(2, '0');

const computeGate = (
  trackSlug: string,
  trackStats: { completedLessons: number; totalLessons: number }[],
  trackBySlug: Record<string, number>,
  kwh: number
): LockGate => {
  if (trackSlug === 'junior') return { unlocked: true };
  if (trackSlug === 'mid') {
    const required = 500;
    if (kwh >= required) return { unlocked: true };
    const away = required - kwh;
    return {
      unlocked: false,
      reason: `${away.toLocaleString()} kWh away. Reach ${required.toLocaleString()} kWh total processing power in Practice to unlock.`
    };
  }
  if (trackSlug === 'senior') {
    const midIdx = trackBySlug.mid;
    const midStats = midIdx !== undefined ? trackStats[midIdx] : undefined;
    const midDone =
      midStats !== undefined &&
      midStats.totalLessons > 0 &&
      midStats.completedLessons >= midStats.totalLessons;
    const required = 1200;
    if (midDone && kwh >= required) return { unlocked: true };
    if (!midDone) {
      return {
        unlocked: false,
        reason: `Requires Mid completion and ${required.toLocaleString()} kWh.`
      };
    }
    const away = required - kwh;
    return {
      unlocked: false,
      reason: `${away.toLocaleString()} kWh away. Reach ${required.toLocaleString()} kWh to unlock.`
    };
  }
  return { unlocked: true };
};

export const TheoryTrackEditorial = ({
  doc,
  tracks,
  completedChapterIds,
  chapterProgressById = {},
  moduleProgressById = {}
}: TheoryTrackEditorialProps) => {
  const { completedChapterIds: liveCompleted } = useTheoryModuleProgressSnapshots({
    topic: doc.topic,
    initialCompletedChapterIds: completedChapterIds,
    initialModuleProgressById: moduleProgressById
  });
  const completedSet = useMemo(() => new Set(liveCompleted), [liveCompleted]);
  const prefetchRoute = useHoverPrefetch();

  const xp = useProgressStore((s) => s.xp);

  const trackStats = tracks.map((track) =>
    summarizeTrackLessonProgress({
      chapters: track.chapters,
      completedChapterIds: liveCompleted,
      chapterProgressById
    })
  );
  const trackBySlug = useMemo(
    () =>
      tracks.reduce<Record<string, number>>((acc, track, i) => {
        acc[track.slug] = i;
        return acc;
      }, {}),
    [tracks]
  );

  // Default-open: the first not-yet-complete module of each unlocked tier.
  // Computed once from initial server progress so user toggles aren't undone
  // when they finish a lesson and a re-render happens.
  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    tracks.forEach((track) => {
      const current = track.chapters.find((chapter) => {
        const read = computeLessonsRead(
          chapter,
          chapterProgressById[chapter.id],
          completedChapterIds.includes(chapter.id)
        );
        return read < chapter.sections.length;
      });
      if (current) initial.add(current.id);
    });
    return initial;
  });

  const toggleModule = (id: string) =>
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <main className="bg-surface min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-12 lg:py-16">
        {/* Header — "PySpark" wordmark in editorial type + orange star
            mark (locally authored, not a trademark reproduction). */}
        <header className="mb-10 sm:mb-14 lg:mb-16">
          <h1 className="flex items-center gap-3 font-h1 text-[40px] sm:text-[56px] lg:text-h1 leading-none">
            <span>
              <span className="text-primary">Py</span>
              <span className="text-on-surface">Spark</span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/pyspark-track-star.svg"
              alt=""
              aria-hidden="true"
              className="h-12 sm:h-14 w-auto shrink-0"
            />
          </h1>
          <p className="mt-5 font-body-lg text-body-lg text-on-surface-variant max-w-3xl md:hidden">
            What Spark actually does when your job runs. By the end you read plans, diagnose skew, and tune memory before it costs you.
          </p>
          <p className="mt-5 font-body-lg text-body-lg text-on-surface-variant max-w-3xl hidden md:block">
            A field guide to what Spark actually does when your job runs — from query plans and Catalyst rewrites down to executor memory, shuffle, and the state stores behind streaming. By the end you can read an execution plan, pick joins by their physical operator, diagnose skew before it cascades, and tune memory without a rollout-day surprise. The whole modern data stack at scale rides on this engine; the difference between a $50 job and a $5,000 one is whether you know the wiring beneath it.
          </p>
          <div className="border-b border-on-surface mt-8" />
        </header>

        {/* Tiers */}
        <div className="flex flex-col gap-10 sm:gap-14 lg:gap-20">
          {tracks.map((track, i) => {
            const stats = trackStats[i];
            const gate = computeGate(track.slug, trackStats, trackBySlug, xp);
            const tierMeta = TIER_HEADERS[track.slug] ?? {
              headline: track.label.toUpperCase(),
              subhead: track.eyebrow.toUpperCase()
            };

            const completedCount = stats.completedLessons;

            // The first not-yet-complete module in the track. Used to mark the
            // module currently in progress and to highlight its first unread
            // lesson when expanded.
            const currentChapterId = track.chapters.find((chapter) => {
              const read = computeLessonsRead(
                chapter,
                chapterProgressById[chapter.id],
                completedSet.has(chapter.id)
              );
              return read < chapter.sections.length;
            })?.id;

            return (
              <section key={track.slug} aria-label={track.label}>
                {/* Tier header */}
                <div className="flex items-center justify-between border-b border-on-surface pb-4 mb-0">
                  <h2
                    className={`font-ui-label text-[24px] sm:text-[28px] uppercase tracking-wider ${
                      gate.unlocked ? 'text-on-surface' : 'text-on-surface-variant/60'
                    }`}
                  >
                    {tierMeta.headline} — {tierMeta.subhead}
                  </h2>
                  <div className="flex items-center gap-4">
                    {gate.unlocked ? (
                      <span className="font-data-mono text-on-surface-variant text-[13px] tabular-nums">
                        ({completedCount} of {stats.totalLessons} lessons)
                      </span>
                    ) : (
                      <Lock
                        className="h-5 w-5 text-on-surface-variant/60"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                </div>

                {/* Body — locked tiers still render the module list as a
                    dimmed, non-interactive preview so users see the
                    curriculum they're unlocking. The kWh-away message
                    sits as a slim footer underneath. */}
                <ul className="flex flex-col">
                  {track.chapters.map((chapter, chapterIdx) => {
                    const lessonsRead = gate.unlocked
                      ? computeLessonsRead(
                          chapter,
                          chapterProgressById[chapter.id],
                          completedSet.has(chapter.id)
                        )
                      : 0;
                    const isModuleComplete =
                      gate.unlocked && lessonsRead >= chapter.sections.length;
                    const isCurrentModule =
                      gate.unlocked && chapter.id === currentChapterId;
                    const isOpen = gate.unlocked && openModules.has(chapter.id);
                    const moduleMinutes = chapter.sections.reduce(
                      (sum, s) =>
                        sum +
                        (s.estimatedMinutes ?? s.durationMinutes ?? 0),
                      0
                    );
                    const moduleTitle = chapter.title.replace(
                      /^module\s*\d+\s*:\s*/i,
                      ''
                    );

                    return (
                      <ModuleAccordion
                        key={chapter.id}
                        chapter={chapter}
                        chapterIdx={chapterIdx}
                        chapterTitle={moduleTitle || chapter.title}
                        chapterMinutes={moduleMinutes}
                        lessonsRead={lessonsRead}
                        isModuleComplete={isModuleComplete}
                        isCurrentModule={isCurrentModule}
                        isOpen={isOpen}
                        onToggle={() => toggleModule(chapter.id)}
                        topic={doc.topic}
                        trackSlug={track.slug}
                        locked={!gate.unlocked}
                      />
                    );
                  })}
                </ul>
                {!gate.unlocked && (
                  <LockedFooter
                    reason={gate.reason ?? 'Locked.'}
                    label={`REQUIRES ${tierMeta.headline} TIER`}
                  />
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
};

interface ModuleAccordionProps {
  chapter: TheoryChapter;
  chapterIdx: number;
  chapterTitle: string;
  chapterMinutes: number;
  lessonsRead: number;
  isModuleComplete: boolean;
  isCurrentModule: boolean;
  isOpen: boolean;
  onToggle: () => void;
  topic: string;
  trackSlug: string;
  /**
   * Locked tiers render this row as a non-interactive preview: text dims,
   * the chevron + toggle behaviour drop, the body never expands. The user
   * still sees the module title + lesson count + minutes so they know
   * what's behind the lock instead of a generic banner.
   */
  locked?: boolean;
}

const ModuleAccordion = ({
  chapter,
  chapterIdx,
  chapterTitle,
  chapterMinutes,
  lessonsRead,
  isModuleComplete,
  isCurrentModule,
  isOpen,
  onToggle,
  topic,
  trackSlug,
  locked = false
}: ModuleAccordionProps) => {
  const totalLessons = chapter.sections.length;
  const headerId = `module-${chapter.id}-header`;
  const panelId = `module-${chapter.id}-panel`;
  // ModuleAccordion is at module scope — it can't close over the parent's
  // hook. Declare a local prefetcher so each accordion's lesson Links can
  // warm the route on hover.
  const prefetchRoute = useHoverPrefetch();

  const headerContent = (
    <>
      <span
        className={`font-data-mono tabular-nums text-[13px] pl-2 ${
          locked
            ? 'text-on-surface-variant/40'
            : isCurrentModule
              ? 'text-primary'
              : 'text-on-surface-variant'
        }`}
      >
        {padNumber(chapterIdx + 1)}
      </span>
      <div className="min-w-0 flex flex-col gap-0.5">
        <span
          className={`font-data-mono uppercase text-[10px] tracking-wider ${
            locked ? 'text-on-surface-variant/40' : 'text-on-surface-variant'
          }`}
        >
          Module {chapter.number}
        </span>
        <span
          className={`font-serif text-[16px] sm:text-[18px] leading-snug truncate ${
            locked ? 'text-on-surface-variant/60' : 'text-on-surface'
          }`}
        >
          {chapterTitle}
        </span>
        {/* Mobile-only sub-meta — replaces the hidden lessons + duration
            cells from the desktop grid so phones still see progress + length. */}
        <span
          className={`sm:hidden font-data-mono tabular-nums text-[11px] ${
            locked ? 'text-on-surface-variant/40' : 'text-on-surface-variant'
          }`}
        >
          {locked ? `${totalLessons} lessons` : `${lessonsRead}/${totalLessons} lessons`}
          <span className="px-1.5 opacity-50">·</span>
          {formatMinutes(chapterMinutes)}
        </span>
      </div>
      {/* Lessons + duration meta — hidden on phones; the inline mobile
          line under the title carries the same counts so nothing's lost. */}
      <span
        className={`hidden sm:inline font-data-mono tabular-nums text-[13px] ${
          locked ? 'text-on-surface-variant/40' : 'text-on-surface-variant'
        }`}
      >
        {locked ? `${totalLessons} lessons` : `${lessonsRead}/${totalLessons}`}
      </span>
      <span
        className={`hidden sm:inline font-data-mono tabular-nums text-[13px] pr-4 ${
          locked ? 'text-on-surface-variant/40' : 'text-on-surface-variant'
        }`}
      >
        {formatMinutes(chapterMinutes)}
      </span>
      <span className="flex items-center gap-3 pr-2">
        <StatusBox
          isComplete={isModuleComplete}
          isCurrent={isCurrentModule}
          dimmed={locked}
        />
        {!locked && (
          <ChevronDown
            className={`h-4 w-4 text-on-surface-variant transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            strokeWidth={1.5}
          />
        )}
      </span>
    </>
  );

  return (
    <li
      className={`border-b border-surface-dim ${
        !locked && isCurrentModule && !isOpen ? 'bg-surface-container-low' : ''
      }`}
    >
      {locked ? (
        <div
          id={headerId}
          aria-disabled="true"
          className="grid grid-cols-[40px_1fr_auto] sm:grid-cols-[56px_1fr_auto_auto_auto] items-center gap-x-3 sm:gap-6 py-4 w-full text-left"
        >
          {headerContent}
        </div>
      ) : (
        <button
          type="button"
          id={headerId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="grid grid-cols-[56px_1fr_auto_auto_auto] items-center gap-6 py-4 w-full text-left hover:bg-surface-container-low transition-colors"
        >
          {headerContent}
        </button>
      )}
      {!locked && isOpen && (
        <ul
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="border-t border-surface-dim bg-surface-container-low/40"
        >
          {chapter.sections.map((section, sectionIdx) => {
            const isCheckpoint = isModuleCheckpointLesson(section.title);
            const isLessonComplete = sectionIdx < lessonsRead;
            const isLessonCurrent =
              isCurrentModule && sectionIdx === lessonsRead;
            const minutes =
              section.estimatedMinutes ?? section.durationMinutes ?? 0;
            const href =
              `/theory/${trackSlug}` +
              `?chapter=${chapter.id}&lesson=${section.id}`;
            return (
              <li
                key={section.id}
                className="border-b border-surface-dim last:border-b-0"
              >
                <Link
                  href={href}
                  onMouseEnter={() => prefetchRoute(href)}
                  onFocus={() => prefetchRoute(href)}
                  className={`grid grid-cols-[32px_1fr_auto] sm:grid-cols-[56px_1fr_auto_auto] items-center gap-x-2 sm:gap-6 py-3 pl-6 sm:pl-14 hover:bg-surface-container-low transition-colors ${
                    isLessonCurrent ? 'bg-surface-container-low' : ''
                  }`}
                >
                  {isCheckpoint ? (
                    <span
                      aria-label="Module checkpoint"
                      className="flex items-center justify-start text-primary"
                    >
                      <Flag className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </span>
                  ) : (
                    <span
                      className={`font-data-mono tabular-nums text-[12px] ${
                        isLessonCurrent ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      {padNumber(sectionIdx + 1)}
                    </span>
                  )}
                  <span
                    className={`font-serif text-[16px] leading-snug min-w-0 truncate ${
                      isCheckpoint ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    {section.title}
                  </span>
                  <span className="font-data-mono tabular-nums text-on-surface-variant text-[12px] pr-4">
                    {formatMinutes(minutes)}
                  </span>
                  <StatusBox
                    isComplete={isLessonComplete}
                    isCurrent={isLessonCurrent}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};

const StatusBox = ({
  isComplete,
  isCurrent,
  dimmed = false
}: {
  isComplete: boolean;
  isCurrent: boolean;
  dimmed?: boolean;
}) => {
  if (isComplete) {
    return (
      <span
        aria-label="Completed"
        className="w-8 h-8 mr-2 bg-on-surface flex items-center justify-center"
      >
        <Check className="h-4 w-4 text-surface" strokeWidth={2.5} />
      </span>
    );
  }
  if (isCurrent) {
    return (
      <span
        aria-label="In progress"
        className="w-8 h-8 mr-2 border border-on-surface flex items-center justify-center"
      >
        <Play className="h-3.5 w-3.5 text-primary fill-primary" strokeWidth={2} />
      </span>
    );
  }
  if (dimmed) {
    return (
      <span
        aria-label="Locked"
        className="w-8 h-8 mr-2 border border-surface-dim/60"
      />
    );
  }
  return (
    <span
      aria-label="Not started"
      className="w-8 h-8 mr-2 border border-surface-dim"
    />
  );
};

/**
 * Sits under the dimmed module list and explains *why* the tier is locked
 * + how to unlock it. Slim editorial strip — the modules above carry the
 * visual weight; this is just a footer credit-line.
 */
const LockedFooter = ({ reason, label }: { reason: string; label: string }) => (
  <div className="border-b border-surface-dim bg-surface-container-low/60 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
    <span className="inline-flex items-center gap-2 font-data-mono uppercase tracking-[0.18em] text-[10px] text-on-surface-variant/70">
      <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </span>
    <p className="font-data-mono text-[11px] tracking-wider text-on-surface-variant/70 tabular-nums">
      {reason}
    </p>
  </div>
);
