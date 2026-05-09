import Link from 'next/link';
import {
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

// Maps doc.topic to the brand mark we ship in /public/brand. Missing keys
// fall through to no-logo rendering rather than 404 — useful for topics
// that don't yet have a dedicated mark.
const TOPIC_LOGO_PATHS: Record<string, string> = {
  pyspark: '/brand/pyspark-track-star.svg',
  fabric: '/brand/microsoft-fabric-2023.svg',
  airflow: '/brand/apache-airflow-logo.svg',
  sql: '/brand/sql-logo.svg',
  'python-de': '/brand/python-logo.svg',
  databricks: '/brand/databricks-logo.svg',
  snowflake: '/brand/snowflake-logo.svg',
  dbt: '/brand/dbt-logo.svg',
  kafka: '/brand/apache-kafka-logo.svg',
  flink: '/brand/apache-flink-logo.svg',
  iceberg: '/brand/apache-iceberg-logo.svg',
};

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
      'border-warning-200 bg-warning-50 text-warning-700   ',
    iconWrapClass:
      'border-warning-200 bg-warning-50 text-warning-700   ',
    progressClass: 'bg-warning-500'
  },
  fundamentals: {
    icon: BookOpen,
    chipClass:
      'border-primary-fixed bg-primary-fixed text-primary-dim   ',
    iconWrapClass:
      'border-primary-fixed bg-primary-fixed text-primary-dim   ',
    progressClass: 'bg-primary'
  },
  architecture: {
    icon: Cpu,
    chipClass:
      'border-sky-200 bg-sky-50 text-sky-700   ',
    iconWrapClass:
      'border-sky-200 bg-sky-50 text-sky-700   ',
    progressClass: 'bg-sky-500'
  },
  optimization: {
    icon: Gauge,
    chipClass:
      'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700   ',
    iconWrapClass:
      'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700   ',
    progressClass: 'bg-fuchsia-500'
  },
  data: {
    icon: Database,
    chipClass:
      'border-primary-fixed bg-primary-fixed text-primary-dim   ',
    iconWrapClass:
      'border-primary-fixed bg-primary-fixed text-primary-dim   ',
    progressClass: 'bg-primary'
  },
  advanced: {
    icon: Rocket,
    chipClass:
      'border-orange-200 bg-orange-50 text-orange-700   ',
    iconWrapClass:
      'border-orange-200 bg-orange-50 text-orange-700   ',
    progressClass: 'bg-orange-500'
  }
};

