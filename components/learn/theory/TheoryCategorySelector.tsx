import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Check, Lock } from 'lucide-react';
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
}

interface TheoryCategorySelectorProps {
  doc: TheoryDoc;
  categories: TheoryCategorySummary[];
  completedChapterIds: string[];
  chapterProgressById?: Record<string, ChapterProgressSnapshot>;
}

type ChapterStatus = 'completed' | 'active' | 'locked' | 'available';

const CATEGORY_EMOJI: Record<TheoryCategorySlug, string> = {
  fundamentals: '📘',
  history: '🕰️',
  architecture: '⚙️',
  optimization: '🚀',
  data: '🗄️',
  advanced: '✨'
};

export const TheoryCategorySelector = ({
  doc,
  categories,
  completedChapterIds,
  chapterProgressById = {}
}: TheoryCategorySelectorProps) => {
  const completedSet = new Set(completedChapterIds);
  const totalMinutes = doc.chapters.reduce((sum, chapter) => sum + chapter.totalMinutes, 0);

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
      const lessonsTotalFallback = Math.max(1, chapter.sections.length);
      const lessonsTotalRaw = Number(sessionProgress?.sectionsTotal ?? lessonsTotalFallback);
      const lessonsTotal = lessonsTotalRaw > 0 ? lessonsTotalRaw : lessonsTotalFallback;
      const baselineDone = completedSet.has(chapter.id) ? lessonsTotal : 0;
      const lessonsDoneRaw = Number(sessionProgress?.sectionsRead ?? baselineDone);
      const lessonsDone = Math.max(0, Math.min(lessonsTotal, lessonsDoneRaw));
      const isCompleted =
        Boolean(sessionProgress?.isCompleted) ||
        completedSet.has(chapter.id) ||
        lessonsDone >= lessonsTotal;

      return {
        chapter,
        categorySlug: categoryMeta?.slug ?? null,
        categoryLabel: categoryMeta?.label ?? 'All Chapters',
        lessonsDone,
        lessonsTotal,
        isCompleted,
        lastActiveAt: sessionProgress?.lastActiveAt ?? null
      };
    });

  const activeFromProgress = chapterRows
    .filter((row) => !row.isCompleted && row.lessonsDone > 0)
    .sort((left, right) => {
      const leftTs = left.lastActiveAt ? new Date(left.lastActiveAt).getTime() : 0;
      const rightTs = right.lastActiveAt ? new Date(right.lastActiveAt).getTime() : 0;
      return rightTs - leftTs;
    })[0]?.chapter.id;

  const activeChapterId =
    activeFromProgress ??
    chapterRows.find((row) => !row.isCompleted)?.chapter.id ??
    null;
  const activeIndex = chapterRows.findIndex((row) => row.chapter.id === activeChapterId);

  const chapterCards = chapterRows.map((row, index) => {
    const shouldLock =
      activeIndex >= 0 &&
      index > activeIndex &&
      !row.isCompleted &&
      row.lessonsDone === 0;
    const status: ChapterStatus = row.isCompleted
      ? 'completed'
      : row.chapter.id === activeChapterId
        ? 'active'
        : shouldLock
          ? 'locked'
          : 'available';

    const chapterProgressPct =
      row.lessonsTotal > 0 ? Math.round((row.lessonsDone / row.lessonsTotal) * 100) : 0;
    const chapterIcon = row.categorySlug ? CATEGORY_EMOJI[row.categorySlug] : '📘';
    const href = row.categorySlug
      ? `/learn/${doc.topic}/theory/${row.categorySlug}?chapter=${row.chapter.id}`
      : `/learn/${doc.topic}/theory/all?chapter=${row.chapter.id}`;

    return {
      ...row,
      status,
      chapterProgressPct,
      chapterIcon,
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

      const completedCount = cards.filter((card) => card.status === 'completed').length;
      const lessonsDone = cards.reduce((sum, card) => sum + card.lessonsDone, 0);
      const lessonsTotal = cards.reduce((sum, card) => sum + card.lessonsTotal, 0);
      const progressPct =
        lessonsTotal > 0 ? Math.round((lessonsDone / lessonsTotal) * 100) : 0;

      return {
        category,
        cards,
        completedCount,
        lessonsDone,
        lessonsTotal,
        progressPct
      };
    })
    .filter(
      (
        item
      ): item is {
        category: TheoryCategorySummary;
        cards: ChapterCard[];
        completedCount: number;
        lessonsDone: number;
        lessonsTotal: number;
        progressPct: number;
      } => Boolean(item)
    );

  // Flatten all chapters in order, tagged with their group
  const allRows = chapterGroups.flatMap((group) =>
    group.cards.map((card, indexInGroup) => ({
      card,
      group,
      isFirstInGroup: indexInGroup === 0
    }))
  );
  const lastIndex = allRows.length - 1;

  return (
    <div className="min-h-screen bg-light-bg pb-24 dark:bg-dark-bg lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">

          <Link
            href="/learn"
            className="mb-8 inline-flex items-center gap-2 text-sm text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
          >
            <ArrowLeft className="h-4 w-4" />
            All Topics
          </Link>

          <header className="mb-8">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.24em] text-brand-500">
              Theory
            </p>
            <h1 className="mb-1 text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {doc.title}
            </h1>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {doc.chapters.length} chapters · {totalMinutes} min total
            </p>
          </header>

          {/* Overall progress */}
          <div className="mb-10 rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                Overall Progress
              </span>
              <span className="font-semibold text-emerald-500">
                {completedLessons}/{totalLessons} lessons
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${overallProgressPct}%` }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div>
            {allRows.map(({ card, group, isFirstInGroup }, rowIndex) => {
              const isComplete = card.status === 'completed';
              const isActive = card.status === 'active';
              const isLocked = card.status === 'locked';
              const isLast = rowIndex === lastIndex;
              const accentWidth = isComplete ? 100 : card.chapterProgressPct;

              const cardContent = (
                <div
                  className={`rounded-xl border p-4 transition-colors ${
                    isActive
                      ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10'
                      : isComplete
                        ? 'border-emerald-500/25 bg-light-surface dark:bg-dark-surface'
                        : isLocked
                          ? 'border-light-border/50 bg-light-surface/50 opacity-60 dark:border-dark-border/50 dark:bg-dark-surface/50'
                          : 'border-light-border bg-light-surface hover:border-brand-500/30 dark:border-dark-border dark:bg-dark-surface dark:hover:border-brand-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
                          Ch. {card.chapter.number}
                        </span>
                        {isActive && (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                            Active
                          </span>
                        )}
                      </div>
                      <h2 className={`mt-0.5 text-base font-semibold leading-snug ${
                        isLocked
                          ? 'text-text-light-tertiary/60 dark:text-text-dark-tertiary/60'
                          : 'text-text-light-primary dark:text-text-dark-primary'
                      }`}>
                        {card.chapter.title}
                      </h2>
                    </div>
                    <div className="shrink-0 text-right text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                      <div>{card.chapter.totalMinutes} min</div>
                      <div className="mt-0.5">{card.lessonsDone}/{card.lessonsTotal}</div>
                    </div>
                  </div>

                  {!isLocked && (
                    <div className="mt-3">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${accentWidth}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                        Continue reading <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    ) : isComplete ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                        <Check className="h-3.5 w-3.5" /> Completed
                      </span>
                    ) : isLocked ? (
                      <span className="inline-flex items-center gap-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                        <Lock className="h-3.5 w-3.5" /> Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-500">
                        Open chapter <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );

              return (
                <div key={card.chapter.id}>
                  {/* Category label — shown before first card of each group */}
                  {isFirstInGroup && (
                    <div className="flex items-center gap-3 pb-3 pt-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-500/40 bg-brand-500/10 text-[11px]">
                        {CATEGORY_EMOJI[group.category.slug] ?? '📘'}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                          {group.category.label}
                        </span>
                        <span className="text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
                          {group.completedCount}/{group.cards.length} chapters
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Row: dot + connector + card */}
                  <div className="flex gap-4">
                    {/* Left: dot + vertical line */}
                    <div className="flex w-6 shrink-0 flex-col items-center">
                      <div
                        className={`mt-4 h-3 w-3 shrink-0 rounded-full border-2 ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-500/50'
                            : isComplete
                              ? 'border-emerald-500 bg-emerald-500'
                              : isLocked
                                ? 'border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg'
                                : 'border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg'
                        }`}
                      />
                      {!isLast && (
                        <div className="mt-1 w-0.5 flex-1 bg-light-border dark:bg-dark-border" />
                      )}
                    </div>

                    {/* Right: card */}
                    <div className="flex-1 pb-3">
                      {isLocked ? (
                        <article aria-label={`${card.chapter.title} locked`}>
                          {cardContent}
                        </article>
                      ) : (
                        <Link href={card.href} aria-current={isActive ? 'step' : undefined}>
                          {cardContent}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
