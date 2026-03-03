import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  Flame,
  Gauge,
  Lock,
  Rocket,
  type LucideIcon
} from 'lucide-react';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { getModuleCheckpointMeta } from '@/lib/learn/moduleCheckpoints';
import type { TheoryDoc } from '@/types/theory';
import type {
  TheoryCategorySlug,
  TheoryCategorySummary
} from '@/data/learn/theory/categories';

interface ChapterProgressSnapshot {
  sectionsRead: number;
  sectionsTotal: number;
  isCompleted: boolean;
  lastActiveAt: string | null;
  currentLessonId?: string | null;
  lastVisitedRoute?: string | null;
}

interface ModuleProgressSnapshot {
  moduleOrder: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  currentLessonId?: string | null;
  lastVisitedRoute?: string | null;
  updatedAt?: string | null;
}

interface TheoryCategorySelectorProps {
  doc: TheoryDoc;
  categories: TheoryCategorySummary[];
  completedChapterIds: string[];
  chapterProgressById?: Record<string, ChapterProgressSnapshot>;
  moduleProgressById?: Record<string, ModuleProgressSnapshot>;
}

type ChapterStatus = 'completed' | 'active' | 'locked' | 'available';

const CATEGORY_STYLE_MAP: Record<
  TheoryCategorySlug,
  {
    icon: LucideIcon;
    chipClass: string;
    iconWrapClass: string;
    progressClass: string;
  }
> = {
  history: {
    icon: Flame,
    chipClass:
      'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-900/60 dark:bg-warning-900/20 dark:text-warning-300',
    iconWrapClass:
      'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-900/60 dark:bg-warning-900/20 dark:text-warning-300',
    progressClass: 'bg-warning-500'
  },
  fundamentals: {
    icon: BookOpen,
    chipClass:
      'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900/60 dark:bg-brand-900/20 dark:text-brand-300',
    iconWrapClass:
      'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900/60 dark:bg-brand-900/20 dark:text-brand-300',
    progressClass: 'bg-brand-500'
  },
  architecture: {
    icon: Cpu,
    chipClass:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300',
    iconWrapClass:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300',
    progressClass: 'bg-sky-500'
  },
  optimization: {
    icon: Gauge,
    chipClass:
      'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/60 dark:bg-fuchsia-900/20 dark:text-fuchsia-300',
    iconWrapClass:
      'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/60 dark:bg-fuchsia-900/20 dark:text-fuchsia-300',
    progressClass: 'bg-fuchsia-500'
  },
  data: {
    icon: Database,
    chipClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300',
    iconWrapClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300',
    progressClass: 'bg-emerald-500'
  },
  advanced: {
    icon: Rocket,
    chipClass:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-900/20 dark:text-orange-300',
    iconWrapClass:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-900/20 dark:text-orange-300',
    progressClass: 'bg-orange-500'
  }
};

const parseRouteQuery = (route: string) => {
  const [path, query = ''] = route.split('?');
  return { path, params: new URLSearchParams(query) };
};

