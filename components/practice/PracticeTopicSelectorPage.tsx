'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ChevronDown, Check, type LucideIcon } from 'lucide-react';

export interface Topic {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentRgb: string;
  category: string;
  comingSoon: boolean;
  /** Override the default `${hrefPrefix}/${id}` link target. */
  href?: string;
  /** Override the default "Initialize Track" CTA label on available topics. */
  ctaLabel?: string;
  /**
   * Programming languages this topic supports. When omitted, the topic is
   * treated as language-agnostic (matches every Language filter).
   */
  languages?: string[];
}

interface LanguageOption {
  id: string;
  label: string;
}

interface PracticeTopicSelectorPageProps {
  title: string;
  subtitle: string;
  topics: Topic[];
  hrefPrefix: string;
  backHref?: string;
  backLabel?: string;
  /** Render a Language filter dropdown alongside Category/Status/Sort. */
  languageOptions?: LanguageOption[];
  /** When true, suppress the search + filter toolbar. Useful for short
   *  lists (e.g. the language picker with 3 cards) where filters are
   *  visual noise. */
  hideFilters?: boolean;
}

type StatusFilter = 'all' | 'available' | 'coming-soon';
type SortOption = 'name-asc' | 'name-desc';

const SORT_OPTIONS: Array<{ id: SortOption; label: string }> = [
  { id: 'name-asc', label: 'A → Z' },
  { id: 'name-desc', label: 'Z → A' },
];

const STATUS_OPTIONS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'coming-soon', label: 'Coming Soon' },
];

interface DropdownOption {
  id: string;
  label: string;
  count?: number;
  rgb?: string;
}

interface FilterDropdownProps {
  eyebrow: string;
  value: string;
  options: DropdownOption[];
  onChange: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  align?: 'left' | 'right';
  showCount?: boolean;
}

