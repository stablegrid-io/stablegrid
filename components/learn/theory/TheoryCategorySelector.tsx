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

  return (
    <div className="min-h-screen bg-light-bg pb-24 dark:bg-dark-bg lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href={`/learn/${doc.topic}`}
            className="mb-8 inline-flex items-center gap-2 text-sm text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Topic
          </Link>

          <header className="mb-8">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.24em] text-brand-500">
              Theory
            </p>
            <h1 className="text-3xl font-bold">{doc.title}</h1>
            <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">
              Chapter progression overview with live reading status.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {doc.chapters.length} chapters
              </span>
              <span>{totalMinutes} min total</span>
            </div>
          </header>

          <section aria-label="Overall chapter progress" className="mb-7">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-lg font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Overall Progress
              </span>
              <span className="text-xl font-semibold text-emerald-500">
                {completedLessons}/{totalLessons} lessons
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${overallProgressPct}%` }}
              />
            </div>
          </section>

          <div className="space-y-5">
            {chapterGroups.map((group) => {
              return (
                <section
                  key={group.category.slug}
                  className="rounded-2xl border border-light-border bg-light-surface/60 p-4 dark:border-dark-border dark:bg-dark-surface/60"
                >
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
                        {group.category.label}
                      </p>
                      <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {group.category.description}
                      </p>
                    </div>
                    <div className="text-right text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                      <p>
                        {group.completedCount}/{group.cards.length} chapters complete
                      </p>
                      <p>
                        {group.lessonsDone}/{group.lessonsTotal} lessons
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${group.progressPct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.cards.map((card) => {
                      const isComplete = card.status === 'completed';
                      const isActive = card.status === 'active';
                      const isLocked = card.status === 'locked';
                      const accentWidth = isComplete ? 100 : card.chapterProgressPct;

                      const cardBody = (
                        <>
                          <div
                            className={`absolute inset-x-0 top-0 h-0.5 rounded-t-2xl ${
                              isLocked ? 'bg-transparent' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${accentWidth}%` }}
                          />

                          <div className="mb-2 flex items-start justify-between">
                            <span className="text-xl" aria-hidden="true">
                              {card.chapterIcon}
                            </span>
                            {isComplete ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            ) : null}
                            {isLocked ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-surface/60 text-text-dark-tertiary">
                                <Lock className="h-3.5 w-3.5" />
                              </span>
                            ) : null}
                          </div>

                          <h2
                            className={`line-clamp-2 text-base font-semibold leading-snug ${
                              isLocked
                                ? 'text-text-light-tertiary/70 dark:text-text-dark-tertiary/70'
                                : 'text-text-light-primary dark:text-text-dark-primary'
                            }`}
                          >
                            {card.chapter.title}
                          </h2>

                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                            <div
                              className={`h-full rounded-full ${
                                isLocked ? 'bg-text-light-tertiary/25 dark:bg-text-dark-tertiary/25' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${accentWidth}%` }}
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
                            <span>
                              {card.lessonsDone}/{card.lessonsTotal} lessons
                            </span>
                            <span>{card.chapter.totalMinutes} min</span>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                                Continue
                                <ArrowRight className="h-3.5 w-3.5" />
                              </span>
                            ) : isComplete ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                                <Check className="h-3.5 w-3.5" />
                                Completed
                              </span>
                            ) : isLocked ? (
                              <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                                Locked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-500">
                                Open
                                <ArrowRight className="h-3.5 w-3.5" />
                              </span>
                            )}

                            <span className="text-[10px] uppercase tracking-[0.18em] text-text-light-tertiary dark:text-text-dark-tertiary">
                              Ch. {card.chapter.number}
                            </span>
                          </div>
                        </>
                      );

                      const commonClassName = `relative overflow-hidden rounded-2xl border p-3 ${
                        isActive
                          ? 'border-emerald-500/60 bg-gradient-to-r from-[#0f172a] to-[#0b1f28] shadow-[0_0_0_1px_rgba(16,185,129,0.22)]'
                          : isComplete
                            ? 'border-emerald-500/35 bg-light-surface dark:bg-dark-surface'
                            : isLocked
                              ? 'border-light-border/60 bg-light-surface/70 opacity-80 dark:border-dark-border/60 dark:bg-dark-surface/70'
                              : 'border-light-border bg-light-surface transition-colors hover:bg-light-hover dark:border-dark-border dark:bg-dark-surface dark:hover:bg-dark-hover'
                      }`;

                      if (isLocked) {
                        return (
                          <article
                            key={card.chapter.id}
                            className={commonClassName}
                            aria-label={`${card.chapter.title} locked`}
                          >
                            {cardBody}
                          </article>
                        );
                      }

                      return (
                        <Link
                          key={card.chapter.id}
                          href={card.href}
                          className={commonClassName}
                          aria-current={isActive ? 'step' : undefined}
                        >
                          {cardBody}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