const buildModuleHref = ({
  topic,
  chapterId,
  currentLessonId,
  lastVisitedRoute
}: {
  topic: string;
  chapterId: string;
  currentLessonId: string | null;
  lastVisitedRoute: string | null;
}) => {
  const fallbackParams = new URLSearchParams();
  fallbackParams.set('chapter', chapterId);
  if (currentLessonId) {
    fallbackParams.set('lesson', currentLessonId);
  }
  const fallbackHref = `/learn/${topic}/theory/all?${fallbackParams.toString()}`;

  if (typeof lastVisitedRoute !== 'string') {
    return fallbackHref;
  }

  const topicTheoryPrefix = `/learn/${topic}/theory/`;
  if (!lastVisitedRoute.startsWith(topicTheoryPrefix)) {
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

export const TheoryCategorySelector = ({
  doc,
  categories,
  completedChapterIds,
  chapterProgressById = {},
  moduleProgressById = {}
}: TheoryCategorySelectorProps) => {
  const completedSet = new Set(completedChapterIds);
  const topicStyle = getTheoryTopicStyle(doc.topic);
  const hasAuthoritativeModuleProgress = Object.keys(moduleProgressById).length > 0;
  const totalMinutes = doc.chapters.reduce(
    (sum, chapter) => sum + chapter.totalMinutes,
    0
  );

  const chapterCategoryById = new Map<
    string,
    { slug: TheoryCategorySlug; label: string }
  >();
  categories.forEach((category) => {
    category.chapters.forEach((chapter) => {
      chapterCategoryById.set(chapter.id, {
        slug: category.slug,
        label: category.label
      });
    });
  });

  const chapterRows = [...doc.chapters]
    .sort((left, right) => left.number - right.number)
    .map((chapter) => {
      const categoryMeta = chapterCategoryById.get(chapter.id);
      const sessionProgress = chapterProgressById[chapter.id];
      const moduleProgress = moduleProgressById[chapter.id];
      const lessonsTotalFallback = Math.max(1, chapter.sections.length);
      const lessonsTotalRaw = Number(
        sessionProgress?.sectionsTotal ?? lessonsTotalFallback
      );
      const lessonsTotal = lessonsTotalRaw > 0 ? lessonsTotalRaw : lessonsTotalFallback;
      const baselineDone = completedSet.has(chapter.id) ? lessonsTotal : 0;
      const lessonsDoneRaw = Number(sessionProgress?.sectionsRead ?? baselineDone);
      const lessonsDone = Math.max(0, Math.min(lessonsTotal, lessonsDoneRaw));
      const isCompleted = moduleProgress
        ? moduleProgress.isCompleted
        : Boolean(sessionProgress?.isCompleted) ||
          completedSet.has(chapter.id) ||
          lessonsDone >= lessonsTotal;
      const currentLessonCandidate =
        typeof moduleProgress?.currentLessonId === 'string'
          ? moduleProgress.currentLessonId
          : typeof sessionProgress?.currentLessonId === 'string'
            ? sessionProgress.currentLessonId
            : null;
      const currentLessonId =
        currentLessonCandidate &&
        chapter.sections.some((section) => section.id === currentLessonCandidate)
          ? currentLessonCandidate
          : null;
      const lastVisitedRoute =
        typeof moduleProgress?.lastVisitedRoute === 'string'
          ? moduleProgress.lastVisitedRoute
          : typeof sessionProgress?.lastVisitedRoute === 'string'
            ? sessionProgress.lastVisitedRoute
            : null;

      return {
        chapter,
        categorySlug: categoryMeta?.slug ?? null,
        categoryLabel: categoryMeta?.label ?? 'All Modules',
        lessonsDone,
        lessonsTotal,
        isCompleted,
        checkpointMeta: getModuleCheckpointMeta({
          topic: doc.topic,
          chapter,
          lessonsRead: lessonsDone,
          lessonsTotal,
          isCompleted
        }),
        hasAnyProgress:
          lessonsDone > 0 || Boolean(currentLessonId) || Boolean(lastVisitedRoute),
        lastActiveAt: moduleProgress?.updatedAt ?? sessionProgress?.lastActiveAt ?? null,
        currentLessonId,
        lastVisitedRoute,
        isUnlocked: moduleProgress?.isUnlocked ?? null
      };
    });

  const unlockedChapterIds = hasAuthoritativeModuleProgress
    ? chapterRows.reduce<Set<string>>((set, row, index) => {
        if (index === 0) {
          set.add(row.chapter.id);
          return set;
        }

        const previousRow = chapterRows[index - 1];
        const derivedUnlock =
          Boolean(previousRow?.isCompleted) || completedSet.has(row.chapter.id);

        if (row.isUnlocked === true || (row.isUnlocked === null && derivedUnlock)) {
          set.add(row.chapter.id);
        }
        return set;
      }, new Set<string>())
    : chapterRows.reduce<Set<string>>((set, row, index, rows) => {
        if (index === 0) {
          set.add(row.chapter.id);
          return set;
        }

        const previousRow = rows[index - 1];
        const unlockedBySequence = Boolean(previousRow?.isCompleted);
        if (unlockedBySequence || row.isCompleted || row.hasAnyProgress) {
          set.add(row.chapter.id);
        }
        return set;
      }, new Set<string>());

  const activeFromProgress = chapterRows
    .filter(
      (row) =>
        unlockedChapterIds.has(row.chapter.id) && !row.isCompleted && row.hasAnyProgress
    )
    .sort((left, right) => {
      const leftTs = left.lastActiveAt ? new Date(left.lastActiveAt).getTime() : 0;
      const rightTs = right.lastActiveAt ? new Date(right.lastActiveAt).getTime() : 0;
      return rightTs - leftTs;
    })[0]?.chapter.id;

  const activeChapterId =
    activeFromProgress ??
    chapterRows.find((row) => unlockedChapterIds.has(row.chapter.id) && !row.isCompleted)
      ?.chapter.id ??
    chapterRows.find((row) => unlockedChapterIds.has(row.chapter.id))?.chapter.id ??
    null;

  const chapterCards = chapterRows.map((row) => {
    const isUnlocked = unlockedChapterIds.has(row.chapter.id);
    const status: ChapterStatus = row.isCompleted
      ? 'completed'
      : row.chapter.id === activeChapterId
        ? 'active'
        : !isUnlocked
          ? 'locked'
          : 'available';

    const chapterProgressPct =
      row.lessonsTotal > 0 ? Math.round((row.lessonsDone / row.lessonsTotal) * 100) : 0;
    const href = buildModuleHref({
      topic: doc.topic,
      chapterId: row.chapter.id,
      currentLessonId: row.currentLessonId,
      lastVisitedRoute: row.lastVisitedRoute
    });

    return {
      ...row,
      status,
      chapterProgressPct,
      href
    };
  });

  const totalLessons = chapterCards.reduce((sum, row) => sum + row.lessonsTotal, 0);
  const completedLessons = chapterCards.reduce((sum, row) => sum + row.lessonsDone, 0);
  const overallProgressPct =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  type ChapterCard = (typeof chapterCards)[number];
  const chapterCardById = new Map<string, ChapterCard>(
    chapterCards.map((card) => [card.chapter.id, card])
  );

  const chapterGroups = categories
    .map((category) => {
      const cards = [...category.chapters]
        .sort((left, right) => left.number - right.number)
        .map((chapter) => chapterCardById.get(chapter.id))
        .filter((card): card is ChapterCard => Boolean(card));

      if (cards.length === 0) {
        return null;
      }

      return {
        category,
        cards,
        totalLessons: cards.reduce((sum, card) => sum + card.lessonsTotal, 0),
        completedLessons: cards.reduce((sum, card) => sum + card.lessonsDone, 0),
        unlockedModules: cards.filter((card) => card.status !== 'locked').length,
        completedModules: cards.filter((card) => card.status === 'completed').length,
        hasActiveModule: cards.some((card) => card.status === 'active'),
        hasAnyProgress: cards.some((card) => card.hasAnyProgress),
        previewTitles: cards.slice(0, 3).map((card) =>
          card.chapter.title.replace(/^Module\s*\d+\s*:\s*/i, '')
        )
      };
    })
    .filter(
      (
        item
      ): item is {
        category: TheoryCategorySummary;
        cards: ChapterCard[];
        totalLessons: number;
        completedLessons: number;
        unlockedModules: number;
        completedModules: number;
        hasActiveModule: boolean;
        hasAnyProgress: boolean;
        previewTitles: string[];
      } => Boolean(item)
    );

  if (doc.chapters.length === 0 || chapterGroups.length === 0) {
    return (
      <div className="min-h-screen bg-light-bg pb-24 dark:bg-dark-bg lg:pb-8">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <Link
              href="/learn/theory"
              className="mb-8 inline-flex items-center gap-2 text-sm text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
            >
              <ArrowLeft className="h-4 w-4" />
              All Topics
            </Link>

            <header className="mb-10 max-w-3xl">
              <p
                className={`mb-2 text-xs font-medium uppercase tracking-[0.24em] ${topicStyle.accentTextClass}`}
              >
                Theory
              </p>
              <h1 className="mb-2 text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {doc.title}
              </h1>
              <p className="max-w-3xl text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {doc.description}
              </p>
            </header>

            <section className="rounded-[28px] border border-light-border bg-light-surface p-8 dark:border-dark-border dark:bg-dark-surface">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${topicStyle.badgeClass}`}
              >
                Empty Category
              </span>
              <h2 className="mt-4 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                No material is published right now
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                The topic stays available in the library, but its modules, lessons, and
                reference content have been cleared. Add new content later without
                recreating the category.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                  0 modules
                </span>
                <span className="rounded-full border border-light-border bg-light-bg px-3 py-1.5 text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                  0 min
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg pb-24 dark:bg-dark-bg lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/learn/theory"
            className="mb-8 inline-flex items-center gap-2 text-sm text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
          >
            <ArrowLeft className="h-4 w-4" />
            All Topics
          </Link>

          <header className="mb-10">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-brand-500">
              Theory
            </p>
            <h1 className="mb-2 text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {doc.title}
            </h1>
            <p className="max-w-3xl text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {doc.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-text-light-secondary dark:text-text-dark-secondary">
                {doc.chapters.length} modules · {totalMinutes} min total
              </span>
              <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                {completedLessons}/{totalLessons} lessons read
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${overallProgressPct}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              Browse the PySpark curriculum as a gallery of themed tracks, then open any
              unlocked module directly from its card.
            </p>
          </header>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-brand-500">
                  Category Gallery
                </p>
                <h2 className="mt-2 text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                  Different ways into the course
                </h2>
              </div>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                {chapterGroups.length} categories
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {chapterGroups.map((group, index) => {
                const style = CATEGORY_STYLE_MAP[group.category.slug];
                const Icon = style.icon;
                const progressPct =
                  group.totalLessons > 0
                    ? Math.round((group.completedLessons / group.totalLessons) * 100)
                    : 0;
                const categoryStatus = group.hasActiveModule
                  ? 'In progress'
                  : group.completedModules === group.cards.length
                    ? 'Completed'
                    : group.hasAnyProgress
                      ? 'Resume'
                      : group.unlockedModules > 0
                        ? 'Open'
                        : 'Locked';

                return (
                  <section
                    key={group.category.slug}
                    className="overflow-hidden rounded-2xl border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface"
                  >
                    <div className="border-b border-light-border px-5 py-5 dark:border-dark-border">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.chipClass}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            Category {String(index + 1).padStart(2, '0')}
                          </span>
                          <h3 className="mt-4 text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                            {group.category.label}
                          </h3>
                          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
                            {group.category.description}
                          </p>
                        </div>

                        <div
                          className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border sm:flex ${style.iconWrapClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-light-hover px-3 py-1 text-text-light-secondary dark:bg-dark-hover dark:text-text-dark-secondary">
                          {group.cards.length} modules
                        </span>
                        <span className="rounded-full bg-light-hover px-3 py-1 text-text-light-secondary dark:bg-dark-hover dark:text-text-dark-secondary">
                          {group.category.totalMinutes} min
                        </span>
                        <span className="rounded-full bg-light-hover px-3 py-1 text-text-light-secondary dark:bg-dark-hover dark:text-text-dark-secondary">
                          {group.completedLessons}/{group.totalLessons} lessons
                        </span>
                        <span className="rounded-full bg-light-hover px-3 py-1 text-text-light-secondary dark:bg-dark-hover dark:text-text-dark-secondary">
                          {categoryStatus}
                        </span>
                      </div>

                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${style.progressClass}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {group.previewTitles.map((title) => (
                          <span
                            key={`${group.category.slug}-${title}`}
                            className="rounded-full border border-light-border px-3 py-1 text-xs text-text-light-tertiary dark:border-dark-border dark:text-text-dark-tertiary"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="px-4 py-3">
                      <div className="overflow-hidden rounded-xl border border-light-border dark:border-dark-border">
                        {group.cards.map((card, cardIndex) => {
                          const isComplete = card.status === 'completed';
                          const isActive = card.status === 'active';
                          const isLocked = card.status === 'locked';
                          const statusText = isComplete
                            ? 'Completed'
                            : isActive
                              ? 'Continue'
                              : isLocked
                                ? 'Locked'
                                : card.hasAnyProgress
                                  ? 'Resume'
                                  : 'Open';
                          const row = (
                            <div
                              className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                                cardIndex > 0
                                  ? 'border-t border-light-border dark:border-dark-border'
                                  : ''
                              } ${
                                isLocked
                                  ? 'opacity-50'
                                  : 'hover:bg-light-hover dark:hover:bg-dark-hover'
                              }`}
                            >
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                  isComplete
                                    ? 'bg-success-500'
                                    : isActive
                                      ? 'bg-warning-500'
                                      : 'bg-light-border dark:bg-dark-border'
                                }`}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                                  {card.chapter.title}
                                </div>
                                <div className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                                  {card.lessonsDone}/{card.lessonsTotal} lessons ·{' '}
                                  {card.chapter.totalMinutes} min
                                </div>
                                {card.checkpointMeta.hasCheckpoint ? (
                                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
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
                                    <span className="text-text-light-tertiary dark:text-text-dark-tertiary">
                                      {card.checkpointMeta.detail}
                                    </span>
                                  </div>
                                ) : null}
                              </div>

                              <div className="shrink-0 text-right">
                                <div className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                                  {statusText}
                                </div>
                                {!isLocked ? (
                                  <div className="mt-1 text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
                                    {card.chapterProgressPct}%
                                  </div>
                                ) : null}
                              </div>

                              <span className="shrink-0 text-text-light-tertiary dark:text-text-dark-tertiary">
                                {isLocked ? (
                                  <Lock className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </span>
                            </div>
                          );

                          return isLocked ? (
                            <article
                              key={card.chapter.id}
                              aria-label={`${card.chapter.title} locked`}
                            >
                              {row}
                            </article>
                          ) : (
                            <Link
                              key={card.chapter.id}
                              href={card.href}
                              aria-current={isActive ? 'step' : undefined}
                            >
                              {row}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </section>

          <div className="mt-8 flex flex-wrap gap-4 text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success-500" />
              Completed
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning-500" />
              In progress
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-light-border dark:bg-dark-border" />
              Locked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
