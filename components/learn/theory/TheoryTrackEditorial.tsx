'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Lock, Check, Play, ChevronDown, Flag } from 'lucide-react';
import { useProgressStore } from '@/lib/stores/useProgressStore';
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
      <div className="max-w-[1200px] mx-auto px-12 py-16">
        {/* Header */}
        <header className="mb-16">
          <h1 className="font-h1 text-h1 text-on-surface mb-3">Theory</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            The full PySpark track. Read top-to-bottom or jump to whatever you need.
          </p>
          <div className="border-b border-on-surface mt-8" />
        </header>

        {/* Tiers */}
        <div className="flex flex-col gap-20">
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

                {/* Body */}
                {gate.unlocked ? (
                  <ul className="flex flex-col">
                    {track.chapters.map((chapter, chapterIdx) => {
                      const lessonsRead = computeLessonsRead(
                        chapter,
                        chapterProgressById[chapter.id],
                        completedSet.has(chapter.id)
                      );
                      const isModuleComplete = lessonsRead >= chapter.sections.length;
                      const isCurrentModule = chapter.id === currentChapterId;
                      const isOpen = openModules.has(chapter.id);
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
                        />
                      );
                    })}
                  </ul>
                ) : (
                  <LockedBanner reason={gate.reason ?? 'Locked.'} />
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
  trackSlug
}: ModuleAccordionProps) => {
  const totalLessons = chapter.sections.length;
  const headerId = `module-${chapter.id}-header`;
  const panelId = `module-${chapter.id}-panel`;

  return (
    <li
      className={`border-b border-surface-dim ${
        isCurrentModule && !isOpen ? 'bg-surface-container-low' : ''
      }`}
    >
      <button
        type="button"
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="grid grid-cols-[56px_1fr_auto_auto_auto] items-center gap-6 py-4 w-full text-left hover:bg-surface-container-low transition-colors"
      >
        <span
          className={`font-data-mono tabular-nums text-[13px] pl-2 ${
            isCurrentModule ? 'text-primary' : 'text-on-surface-variant'
          }`}
        >
          {padNumber(chapterIdx + 1)}
        </span>
        <div className="min-w-0 flex flex-col gap-0.5">
          <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
            Module {chapter.number}
          </span>
          <span className="font-serif text-[18px] text-on-surface leading-snug">
            {chapterTitle}
          </span>
        </div>
        <span className="font-data-mono tabular-nums text-on-surface-variant text-[13px]">
          {lessonsRead}/{totalLessons}
        </span>
        <span className="font-data-mono tabular-nums text-on-surface-variant text-[13px] pr-4">
          {formatMinutes(chapterMinutes)}
        </span>
        <span className="flex items-center gap-3 pr-2">
          <StatusBox isComplete={isModuleComplete} isCurrent={isCurrentModule} />
          <ChevronDown
            className={`h-4 w-4 text-on-surface-variant transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            strokeWidth={1.5}
          />
        </span>
      </button>
      {isOpen && (
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
                  className={`grid grid-cols-[56px_1fr_auto_auto] items-center gap-6 py-3 pl-14 hover:bg-surface-container-low transition-colors ${
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
  isCurrent
}: {
  isComplete: boolean;
  isCurrent: boolean;
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
  return (
    <span
      aria-label="Not started"
      className="w-8 h-8 mr-2 border border-surface-dim"
    />
  );
};

const LockedBanner = ({ reason }: { reason: string }) => (
  <div className="border-b border-surface-dim bg-surface-container-low p-6 mt-0 flex items-center justify-between gap-6">
    <p className="font-body-lg text-on-surface-variant/70 text-[15px]">{reason}</p>
    <div className="flex gap-2 shrink-0">
      <span className="w-8 h-8 border border-surface-dim" />
      <span className="w-8 h-8 border border-surface-dim" />
      <span className="w-8 h-8 border border-surface-dim" />
    </div>
  </div>
);
