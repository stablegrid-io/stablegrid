'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Lock, Check, Play } from 'lucide-react';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { useTheoryModuleProgressSnapshots } from '@/lib/hooks/useTheoryModuleProgressSnapshots';
import { summarizeTrackLessonProgress } from '@/lib/learn/theoryTrackProgress';
import type { TheoryDoc, TheoryChapter, TheorySection } from '@/types/theory';
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

interface FlatLesson {
  chapterId: string;
  section: TheorySection;
  number: number;
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

const flattenChapters = (chapters: TheoryChapter[]): FlatLesson[] => {
  const flat: FlatLesson[] = [];
  let n = 0;
  chapters.forEach((chapter) => {
    chapter.sections.forEach((section) => {
      n += 1;
      flat.push({ chapterId: chapter.id, section, number: n });
    });
  });
  return flat;
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

            const flat = flattenChapters(track.chapters);
            const completedCount = stats.completedLessons;

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
                    {flat.map((lesson) => {
                      const chapter = track.chapters.find((c) => c.id === lesson.chapterId)!;
                      const lessonsRead = computeLessonsRead(
                        chapter,
                        chapterProgressById[chapter.id],
                        completedSet.has(chapter.id)
                      );
                      const sectionIndex = chapter.sections.findIndex(
                        (s) => s.id === lesson.section.id
                      );
                      const isComplete = sectionIndex < lessonsRead;
                      // Current = first incomplete lesson in the track
                      const isCurrent =
                        !isComplete &&
                        flat
                          .slice(0, flat.indexOf(lesson))
                          .every((earlier) => {
                            const earlyChapter = track.chapters.find((c) => c.id === earlier.chapterId)!;
                            const earlyRead = computeLessonsRead(
                              earlyChapter,
                              chapterProgressById[earlyChapter.id],
                              completedSet.has(earlyChapter.id)
                            );
                            const earlyIdx = earlyChapter.sections.findIndex(
                              (s) => s.id === earlier.section.id
                            );
                            return earlyIdx < earlyRead;
                          });

                      const minutes =
                        lesson.section.estimatedMinutes ??
                        lesson.section.durationMinutes ??
                        0;

                      const href =
                        `/learn/${doc.topic}/theory/${track.slug}` +
                        `?chapter=${chapter.id}&lesson=${lesson.section.id}`;

                      return (
                        <li
                          key={`${chapter.id}-${lesson.section.id}`}
                          className={`border-b border-surface-dim ${
                            isCurrent ? 'bg-surface-container-low' : ''
                          }`}
                        >
                          <Link
                            href={href}
                            className="grid grid-cols-[56px_1fr_auto_auto] items-center gap-6 py-4 hover:bg-surface-container-low transition-colors"
                          >
                            <span
                              className={`font-data-mono tabular-nums text-[13px] pl-2 ${
                                isCurrent ? 'text-primary' : 'text-on-surface-variant'
                              }`}
                            >
                              {padNumber(lesson.number)}
                            </span>
                            <div className="min-w-0 flex flex-col gap-0.5">
                              <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
                                Module {chapter.number}
                              </span>
                              <span className="font-serif text-[18px] text-on-surface leading-snug">
                                {lesson.section.title}
                              </span>
                            </div>
                            <span className="font-data-mono tabular-nums text-on-surface-variant text-[13px] pr-4">
                              {formatMinutes(minutes)}
                            </span>
                            <StatusBox isComplete={isComplete} isCurrent={isCurrent} />
                          </Link>
                        </li>
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