const parseRouteQuery = (route: string) => {
  const [rawPath, query = ''] = route.split('?');
  // Rewrite legacy `/learn/<topic>/theory/...` paths to the canonical
  // `/theory/...` shape so we don't bounce users through the redirect.
  const path = rawPath.replace(/^\/learn\/[^/]+\/theory(\/.*)?$/, '/theory$1');
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
  const fallbackHref = `/theory/all?${fallbackParams.toString()}`;

  if (typeof lastVisitedRoute !== 'string') {
    return fallbackHref;
  }

  // Accept both the new canonical /theory/ and the legacy /learn/<topic>/theory/
  // shape stored in older module_progress rows.
  const isCanonical = lastVisitedRoute.startsWith('/theory/');
  const isLegacy = lastVisitedRoute.startsWith(`/learn/${topic}/theory/`);
  if (!isCanonical && !isLegacy) {
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
      <div className="min-h-screen bg-surface pb-24 lg:pb-8">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <header className="mb-10 max-w-3xl">
              <p
                className={`mb-2 text-xs font-mono font-bold uppercase tracking-[0.24em] ${topicStyle.accentTextClass}`}
              >
                Theory
              </p>
              <h1
                className="mb-2 flex items-center gap-3 text-3xl font-bold text-on-surface"
                style={{
                  fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
                  letterSpacing: '-0.035em',
                }}
              >
                {TOPIC_LOGO_PATHS[doc.topic] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={TOPIC_LOGO_PATHS[doc.topic]}
                    alt=""
                    aria-hidden="true"
                    className="h-9 w-9 shrink-0 object-contain"
                  />
                )}
                {doc.title}
              </h1>
              <p className="max-w-3xl text-sm text-on-surface-variant">
                {doc.description}
              </p>
            </header>

            <section className="border border-surface-dim bg-surface-container p-8">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.18em] ${topicStyle.badgeClass}`}
              >
                Empty Category
              </span>
              <h2 className="mt-4 text-2xl font-semibold text-on-surface">
                No material is published right now
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                The topic stays available in the library, but its modules, lessons, and
                reference content have been cleared. Add new content later without
                recreating the category.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-surface-dim bg-surface px-3 py-1.5 text-on-surface-variant">
                  0 modules
                </span>
                <span className="rounded-full border border-surface-dim bg-surface px-3 py-1.5 text-on-surface-variant">
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
    <div className="min-h-screen bg-surface pb-24 lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-10">
            <p className="mb-2 text-xs font-mono font-bold uppercase tracking-[0.24em] text-primary">
              Theory
            </p>
            <h1
              className="mb-2 flex items-center gap-3 text-3xl font-bold text-on-surface"
              style={{
                fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
                letterSpacing: '-0.035em',
              }}
            >
              {TOPIC_LOGO_PATHS[doc.topic] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={TOPIC_LOGO_PATHS[doc.topic]}
                  alt=""
                  aria-hidden="true"
                  className="h-9 w-9 shrink-0 object-contain"
                />
              )}
              {doc.title}
            </h1>
            <p className="max-w-3xl text-sm text-on-surface-variant">
              {doc.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-on-surface-variant">
                {doc.chapters.length} modules · {totalMinutes} min total
              </span>
              <span className="font-medium text-on-surface">
                {completedLessons}/{totalLessons} lessons read
              </span>
            </div>
            <div className="mt-2 w-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
              <div style={{ width: `${overallProgressPct}%`, height: '100%', background: '#fff', borderRadius: 100, opacity: 0.85, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">
              Browse the PySpark curriculum as a gallery of themed tracks, then open any
              unlocked module directly from its card.
            </p>
          </header>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-[0.22em] text-primary">
                  Category Gallery
                </p>
                <h2 className="mt-2 text-xl font-semibold text-on-surface">
                  Different ways into the course
                </h2>
              </div>
              <p className="text-sm text-on-surface-variant">
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
                    className="overflow-hidden border border-surface-dim bg-surface-container"
                  >
                    <div className="border-b border-surface-dim px-5 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.18em] ${style.chipClass}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            Category {String(index + 1).padStart(2, '0')}
                          </span>
                          <h3 className="mt-4 text-xl font-semibold text-on-surface">
                            {group.category.label}
                          </h3>
                          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                            {group.category.description}
                          </p>
                        </div>

                        <div
                          className={`hidden h-12 w-12 shrink-0 items-center justify-center  border sm:flex ${style.iconWrapClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-surface-container px-3 py-1 text-on-surface-variant">
                          {group.cards.length} modules
                        </span>
                        <span className="rounded-full bg-surface-container px-3 py-1 text-on-surface-variant">
                          {group.category.totalMinutes} min
                        </span>
                        <span className="rounded-full bg-surface-container px-3 py-1 text-on-surface-variant">
                          {group.completedLessons}/{group.totalLessons} lessons
                        </span>
                        <span className="rounded-full bg-surface-container px-3 py-1 text-on-surface-variant">
                          {categoryStatus}
                        </span>
                      </div>

                      <div className="mt-4 w-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
                        <div style={{ width: `${progressPct}%`, height: '100%', background: '#fff', borderRadius: 100, opacity: 0.85, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {group.previewTitles.map((title) => (
                          <span
                            key={`${group.category.slug}-${title}`}
                            className="rounded-full border border-surface-dim px-3 py-1 text-xs text-on-surface-variant"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="px-4 py-3">
                      <div className="overflow-hidden rounded-xl border border-surface-dim">
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
                                  ? 'border-t border-surface-dim '
                                  : ''
                              } ${
                                isLocked
                                  ? 'opacity-50'
                                  : 'hover:bg-surface-container '
                              }`}
                            >
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                  isComplete
                                    ? 'bg-success-500'
                                    : isActive
                                      ? 'bg-warning-500'
                                      : 'bg-surface-dim '
                                }`}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-on-surface">
                                  {card.chapter.title}
                                </div>
                                <div className="mt-1 text-xs text-on-surface-variant">
                                  {card.lessonsDone}/{card.lessonsTotal} lessons ·{' '}
                                  {card.chapter.totalMinutes} min
                                </div>
                                {card.checkpointMeta.hasCheckpoint ? (
                                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                                        card.checkpointMeta.state === 'passed'
                                          ? 'border-primary/30 bg-primary/10 text-primary'
                                          : card.checkpointMeta.state === 'ready'
                                            ? 'border-warning-500/30 bg-warning-500/10 text-warning-600 '
                                            : 'border-surface-dim bg-surface text-on-surface-variant   '
                                      }`}
                                    >
                                      {card.checkpointMeta.state === 'passed' ? (
                                        <CheckCircle2 className="h-3 w-3" />
                                      ) : null}
                                      {card.checkpointMeta.label}
                                    </span>
                                    <span className="text-on-surface-variant">
                                      {card.checkpointMeta.detail}
                                    </span>
                                  </div>
                                ) : null}
                              </div>

                              <div className="shrink-0 text-right">
                                <div className="text-xs font-medium text-on-surface-variant">
                                  {statusText}
                                </div>
                                {!isLocked ? (
                                  <div className="mt-1 text-[11px] text-on-surface-variant">
                                    {card.chapterProgressPct}%
                                  </div>
                                ) : null}
                              </div>

                              <span className="shrink-0 text-on-surface-variant">
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

          <div className="mt-8 flex flex-wrap gap-4 text-[11px] text-on-surface-variant">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success-500" />
              Completed
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning-500" />
              In progress
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-surface-dim" />
              Locked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
