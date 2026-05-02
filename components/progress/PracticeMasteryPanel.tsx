'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronDown, XCircle } from 'lucide-react';

/* ── Types — mirror the API response in /api/operations/practice/mastery ── */

type AttemptResult = 'success' | 'failure' | 'self_review';
type TierSlug = 'junior' | 'mid' | 'senior';

interface TaskMastery {
  taskId: string;
  title: string;
  bestResult: AttemptResult | null;
  lastAttemptedAt: string | null;
}

interface TierMastery {
  slug: TierSlug;
  moduleId: string;
  language: string;
  practiceSetTitle: string;
  total: number;
  solved: number;
  failed: number;
  tasks: TaskMastery[];
}

interface TopicMastery {
  topicId: string;
  topicTitle: string;
  totalTasks: number;
  solvedTasks: number;
  tiers: TierMastery[];
}

interface LanguageMastery {
  languageId: string;
  languageTitle: string;
  accentRgb: string;
  href: string;
  totalTasks: number;
  solvedTasks: number;
  topics: TopicMastery[];
}

interface CategoryMastery {
  categoryId: string;
  categoryTitle: string;
  accentRgb: string;
  href: string;
  totalTasks: number;
  solvedTasks: number;
  languages: LanguageMastery[];
}

/* ── Visual constants — kept identical to ProgressDashboard so the two
   panels read as one family. ─────────────────────────────────────────── */

const APPLE_FONT =
  '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';
const CARD = 'rounded-[22px] bg-[#181c20] border border-white/[0.06] p-5';
const SECTION_LABEL =
  'text-[11px] font-mono font-bold text-on-surface/75 uppercase tracking-[0.18em]';
const SECTION_SUBLABEL = 'text-[13px] text-on-surface-variant/75 leading-relaxed';

const TIERS = [
  { slug: 'junior' as const, label: 'Junior', color: '#99f7ff', rgb: '153,247,255' },
  { slug: 'mid' as const, label: 'Mid', color: '#ffc965', rgb: '255,201,101' },
  { slug: 'senior' as const, label: 'Senior', color: '#ff716c', rgb: '255,113,108' },
];

/* ── Component ────────────────────────────────────────────────────────── */