function FilterDropdown({
  eyebrow,
  value,
  options,
  onChange,
  isOpen,
  onToggle,
  align = 'right',
  showCount = false,
}: FilterDropdownProps) {
  const active = options.find((o) => o.id === value) ?? options[0];
  const accentRgb = active?.rgb ?? '255,255,255';

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 h-9 px-3 transition-all"
        style={{
          borderRadius: 10,
          background: isOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isOpen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }}
      >
        <span className="font-mono text-[9px] tracking-[0.18em] uppercase font-semibold text-white/55">
          {eyebrow}
        </span>
        <span className="text-white/30 text-[10px]">·</span>
        <span
          className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold whitespace-nowrap inline-flex items-center gap-1"
          style={{ color: `rgb(${accentRgb})` }}
        >
          {active?.label}
          {showCount && active?.count !== undefined && active.count > 0 && active.id !== 'all' && (
            <span className="font-medium text-white/55">({active.count})</span>
          )}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 text-white/55 ml-0.5 transition-transform"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute top-full mt-2 z-30 min-w-[200px] ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={{
            borderRadius: 12,
            background: 'rgba(16,18,22,0.96)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: 4,
          }}
        >
          {options.map((opt) => {
            const isActive = opt.id === value;
            const itemRgb = opt.rgb ?? '255,255,255';
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(opt.id);
                  onToggle();
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 transition-all"
                style={{
                  borderRadius: 8,
                  color: isActive ? `rgb(${itemRgb})` : 'rgba(255,255,255,0.78)',
                  background: isActive ? `rgba(${itemRgb},0.14)` : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span className="font-mono text-[11px] tracking-[0.14em] uppercase font-semibold whitespace-nowrap">
                  {opt.label}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {showCount && opt.count !== undefined && opt.count > 0 && opt.id !== 'all' && (
                    <span
                      className="font-mono text-[10px] tabular-nums"
                      style={{
                        padding: '1px 6px',
                        borderRadius: 99,
                        background: isActive ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.08)',
                        color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                      }}
                    >
                      {opt.count}
                    </span>
                  )}
                  {isActive && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PracticeTopicSelectorPage({
  title,
  subtitle,
  topics,
  hrefPrefix,
  backHref = '/practice',
  backLabel = 'Practice Lab',
  languageOptions,
  hideFilters = false,
}: PracticeTopicSelectorPageProps) {
  const accentRgb = topics[0]?.accentRgb ?? '255,255,255';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>(
    languageOptions?.[0]?.id ?? 'all',
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [openDropdown, setOpenDropdown] = useState<
    'category' | 'language' | 'status' | 'sort' | null
  >(null);
  const toolbarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!openDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [openDropdown]);

  // Unique sub-category list, in source order
  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const t of topics) {
      if (!seen.has(t.category)) {
        seen.add(t.category);
        result.push(t.category);
      }
    }
    return result;
  }, [topics]);

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = topics.filter((t) => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (languageFilter !== 'all') {
        // Topics with no language metadata are treated as language-agnostic
        // and match every filter; topics with metadata must include the pick.
        if (t.languages && t.languages.length > 0 && !t.languages.includes(languageFilter)) {
          return false;
        }
      }
      if (statusFilter === 'available' && t.comingSoon) return false;
      if (statusFilter === 'coming-soon' && !t.comingSoon) return false;
      if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
    filtered.sort((a, b) => {
      const cmp = a.title.localeCompare(b.title);
      return sortBy === 'name-asc' ? cmp : -cmp;
    });
    return filtered;
  }, [topics, searchQuery, categoryFilter, languageFilter, statusFilter, sortBy]);

  const statusCounts = useMemo(() => {
    const counts = { all: topics.length, available: 0, 'coming-soon': 0 } as Record<StatusFilter, number>;
    for (const t of topics) {
      if (t.comingSoon) counts['coming-soon']++;
      else counts.available++;
    }
    return counts;
  }, [topics]);

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          href={backHref}
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <header
          className="mb-8 border-b border-white/[0.08] pb-4"
          style={{ opacity: 0, animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards' }}
        >
          <h1 className="text-5xl font-bold tracking-tight text-on-surface">
            {title}
          </h1>
          <p className="mt-3 text-base text-on-surface-variant/70">
            {subtitle}
          </p>
        </header>

        {/* Filter toolbar — hidden via `hideFilters` for short lists
            (e.g. the 3-card language picker) where the toolbar is just
            visual noise. */}
        {!hideFilters && (
        <section
          ref={toolbarRef}
          aria-label="Filter topics"
          className="relative z-30 mb-8 w-full"
          style={{
            borderRadius: 18,
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.22)',
            opacity: 0,
            animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 80ms forwards',
          }}
        >
          <div className="flex flex-wrap items-center gap-2 px-2.5 py-2.5">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics"
                className="h-9 w-full pl-9 pr-14 text-[13px] font-normal text-white outline-none transition-all placeholder:text-white/50"
                style={{
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = `rgba(${accentRgb},0.4)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              />
              <kbd
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] tabular-nums text-white/55 hidden sm:inline-block"
                style={{
                  padding: '2px 6px',
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                ⌘K
              </kbd>
            </div>

            {/* Count */}
            <div className="hidden sm:flex items-baseline gap-1 shrink-0 px-1">
              <span className="font-mono text-[15px] tabular-nums text-white/95 leading-none">
                {filteredTopics.length}
              </span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/55 font-semibold">
                {filteredTopics.length === 1 ? 'topic' : 'topics'}
              </span>
            </div>

            {/* Language */}
            {languageOptions && languageOptions.length > 0 && (
              <FilterDropdown
                eyebrow="Language"
                value={languageFilter}
                options={languageOptions.map((lang) => ({
                  id: lang.id,
                  label: lang.label,
                  rgb: accentRgb,
                }))}
                onChange={(id) => setLanguageFilter(id)}
                isOpen={openDropdown === 'language'}
                onToggle={() => setOpenDropdown(openDropdown === 'language' ? null : 'language')}
              />
            )}

            {/* Category */}
            <FilterDropdown
              eyebrow="Category"
              value={categoryFilter}
              options={[
                { id: 'all', label: 'All' },
                ...categoryOptions.map((cat) => ({ id: cat, label: cat, rgb: accentRgb })),
              ]}
              onChange={(id) => setCategoryFilter(id)}
              isOpen={openDropdown === 'category'}
              onToggle={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
            />

            {/* Status */}
            <FilterDropdown
              eyebrow="Status"
              value={statusFilter}
              options={STATUS_OPTIONS.map((opt) => ({
                id: opt.id,
                label: opt.label,
                count: statusCounts[opt.id],
              }))}
              onChange={(id) => setStatusFilter(id as StatusFilter)}
              isOpen={openDropdown === 'status'}
              onToggle={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              showCount
            />

            {/* Sort */}
            <FilterDropdown
              eyebrow="Sort"
              value={sortBy}
              options={SORT_OPTIONS.map((opt) => ({ id: opt.id, label: opt.label }))}
              onChange={(id) => setSortBy(id as SortOption)}
              isOpen={openDropdown === 'sort'}
              onToggle={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
            />
          </div>
        </section>
        )}

        {/* Topic cards */}
        {filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTopics.map((topic, index) => {
              const hasContent = !topic.comingSoon;
              const staggerDelay = index * 80;
              const Icon = topic.icon;

              const cardInner = (
                <section
                  className="bg-[#181c20] relative overflow-hidden transition-all duration-300 h-full rounded-[22px]"
                  style={{
                    border: '1px solid rgba(255,255,255,0.06)',
                    opacity: 0,
                    animation: `fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay + 100}ms forwards`,
                  }}
                  onMouseEnter={(e) => { if (hasContent) { e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1.02)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <div className="p-6 h-full flex flex-col relative">
                    <div className="mb-6 flex justify-between items-start">
                      <div
                        className="w-12 h-12 flex items-center justify-center rounded-[14px]"
                        style={{ backgroundColor: `rgba(${topic.accentRgb},0.08)`, border: `1px solid rgba(${topic.accentRgb},0.18)` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: `rgb(${topic.accentRgb})` }} />
                      </div>
                      <span
                        className="font-mono text-[10px] px-2 py-0.5 uppercase rounded-full"
                        style={{ color: `rgb(${topic.accentRgb})`, border: `1px solid rgba(${topic.accentRgb},0.3)`, backgroundColor: `rgba(${topic.accentRgb},0.06)` }}
                      >
                        {topic.category}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold mb-3 tracking-tight uppercase">
                      {topic.title}
                    </h3>
                    <p className="text-on-surface-variant text-sm font-body mb-8 leading-relaxed">
                      {topic.description}
                    </p>

                    <div className="mt-auto">
                      {hasContent ? (
                        <div
                          className="w-full py-4 font-mono text-xs font-bold tracking-widest text-center transition-all duration-300 active:scale-[0.98] uppercase rounded-[14px]"
                          style={{
                            border: '1px solid rgba(255,255,255,0.4)',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            color: '#ffffff',
                          }}
                        >
                          {topic.ctaLabel ?? 'Initialize Track'}
                        </div>
                      ) : (
                        <>
                          <div className="mb-4">
                            <div className="flex justify-between items-end mb-2">
                              <span className="font-mono text-[10px] text-on-surface-variant/40">
                                BUILD STATUS
                              </span>
                              <span className="font-mono text-[10px] text-on-surface-variant/30 animate-pulse">
                                COMPILING...
                              </span>
                            </div>
                            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                              <div
                                className="absolute inset-y-0 left-0 w-1/3 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
                                style={{ backgroundColor: `rgba(${topic.accentRgb},0.25)` }}
                              />
                            </div>
                          </div>
                          <div
                            className="w-full py-4 font-mono text-[10px] font-bold tracking-widest text-center uppercase opacity-40 rounded-[14px]"
                            style={{
                              border: `1px dashed rgba(${topic.accentRgb},0.3)`,
                              color: `rgba(${topic.accentRgb},0.5)`
                            }}
                          >
                            Under Construction
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </section>
              );

              return hasContent ? (
                <Link key={topic.id} href={topic.href ?? `${hrefPrefix}/${topic.id}`} className="group h-full">
                  {cardInner}
                </Link>
              ) : (
                <div key={topic.id} className="group h-full cursor-default">
                  {cardInner}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-[18px] border border-dashed border-white/10 px-6 py-12 text-center"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-white/40 mb-1">
              No matches
            </p>
            <p className="text-sm text-white/55">
              Try clearing the search or relaxing the filters.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
