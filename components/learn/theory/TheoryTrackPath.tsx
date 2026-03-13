'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Lock, Play } from 'lucide-react';
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
  const accentVars = { '--theory-accent': topicStyle.accentRgb } as CSSProperties;
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

  const unlockedModuleIds = hasAuthoritativeModuleProgress
    ? modules.reduce<Set<string>>((set, module, index) => {
        if (index === 0) {
          set.add(module.id);
          return set;
        }

        const previousModule = modules[index - 1];
        const derivedUnlock =
          Boolean(previousModule && completedSet.has(previousModule.id)) ||
          completedSet.has(module.id);

        if (liveModuleProgressById[module.id]?.isUnlocked || derivedUnlock) {
          set.add(module.id);
        }
        return set;
      }, new Set<string>())
    : hasPersistedProgress
      ? modules.reduce<Set<string>>((set, module, index) => {
          if (index === 0) {
            set.add(module.id);
            return set;
          }

          const previousModule = modules[index - 1];
          const previousCompleted = previousModule
            ? completedSet.has(previousModule.id)
            : false;
          const hasInlineProgress = Boolean(
            chapterProgressById[module.id]?.sectionsRead ||
              chapterProgressById[module.id]?.currentLessonId ||
              chapterProgressById[module.id]?.lastVisitedRoute
          );
          if (previousCompleted || completedSet.has(module.id) || hasInlineProgress) {
            set.add(module.id);
          }
          return set;
        }, new Set<string>())
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
    <div className="min-h-screen bg-light-bg pb-24 dark:bg-dark-bg lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl" style={accentVars}>
          <Link
            href={`/learn/${doc.topic}/theory`}
            className="mb-8 inline-flex items-center gap-2 text-sm text-text-light-tertiary transition-colors hover:text-[rgb(var(--theory-accent))] dark:text-text-dark-tertiary"
          >
            <ArrowLeft className="h-4 w-4" />
            Track Gallery
          </Link>

          <header className="relative overflow-hidden rounded-[32px] border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(var(--theory-accent),0.16),transparent_34%),linear-gradient(180deg,rgba(var(--theory-accent),0.08),transparent_48%)]" />
            <div className="pointer-events-none absolute -right-12 top-10 h-44 w-44 rounded-full bg-[rgba(var(--theory-accent),0.1)] blur-3xl" />

            <div className="relative">
              <p
                className={`mb-2 text-xs font-medium uppercase tracking-[0.24em] ${topicStyle.accentTextClass}`}
              >
                {track.eyebrow}
              </p>
              <h1 className="text-[2rem] font-bold leading-tight text-text-light-primary dark:text-text-dark-primary">
                {track.label}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                {track.description}
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-light-border bg-light-bg px-4 py-3.5 dark:border-dark-border dark:bg-dark-bg">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Modules
                  </div>
                  <div className="mt-1.5 text-[1.95rem] font-semibold leading-none text-text-light-primary dark:text-text-dark-primary">
                    {track.chapterCount}
                  </div>
                </div>
                <div className="rounded-2xl border border-light-border bg-light-bg px-4 py-3.5 dark:border-dark-border dark:bg-dark-bg">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Time
                  </div>
                  <div className="mt-1.5 text-[1.95rem] font-semibold leading-none text-text-light-primary dark:text-text-dark-primary">
                    {track.totalMinutes}m
                  </div>
                </div>
                <div className="rounded-2xl border border-light-border bg-light-bg px-4 py-3.5 dark:border-dark-border dark:bg-dark-bg">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Completed
                  </div>
                  <div className="mt-1.5 text-[1.95rem] font-semibold leading-none text-text-light-primary dark:text-text-dark-primary">
                    {completedModules}/{track.chapterCount}
                  </div>
                </div>
                <div className="rounded-2xl border border-light-border bg-light-bg px-4 py-3.5 dark:border-dark-border dark:bg-dark-bg">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Lessons
                  </div>
                  <div className="mt-1.5 text-[1.95rem] font-semibold leading-none text-text-light-primary dark:text-text-dark-primary">
                    {completedLessons}/{totalLessons}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">
                    Overall track progress
                  </span>
                  <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {overallProgressPct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                  <div
                    className="h-full rounded-full bg-[rgb(var(--theory-accent))] transition-all duration-500"
                    style={{ width: `${overallProgressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </header>

          <section className="mt-7 rounded-[32px] border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface sm:p-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p
                  className={`text-xs font-medium uppercase tracking-[0.22em] ${topicStyle.accentTextClass}`}
                >
                  Module Path
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                  Follow the {topicLabel} journey
                </h2>
              </div>
              <p className="max-w-md text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Modules unlock in sequence when progress exists. If you are browsing fresh,
                you can jump straight into any module.
              </p>
            </div>

            <div className="relative mx-auto max-w-5xl">
              <div
                className="pointer-events-none absolute bottom-8 left-[2.625rem] top-8 w-px -translate-x-1/2 bg-white/[0.06] md:left-1/2"
                aria-hidden="true"
              >
                <div className="absolute inset-x-0 inset-y-0 bg-[rgba(var(--theory-accent),0.14)] blur-[1px]" />
              </div>

              <div className="space-y-5 md:space-y-4">
                {moduleCards.map((card, index) => {
                const alignsRight = index % 2 === 0;
                const title = stripModulePrefix(card.module.title) || card.module.title;
                const cardFrameClass =
                  card.status === 'active'
                    ? 'border-[rgba(var(--theory-accent),0.5)] bg-[rgba(var(--theory-accent),0.08)] shadow-[0_28px_60px_-40px_rgba(var(--theory-accent),0.42)]'
                    : card.status === 'completed'
                      ? 'border-success-300/65 bg-light-bg/92 shadow-[0_18px_40px_-34px_rgba(34,197,94,0.16)] dark:bg-dark-bg/86'
                      : card.status === 'available'
                        ? 'border-[rgba(var(--theory-accent),0.24)] bg-light-bg/92 shadow-[0_18px_40px_-34px_rgba(0,0,0,0.5)] dark:bg-dark-bg/86'
                        : 'border-light-border bg-light-bg/94 shadow-none dark:border-dark-border dark:bg-dark-bg/92';
                const nodeClass =
                  card.status === 'completed'
                    ? 'border-success-300 bg-success-500 text-white shadow-[0_0_0_10px_rgba(34,197,94,0.14)]'
                    : card.status === 'active'
                      ? 'border-[rgba(var(--theory-accent),0.78)] bg-[rgb(var(--theory-accent))] text-white shadow-[0_0_0_14px_rgba(var(--theory-accent),0.16)]'
                      : card.status === 'locked'
                        ? 'border-light-border bg-light-muted text-text-light-secondary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-secondary'
                        : 'border-[rgba(var(--theory-accent),0.28)] bg-light-bg text-[rgb(var(--theory-accent))] shadow-[0_0_0_8px_rgba(var(--theory-accent),0.08)] dark:bg-dark-bg';
                const metaLabel =
                  card.status === 'locked'
                    ? 'Unlocks after previous module'
                    : card.status === 'available'
                      ? `${card.lessonsTotal} lessons • ${card.module.totalMinutes} min`
                      : `${card.lessonsDone}/${card.lessonsTotal} lessons • ${card.module.totalMinutes} min`;
                const cardTitleClass =
                  card.status === 'locked'
                    ? 'text-text-light-primary dark:text-text-dark-primary'
                    : 'text-text-light-primary dark:text-text-dark-primary';
                const rowClass =
                  card.status === 'active'
                    ? 'min-h-[196px] md:min-h-[214px]'
                    : 'min-h-[148px] md:min-h-[164px]';

                const cardBody = (
                  <div
                    className={`relative overflow-hidden rounded-[26px] border p-4 transition-[border-color,transform,box-shadow,background-color] duration-200 md:p-5 ${cardFrameClass} ${
                      card.status === 'active'
                        ? 'md:scale-[1.05]'
                        : 'group-hover:translate-y-[-1px]'
                    }`}
                  >
                    {card.status === 'active' ? (
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(var(--theory-accent),0.12),transparent_68%)]" />
                    ) : null}

                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
                            <span>Module {String(card.module.number).padStart(2, '0')}</span>
                            {card.status === 'locked' ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : null}
                          </div>
                          <h3 className={`mt-2 text-[1.35rem] font-semibold leading-snug ${cardTitleClass}`}>
                            {title}
                          </h3>
                        </div>

                        {card.status === 'active' ? (
                          <span className="rounded-full border border-[rgba(var(--theory-accent),0.28)] bg-[rgba(var(--theory-accent),0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--theory-accent))]">
                            Current
                          </span>
                        ) : null}
                      </div>

                      {card.status === 'active' ? (
                        <p className="mt-3 max-w-md text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
                          {card.module.description}
                        </p>
                      ) : card.status === 'locked' ? (
                        <p className="mt-2 text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
                          Unlock this module by finishing the previous step in the track.
                        </p>
                      ) : (
                        <p className="mt-0 max-h-0 overflow-hidden text-sm leading-6 text-text-light-secondary opacity-0 transition-all duration-200 group-hover:mt-3 group-hover:max-h-24 group-hover:opacity-100 group-focus-visible:mt-3 group-focus-visible:max-h-24 group-focus-visible:opacity-100 dark:text-text-dark-secondary">
                          {card.module.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                            {metaLabel}
                          </span>
                          {card.checkpointMeta.hasCheckpoint ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${
                                card.checkpointMeta.state === 'passed'
                                  ? 'border-brand-500/30 bg-brand-500/10 text-brand-500'
                                  : card.checkpointMeta.state === 'ready'
                                    ? 'border-warning-500/30 bg-warning-500/10 text-warning-600 dark:text-warning-400'
                                    : 'border-light-border bg-light-bg text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary'
                              }`}
                            >
                              {card.checkpointMeta.state === 'passed' ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : null}
                              {card.checkpointMeta.label}
                            </span>
                          ) : null}
                        </div>

                        {card.status === 'active' ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--theory-accent))] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_-28px_rgba(var(--theory-accent),0.85)]">
                            Continue
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );

                const node = (
                  <div className="relative flex justify-center">
                    {card.status === 'active' ? (
                      <span className="absolute inset-[2px] rounded-full bg-[rgba(var(--theory-accent),0.14)] animate-[pulse_4.8s_ease-in-out_infinite]" />
                    ) : null}
                    <div
                      className={`relative flex items-center justify-center rounded-full border-4 text-xl font-semibold transition-transform duration-200 group-hover:scale-[1.03] ${nodeClass} ${
                        card.status === 'active'
                          ? 'h-24 w-24'
                          : card.status === 'locked'
                            ? 'h-[76px] w-[76px]'
                            : 'h-20 w-20'
                      }`}
                    >
                      {card.status === 'completed' ? (
                        <Check className="h-7 w-7" />
                      ) : card.status === 'locked' ? (
                        <Lock className="h-5 w-5" />
                      ) : card.status === 'active' ? (
                        <Play className="ml-1 h-8 w-8" />
                      ) : (
                        <span>{card.module.number}</span>
                      )}
                    </div>
                  </div>
                );

                const rowContent = (
                  <div
                    className={`grid grid-cols-[84px_minmax(0,1fr)] items-center gap-4 md:grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)] md:gap-6 ${rowClass}`}
                  >
                    {alignsRight ? (
                      <div className="hidden md:block md:col-start-3">{cardBody}</div>
                    ) : (
                      <div className="hidden md:block md:col-start-1">{cardBody}</div>
                    )}

                    <div className="col-start-1 row-start-1 flex justify-center md:col-start-2">
                      {node}
                    </div>

                    <div className="col-start-2 row-start-1 md:hidden">{cardBody}</div>
                  </div>
                );

                if (card.status === 'locked') {
                  return (
                    <div key={card.module.id} className="group relative">
                      {rowContent}
                    </div>
                  );
                }

                return (
                  <Link key={card.module.id} href={card.href} className="group relative block">
                    {rowContent}
                  </Link>
                );
              })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