export function PracticeMasteryPanel() {
  const [data, setData] = useState<CategoryMastery[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set());
  const [openLanguages, setOpenLanguages] = useState<Set<string>>(() => new Set());
  const [openTopics, setOpenTopics] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch('/api/operations/practice/mastery', {
          credentials: 'same-origin',
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { data?: CategoryMastery[] };
        if (cancelled) return;
        setData(json.data ?? []);
        setError(null);
      } catch {
        if (!cancelled) setError('Could not load practice mastery.');
      }
    };
    void refresh();
    const onFocus = () => {
      if (!cancelled) void refresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const toggleSet = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  // "Has any progress" = any category is non-empty AND has at least one
  // attempt. We still render placeholder categories underneath for
  // discoverability, just like the practice hub does.
  const hasAnyContent = useMemo(
    () => Boolean(data?.some((c) => c.totalTasks > 0)),
    [data],
  );

  return (
    <section
      className="space-y-4"
      style={{
        opacity: 0,
        animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 120ms forwards',
      }}
    >
      <div>
        <h2 className={SECTION_LABEL}>Practice mastery</h2>
        <p className={SECTION_SUBLABEL + ' mt-1'}>
          Every practice task across the curriculum, by category, language, and topic. Filled rows are solved.
        </p>
      </div>

      {data === null ? (
        <div className={CARD + ' text-center py-10'}>
          <p className="text-[13px] text-on-surface-variant/40">Loading…</p>
        </div>
      ) : error ? (
        <div className={CARD + ' text-center py-10'}>
          <p className="text-[13px] text-on-surface-variant/50">{error}</p>
        </div>
      ) : !hasAnyContent ? (
        <div className={CARD + ' text-center py-10'}>
          <p className="text-[13px] text-on-surface-variant/50">
            Practice content is on the way — check back soon.
          </p>
          <Link
            href="/practice"
            className="inline-block mt-3 text-[12px] text-primary hover:underline"
          >
            Browse practice →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((cat) => (
            <CategoryCard
              key={cat.categoryId}
              category={cat}
              isOpen={openCategories.has(cat.categoryId)}
              onToggle={() =>
                toggleSet(openCategories, cat.categoryId, setOpenCategories)
              }
              openLanguages={openLanguages}
              onToggleLanguage={(id) => toggleSet(openLanguages, id, setOpenLanguages)}
              openTopics={openTopics}
              onToggleTopic={(id) => toggleSet(openTopics, id, setOpenTopics)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Category card (Layer 1) ─────────────────────────────────────────── */

function CategoryCard({
  category,
  isOpen,
  onToggle,
  openLanguages,
  onToggleLanguage,
  openTopics,
  onToggleTopic,
}: {
  category: CategoryMastery;
  isOpen: boolean;
  onToggle: () => void;
  openLanguages: Set<string>;
  onToggleLanguage: (id: string) => void;
  openTopics: Set<string>;
  onToggleTopic: (id: string) => void;
}) {
  const empty = category.totalTasks === 0;
  return (
    <div className={CARD}>
      <button
        type="button"
        onClick={empty ? undefined : onToggle}
        aria-expanded={isOpen}
        aria-controls={`practice-mastery-cat-${category.categoryId}`}
        className="flex items-center gap-3 w-full text-left group"
        disabled={empty}
        style={empty ? { cursor: 'default' } : undefined}
      >
        <span
          className="font-mono uppercase tracking-[0.18em] text-[10px] rounded-full px-2 py-0.5 shrink-0"
          style={{
            color: empty ? 'rgba(255,255,255,0.3)' : `rgba(${category.accentRgb},0.85)`,
            border: `1px solid rgba(${category.accentRgb},${empty ? 0.12 : 0.25})`,
            backgroundColor: `rgba(${category.accentRgb},${empty ? 0.03 : 0.06})`,
          }}
        >
          {category.categoryTitle}
        </span>
        <span className="ml-auto text-[11px] tabular-nums text-on-surface-variant/55 shrink-0">
          {empty
            ? 'Coming soon'
            : `${category.solvedTasks}/${category.totalTasks} tasks`}
        </span>
        {!empty && (
          <ChevronDown
            size={16}
            className="shrink-0 text-on-surface-variant/45 transition-transform"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        )}
      </button>

      {isOpen && !empty && (
        <div
          id={`practice-mastery-cat-${category.categoryId}`}
          className="mt-4 space-y-2"
        >
          {category.languages.map((lang) => (
            <LanguageCard
              key={`${category.categoryId}:${lang.languageId}`}
              parentId={category.categoryId}
              language={lang}
              isOpen={openLanguages.has(`${category.categoryId}:${lang.languageId}`)}
              onToggle={() =>
                onToggleLanguage(`${category.categoryId}:${lang.languageId}`)
              }
              openTopics={openTopics}
              onToggleTopic={onToggleTopic}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Language card (Layer 2) ─────────────────────────────────────────── */

function LanguageCard({
  parentId,
  language,
  isOpen,
  onToggle,
  openTopics,
  onToggleTopic,
}: {
  parentId: string;
  language: LanguageMastery;
  isOpen: boolean;
  onToggle: () => void;
  openTopics: Set<string>;
  onToggleTopic: (id: string) => void;
}) {
  return (
    <div
      className="rounded-[16px] border border-white/[0.05] p-4"
      style={{ background: 'rgba(255,255,255,0.015)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`practice-mastery-lang-${parentId}-${language.languageId}`}
        className="flex items-center gap-3 w-full text-left group"
      >
        <span
          className="font-mono uppercase tracking-[0.18em] text-[10px] shrink-0"
          style={{ color: `rgba(${language.accentRgb},0.9)`, fontWeight: 700 }}
        >
          {language.languageTitle}
        </span>
        <span className="ml-auto text-[11px] tabular-nums text-on-surface-variant/55 shrink-0">
          {language.solvedTasks}/{language.totalTasks} tasks
        </span>
        <ChevronDown
          size={14}
          className="shrink-0 text-on-surface-variant/45 transition-transform"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {isOpen && (
        <div
          id={`practice-mastery-lang-${parentId}-${language.languageId}`}
          className="mt-3 space-y-2"
        >
          {language.topics.map((topic) => (
            <TopicCard
              key={`${parentId}:${language.languageId}:${topic.topicId}`}
              parentId={`${parentId}:${language.languageId}`}
              topic={topic}
              isOpen={openTopics.has(
                `${parentId}:${language.languageId}:${topic.topicId}`,
              )}
              onToggle={() =>
                onToggleTopic(
                  `${parentId}:${language.languageId}:${topic.topicId}`,
                )
              }
              languageHref={`/practice/coding/${language.languageId}/${topic.topicId}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Topic card (Layer 3) — expands to the existing per-tier grid ──── */

function TopicCard({
  parentId,
  topic,
  isOpen,
  onToggle,
  languageHref,
}: {
  parentId: string;
  topic: TopicMastery;
  isOpen: boolean;
  onToggle: () => void;
  languageHref: string;
}) {
  return (
    <div
      className="rounded-[12px] border border-white/[0.05] px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`practice-mastery-topic-${parentId}-${topic.topicId}`}
        className="flex items-center gap-3 w-full text-left group"
      >
        <span
          className="text-[13.5px] font-semibold text-on-surface/90 group-hover:text-on-surface transition-colors"
          style={{ fontFamily: APPLE_FONT, letterSpacing: '-0.01em' }}
        >
          {topic.topicTitle}
        </span>
        <span className="ml-auto text-[11px] tabular-nums text-on-surface-variant/55 shrink-0">
          {topic.solvedTasks}/{topic.totalTasks} tasks
        </span>
        <ChevronDown
          size={13}
          className="shrink-0 text-on-surface-variant/40 transition-transform"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {isOpen && (
        <div
          id={`practice-mastery-topic-${parentId}-${topic.topicId}`}
          className="mt-4"
        >
          <div className="flex justify-end mb-3">
            <Link
              href={languageHref}
              className="text-[10.5px] font-mono uppercase tracking-[0.16em] text-on-surface-variant/55 hover:text-on-surface transition-colors"
            >
              Open practice →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
            {TIERS.map((tier) => {
              const t = topic.tiers.find((x) => x.slug === tier.slug);
              const hasContent = !!t && t.total > 0;
              return (
                <div key={tier.slug}>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="font-mono uppercase"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.22em',
                        color: hasContent ? tier.color : 'rgba(255,255,255,0.25)',
                        fontWeight: 700,
                      }}
                    >
                      {tier.label}
                    </span>
                    <span
                      className="font-mono uppercase tabular-nums"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.16em',
                        color: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {hasContent ? `${t!.solved}/${t!.total}` : '—'}
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="h-px w-full mb-3"
                    style={{
                      background: hasContent
                        ? `linear-gradient(to right, rgba(${tier.rgb},0.4), transparent)`
                        : 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)',
                    }}
                  />
                  {hasContent ? (
                    <ol className="space-y-2">
                      {t!.tasks.map((task, i) => {
                        const isSolved = task.bestResult === 'success';
                        const isFailed = task.bestResult === 'failure';
                        return (
                          <li key={task.taskId} className="flex items-start gap-3">
                            <span
                              className="font-mono shrink-0 mt-[3px] tabular-nums"
                              style={{
                                fontSize: 10,
                                color: 'rgba(255,255,255,0.28)',
                                letterSpacing: '0.05em',
                                width: 22,
                              }}
                            >
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            {isSolved ? (
                              <CheckCircle2
                                size={12}
                                className="shrink-0 mt-[5px]"
                                style={{ color: tier.color }}
                              />
                            ) : isFailed ? (
                              <XCircle
                                size={12}
                                className="shrink-0 mt-[5px]"
                                style={{ color: 'rgba(255,113,108,0.5)' }}
                              />
                            ) : (
                              <span
                                aria-hidden
                                className="shrink-0 mt-[6px] rounded-full"
                                style={{
                                  width: 10,
                                  height: 10,
                                  border: '1px solid rgba(255,255,255,0.18)',
                                }}
                              />
                            )}
                            <span
                              style={{
                                fontFamily: APPLE_FONT,
                                fontSize: 12.5,
                                lineHeight: 1.45,
                                color: isSolved
                                  ? 'rgba(255,255,255,0.88)'
                                  : isFailed
                                    ? 'rgba(255,255,255,0.6)'
                                    : 'rgba(255,255,255,0.55)',
                                fontWeight: isSolved ? 500 : 400,
                              }}
                              title={task.title}
                            >
                              {task.title}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p
                      className="text-[12px] italic"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      Coming soon
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
