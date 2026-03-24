'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { useTheoryModuleProgressSnapshots } from '@/lib/hooks/useTheoryModuleProgressSnapshots';
import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import { getModuleCheckpointMeta } from '@/lib/learn/moduleCheckpoints';
import {
  clampLessonProgress,
  summarizeTrackLessonProgress
} from '@/lib/learn/theoryTrackProgress';
import type { TheoryDoc } from '@/types/theory';
import type { TheoryTrackSummary } from '@/data/learn/theory/tracks';
import type {
  ServerTheoryChapterProgressSnapshot,
  ServerTheoryModuleProgressSnapshot
} from '@/lib/learn/serverTheoryProgress';

interface TheoryTrackPathProps {
  doc: TheoryDoc;
  track: TheoryTrackSummary;
  completedChapterIds: string[];
  chapterProgressById?: Record<string, ServerTheoryChapterProgressSnapshot>;
  moduleProgressById?: Record<string, ServerTheoryModuleProgressSnapshot>;
}

type ModuleStatus = 'completed' | 'active' | 'available' | 'locked';

const parseRouteQuery = (route: string) => {
  const [path, query = ''] = route.split('?');
  return { path, params: new URLSearchParams(query) };
};

const buildModuleHref = ({
  topic,
  trackSlug,
  chapterId,
  currentLessonId,
  lastVisitedRoute
}: {
  topic: string;
  trackSlug: string;
  chapterId: string;
  currentLessonId: string | null;
  lastVisitedRoute: string | null;
}) => {
  const fallbackParams = new URLSearchParams();
  fallbackParams.set('chapter', chapterId);
  if (currentLessonId) {
    fallbackParams.set('lesson', currentLessonId);
  }

  const fallbackHref = `/learn/${topic}/theory/${trackSlug}?${fallbackParams.toString()}`;
  if (typeof lastVisitedRoute !== 'string') {
    return fallbackHref;
  }

  const theoryPrefix = `/learn/${topic}/theory/`;
  if (!lastVisitedRoute.startsWith(theoryPrefix)) {
    return fallbackHref;
  }

  const { path, params } = parseRouteQuery(lastVisitedRoute);
  if (params.get('chapter') !== chapterId) {
    return fallbackHref;
  }

  const lessonFromRoute = params.get('lesson');
  if (!lessonFromRoute && currentLessonId) {
    params.set('lesson', currentLessonId);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

const stripModulePrefix = (title: string) =>
  title.replace(/^module\s*\d+\s*:\s*/i, '').trim();

const TRACK_LEVEL_ACCENT: Record<string, { color: string; rgb: string }> = {
  junior: { color: '#99f7ff', rgb: '153,247,255' },
  mid: { color: '#ffc965', rgb: '255,201,101' },
  senior: { color: '#ff716c', rgb: '255,113,108' },
};

const getTrackAccent = (slug: string) =>
  TRACK_LEVEL_ACCENT[slug] ?? TRACK_LEVEL_ACCENT.junior;

export const TheoryTrackPath = ({
  doc,
  track,
  completedChapterIds,
  chapterProgressById = {},
  moduleProgressById = {}
}: TheoryTrackPathProps) => {
  const {
    completedChapterIds: liveCompletedChapterIds,
    moduleProgressById: liveModuleProgressById
  } = useTheoryModuleProgressSnapshots({
    topic: doc.topic,
    initialCompletedChapterIds: completedChapterIds,
    initialModuleProgressById: moduleProgressById
  });
  const modules = sortModulesByOrder(track.chapters);
  const topicStyle = getTheoryTopicStyle(doc.topic);
  const ta = getTrackAccent(track.slug);
  const accentVars = {
    '--theory-accent': ta.rgb,
    '--ta-color': ta.color,
    '--ta-rgb': ta.rgb,
  } as CSSProperties;
  const completedSet = new Set(liveCompletedChapterIds);
  const trackProgress = summarizeTrackLessonProgress({
    chapters: modules,
    completedChapterIds: liveCompletedChapterIds,
    chapterProgressById
  });
  const hasAuthoritativeModuleProgress = Object.keys(liveModuleProgressById).length > 0;
  const hasPersistedProgress =
    liveCompletedChapterIds.length > 0 ||
    Object.keys(chapterProgressById).length > 0 ||
    Object.keys(liveModuleProgressById).length > 0;

  // All modules are unlocked (locking disabled)
  const unlockedModuleIds = hasAuthoritativeModuleProgress
    ? new Set<string>(modules.map((m) => m.id))
    : new Set(modules.map((module) => module.id));

  const baseCards = modules.map((module) => {
    const moduleProgress = liveModuleProgressById[module.id];
    const chapterProgress = chapterProgressById[module.id];
    const isCompleted = moduleProgress
      ? moduleProgress.isCompleted
      : completedSet.has(module.id);
    const lessonsDone = clampLessonProgress(
      chapterProgress,
      module.sections.length,
      isCompleted
    );
    const hasAnyProgress = Boolean(
      lessonsDone > 0 ||
        moduleProgress?.currentLessonId ||
        moduleProgress?.lastVisitedRoute ||
        chapterProgress?.currentLessonId ||
        chapterProgress?.lastVisitedRoute
    );
    const lastActiveAt = moduleProgress?.updatedAt ?? chapterProgress?.lastActiveAt ?? null;
    const currentLessonId = moduleProgress?.currentLessonId ?? chapterProgress?.currentLessonId ?? null;
    const lastVisitedRoute =
      moduleProgress?.lastVisitedRoute ?? chapterProgress?.lastVisitedRoute ?? null;

    return {
      module,
      lessonsDone,
      lessonsTotal: module.sections.length,
      isCompleted,
      checkpointMeta: getModuleCheckpointMeta({
        topic: doc.topic,
        chapter: module,
        lessonsRead: lessonsDone,
        lessonsTotal: module.sections.length,
        isCompleted
      }),
      isUnlocked: unlockedModuleIds.has(module.id),
      hasAnyProgress,
      lastActiveAt,
      href: buildModuleHref({
        topic: doc.topic,
        trackSlug: track.slug,
        chapterId: module.id,
        currentLessonId,
        lastVisitedRoute
      })
    };
  });

  const activeModuleId =
    [...baseCards]
      .filter((card) => card.isUnlocked && !card.isCompleted && card.hasAnyProgress)
      .sort(
        (left, right) =>
          new Date(right.lastActiveAt ?? 0).getTime() -
          new Date(left.lastActiveAt ?? 0).getTime()
      )[0]?.module.id ??
    baseCards.find((card) => card.isUnlocked && !card.isCompleted)?.module.id ??
    baseCards.find((card) => card.isUnlocked)?.module.id ??
    null;

  const moduleCards = baseCards.map((card) => {
    const status: ModuleStatus = card.isCompleted
      ? 'completed'
      : card.module.id === activeModuleId
        ? 'active'
        : !card.isUnlocked
          ? 'locked'
          : 'available';

    const progressPct =
      card.lessonsTotal > 0
        ? Math.round((card.lessonsDone / card.lessonsTotal) * 100)
        : 0;

    return {
      ...card,
      progressPct,
      status
    };
  });

  const { totalLessons, completedLessons, completedModules, progressPct: overallProgressPct } =
    trackProgress;
  const topicLabel = doc.title.replace(/\s+Modules?$/i, '').trim() || doc.title;

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl" style={accentVars}>
          <Link
            href={`/learn/${doc.topic}/theory`}
            className="mb-8 inline-flex items-center gap-2 font-mono text-[10px] text-on-surface-variant transition-colors hover:text-primary uppercase tracking-widest"
          >
            <ArrowLeft className="h-4 w-4" />
            Track Gallery
          </Link>

          {/* Header banner */}
          <header
            className="relative overflow-hidden glass-panel p-8"
            style={{ borderColor: `rgba(${ta.rgb},0.2)`, border: `1px solid rgba(${ta.rgb},0.2)` }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
              <div className="space-y-4">
                <h2 className="font-mono text-xs tracking-[0.3em]" style={{ color: ta.color }}>JOURNEY_MANIFEST</h2>
                <h1 className="font-headline text-4xl lg:text-5xl font-black text-on-surface tracking-tighter">
                  {track.title || track.label}
                </h1>
                {track.subtitle && (
                  <p className="max-w-3xl text-sm text-on-surface-variant">
                    {track.subtitle}
                  </p>
                )}
                <div className="flex gap-12 font-mono text-sm text-on-surface-variant">
                  <div><span style={{ color: ta.color }}>TOTAL_MODULES:</span> {track.chapterCount}</div>
                  <div><span style={{ color: ta.color }}>SYNC_TIME:</span> {track.totalMinutes}M</div>
                </div>
              </div>
              <div className="w-full md:w-96 space-y-2">
                <div className="flex justify-between font-mono text-xs" style={{ color: ta.color }}>
                  <span>PROGRESS_CORE</span>
                  <span>{overallProgressPct}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-3" style={{ backgroundColor: `rgba(${ta.rgb},0.3)` }} />
                  <div
                    className="flex-1 flex gap-0.5 p-1 bg-black/30"
                    style={{ border: `2px solid rgba(${ta.rgb},0.2)` }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-3"
                        style={{
                          backgroundColor: i < Math.round((overallProgressPct / 100) * 12) ? ta.color : `rgba(${ta.rgb},0.08)`,
                          border: i >= Math.round((overallProgressPct / 100) * 12) ? `1px solid rgba(${ta.rgb},0.1)` : 'none',
                          opacity: i < Math.round((overallProgressPct / 100) * 12) ? 0.8 : 1
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* L-bracket corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: ta.color }} />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: ta.color }} />
          </header>

          <section className="mt-10">
            <div className="relative mx-auto max-w-5xl flex flex-col items-center">
              {/* Central data conduit */}
              <div
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px z-0"
                aria-hidden="true"
                style={{ background: `linear-gradient(to bottom, rgb(var(--theory-accent)), rgba(var(--theory-accent),0.4), transparent)` }}
              />

              <div className="space-y-0">
                {moduleCards.map((card, index) => {
                const isLeft = index % 2 !== 0;
                const title = stripModulePrefix(card.module.title) || card.module.title;
                const isCompleted = card.status === 'completed';
                const isLocked = card.status === 'locked';
                const nodeNumber = String(index + 1).padStart(2, '0');

                const cardContent = (
                  <div className={isLeft ? 'text-right' : ''}>
                    <div className="font-mono text-[10px] mb-2" style={{ color: ta.color }}>
                      [SKILL_NODE_{nodeNumber}]
                    </div>
                    <h3 className="font-headline text-lg font-bold mb-4 tracking-tight">
                      {title}
                    </h3>
                    <div className={`flex items-center font-mono text-[11px] text-on-surface-variant gap-4 ${
                      isLeft ? 'justify-end flex-row-reverse' : ''
                    }`}>
                      <div className="flex items-center gap-1">
                        <span className="text-[14px]">&#128214;</span>
                        {card.lessonsDone}/{card.lessonsTotal} LESSONS
                      </div>
                      {card.module.totalMinutes > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[14px]">&#9201;</span>
                          {card.module.totalMinutes} MIN
                        </div>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={card.module.id} className="relative w-full mb-20 flex justify-center">
                    {/* Center node */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-10 w-8 h-8 bg-[#0c0e10] border-2 z-10 flex items-center justify-center"
                      style={{
                        borderColor: isCompleted ? ta.color : isLocked ? undefined : `rgba(${ta.rgb},0.5)`,
                        boxShadow: isCompleted ? `0 0 15px rgba(${ta.rgb},0.5)` : undefined
                      }}
                    >
                      {isCompleted ? (
                        <div className="w-3 h-3" style={{ backgroundColor: ta.color }} />
                      ) : isLocked ? (
                        <Lock className="h-3 w-3 text-outline-variant" />
                      ) : (
                        <div className="w-2 h-2" style={{ backgroundColor: `rgba(${ta.rgb},0.6)` }} />
                      )}
                    </div>

                    {/* Module card */}
                    {isLocked ? (
                      <div
                        className={`relative w-full md:w-[320px] glass-panel border border-outline-variant/30 p-6 opacity-50 ${
                          isLeft ? 'md:mr-[400px]' : 'md:ml-[400px]'
                        }`}
                      >
                        {isLeft ? (
                          <div className="hidden md:block absolute -right-3 top-8 w-3 h-px bg-outline-variant/40" />
                        ) : (
                          <div className="hidden md:block absolute -left-3 top-8 w-3 h-px bg-outline-variant/40" />
                        )}
                        {cardContent}
                      </div>
                    ) : (
                      <Link
                        href={card.href}
                        className={`group relative w-full md:w-[320px] glass-panel border p-6 transition-all ${
                          isCompleted ? '' : 'border-outline-variant/30'
                        } ${isLeft ? 'md:mr-[400px]' : 'md:ml-[400px]'}`}
                        style={{
                          borderColor: isCompleted ? `rgba(${ta.rgb},0.3)` : undefined,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = ta.color; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = isCompleted ? `rgba(${ta.rgb},0.3)` : ''; }}
                      >
                        {isLeft ? (
                          <div className="hidden md:block absolute -right-3 top-8 w-3 h-px" style={{ backgroundColor: `rgba(${ta.rgb},0.4)` }} />
                        ) : (
                          <div className="hidden md:block absolute -left-3 top-8 w-3 h-px" style={{ backgroundColor: `rgba(${ta.rgb},0.4)` }} />
                        )}
                        {cardContent}
                      </Link>
                    )}
                  </div>
                );
              })}
              </div>

              {/* Mastery Complete terminal node */}
              <div className="relative w-full flex flex-col items-center mt-12">
                <div
                  className="w-16 h-16 border-4 flex items-center justify-center bg-[#0c0e10] z-10"
                  style={{
                    borderColor: overallProgressPct >= 100 ? ta.color : undefined,
                    boxShadow: overallProgressPct >= 100 ? `0 0 30px rgba(${ta.rgb},0.3)` : undefined
                  }}
                >
                  <Check className="h-8 w-8" style={{ color: overallProgressPct >= 100 ? ta.color : undefined }} />
                </div>
                <div className="mt-6 text-center">
                  <h4
                    className={`font-headline text-xl font-black uppercase tracking-widest ${
                      overallProgressPct >= 100 ? '' : 'text-outline-variant'
                    }`}
                    style={{ color: overallProgressPct >= 100 ? ta.color : undefined }}
                  >
                    Mastery Complete
                  </h4>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-1">
                    ALL NODES SYNCHRONIZED
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
