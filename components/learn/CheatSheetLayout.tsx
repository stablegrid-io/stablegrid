'use client';

import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState
} from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  X
} from 'lucide-react';
import type { CheatSheet, FunctionEntry } from '@/types/learn';
import type { Topic } from '@/types/progress';
import { trackFunctionView } from '@/lib/progress';
import { CodeBlock } from '@/components/learn/CodeBlock';

interface CheatSheetLayoutProps {
  data: CheatSheet;
}

type LevelFilter = 'all' | 'b' | 'i' | 'a';

interface SectionGroup {
  id: string;
  title: string;
  description: string;
  color: string;
  rgb: string;
  icon: string;
  functions: FunctionEntry[];
}

const LEVEL_LABEL: Record<LevelFilter, string> = {
  all: 'All',
  b: 'Beginner',
  i: 'Intermediate',
  a: 'Advanced'
};

const LEVEL_META: Record<Exclude<LevelFilter, 'all'>, { label: string; dot: string }> = {
  b: { label: 'Beginner', dot: '#10b981' },
  i: { label: 'Intermediate', dot: '#f59e0b' },
  a: { label: 'Advanced', dot: '#8b5cf6' }
};

const DIFFICULTY_TO_LEVEL: Record<FunctionEntry['difficulty'], Exclude<LevelFilter, 'all'>> = {
  beginner: 'b',
  intermediate: 'i',
  advanced: 'a'
};

const SECTION_COLORS = [
  '#6b7fff',
  '#a78bfa',
  '#34d399',
  '#fb923c',
  '#f472b6',
  '#38bdf8',
  '#22b999',
  '#fbbf24',
  '#e879f9',
  '#f87171',
  '#2dd4bf',
  '#94a3b8'
];

const CATEGORY_ICONS: Record<string, string> = {
  session: '⚙️',
  schema: '🗂️',
  select: '✦',
  filtering: '⊃',
  aggregations: 'Σ',
  window: '⊡',
  joins: '⋈',
  performance: '⚡',
  transformations: '↯',
  strings: 'Aa',
  dates: '◷',
  nulls: '∅',
  reading: '📥',
  writing: '📤',
  streaming: '🌊',
  udf: 'λ',
  math: '∑',
  sorting: '↕',
  dedup: '🧹',
  arrays: '[]',
  actions: '▶'
};

const toRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((part) => `${part}${part}`)
          .join('')
      : normalized;

  const bigint = Number.parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
};

const toTitle = (id: string) =>
  id
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const functionMatchesQuery = (entry: FunctionEntry, query: string) => {
  if (!query) return true;

  const needle = query.toLowerCase();
  return (
    entry.name.toLowerCase().includes(needle) ||
    entry.shortDescription.toLowerCase().includes(needle) ||
    entry.longDescription.toLowerCase().includes(needle) ||
    entry.tags.some((tag) => tag.toLowerCase().includes(needle))
  );
};

const getFunctionLevel = (entry: FunctionEntry) => DIFFICULTY_TO_LEVEL[entry.difficulty];

export const CheatSheetLayout = ({ data }: CheatSheetLayoutProps) => {
  const searchParams = useSearchParams();
  const requestedFunctionId = searchParams.get('function');
  const topic = data.topic as Topic;

  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const totalFunctions = data.functions.length;
  const functionsByCategory = useMemo(() => {
    const map = new Map<string, FunctionEntry[]>();
    for (const entry of data.functions) {
      const existing = map.get(entry.category);
      if (existing) {
        existing.push(entry);
      } else {
        map.set(entry.category, [entry]);
      }
    }
    return map;
  }, [data.functions]);

  const functionsById = useMemo(
    () => new Map(data.functions.map((entry) => [entry.id, entry])),
    [data.functions]
  );

  const allSections = useMemo<SectionGroup[]>(() => {
    const categoryMap = new Map(data.categories.map((category) => [category.id, category]));
    const orderedIds = [...data.categories.map((category) => category.id)];
    const seen = new Set(orderedIds);
    for (const categoryId of functionsByCategory.keys()) {
      if (!seen.has(categoryId)) {
        seen.add(categoryId);
        orderedIds.push(categoryId);
      }
    }

    return orderedIds.map((categoryId, index) => {
      const category = categoryMap.get(categoryId);
      return {
        id: categoryId,
        title: category?.label ?? toTitle(categoryId),
        description: category?.description ?? '',
        color: SECTION_COLORS[index % SECTION_COLORS.length],
        rgb: toRgb(SECTION_COLORS[index % SECTION_COLORS.length]),
        icon: CATEGORY_ICONS[categoryId] ?? '✦',
        functions: functionsByCategory.get(categoryId) ?? []
      };
    });
  }, [data.categories, functionsByCategory]);

  const filteredSections = useMemo(() => {
    const normalizedQuery = deferredQuery.trim();

    return allSections
      .map((section) => {
        const functions = section.functions.filter((entry) => {
          const level = getFunctionLevel(entry);
          const matchLevel = levelFilter === 'all' || level === levelFilter;
          if (!matchLevel) return false;
          return functionMatchesQuery(entry, normalizedQuery);
        });

        return { ...section, functions };
      })
      .filter((section) => section.functions.length > 0);
  }, [allSections, deferredQuery, levelFilter]);

  const selectedFunction = useMemo(
    () => (selectedFunctionId ? functionsById.get(selectedFunctionId) ?? null : null),
    [functionsById, selectedFunctionId]
  );

  const selectedSection = useMemo(() => {
    if (!selectedFunction) return null;
    return allSections.find((section) => section.id === selectedFunction.category) ?? null;
  }, [allSections, selectedFunction]);

  useEffect(() => {
    if (!requestedFunctionId) return;

    const entry = functionsById.get(requestedFunctionId);
    if (!entry) return;

    setSelectedFunctionId(entry.id);
    void trackFunctionView(topic, entry.id);
  }, [functionsById, requestedFunctionId, topic]);

  useEffect(() => {
    if (!selectedFunctionId) return;
    if (functionsById.has(selectedFunctionId)) return;
    setSelectedFunctionId(null);
  }, [functionsById, selectedFunctionId]);

  const handleSelectFunction = useCallback((entry: FunctionEntry) => {
    setSelectedFunctionId(entry.id);
    void trackFunctionView(topic, entry.id);
  }, [topic]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedFunctionId(null);
  }, []);

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-y-auto bg-light-bg dark:bg-dark-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href={`/learn/${data.topic}/theory`}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-text-light-tertiary transition-colors hover:text-text-light-primary dark:text-text-dark-tertiary dark:hover:text-text-dark-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to topic
            </Link>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-500">
                Cheat Sheet
              </span>
              <span className="h-2.5 w-px bg-light-border dark:bg-dark-border" />
              <span className="text-[10px] font-medium text-text-light-tertiary dark:text-text-dark-tertiary">
                {data.version ?? 'Reference'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-light-primary dark:text-text-dark-primary">
              {data.title}
            </h1>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {totalFunctions} functions · {allSections.length} categories · click a function
              for syntax and examples
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-light-border bg-light-surface p-1 dark:border-dark-border dark:bg-dark-surface">
              {(['all', 'b', 'i', 'a'] as LevelFilter[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setLevelFilter(level)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    levelFilter === level
                      ? 'bg-brand-500 text-white'
                      : 'text-text-light-secondary hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary'
                  }`}
                >
                  {LEVEL_LABEL[level]}
                </button>
              ))}
            </div>

            <div className="flex w-[240px] items-center gap-2 rounded-lg border border-light-border bg-light-surface px-3 py-2 dark:border-dark-border dark:bg-dark-surface">
              <Search className="h-4 w-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search functions..."
                className="w-full border-none bg-transparent p-0 text-sm text-text-light-primary placeholder:text-text-light-tertiary focus:outline-none focus:ring-0 dark:text-text-dark-primary dark:placeholder:text-text-dark-tertiary"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-text-light-tertiary transition-colors hover:text-text-light-primary dark:text-text-dark-tertiary dark:hover:text-text-dark-primary"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-4 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          {Object.entries(LEVEL_META).map(([level, meta]) => (
            <span key={level} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.dot }} />
              {meta.label}
            </span>
          ))}
          <span>· open any function for details</span>
        </div>

        {filteredSections.length > 0 ? (
          <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
            {filteredSections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                onSelect={handleSelectFunction}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-light-border bg-light-surface p-12 text-center dark:border-dark-border dark:bg-dark-surface">
            <p className="mb-2 text-2xl">🔍</p>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              No functions match this filter.
            </p>
          </div>
        )}
      </div>

      {selectedFunction && selectedSection ? (
        <FunctionDrawer
          fn={selectedFunction}
          section={selectedSection}
          onClose={handleCloseDrawer}
        />
      ) : null}
    </div>
  );
};

interface SectionCardProps {
  section: SectionGroup;
  onSelect: (entry: FunctionEntry) => void;
}

const SectionCard = memo(function SectionCard({ section, onSelect }: SectionCardProps) {
  return (
    <article
      className="mb-4 break-inside-avoid overflow-hidden rounded-xl border bg-light-surface/90 dark:bg-dark-surface/80"
      style={{ borderColor: `rgba(${section.rgb},0.28)` }}
    >
      <header
        className="flex items-center gap-2 border-b px-3.5 py-3"
        style={{ borderBottomColor: `rgba(${section.rgb},0.2)` }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md border text-xs"
          style={{
            backgroundColor: `rgba(${section.rgb},0.12)`,
            borderColor: `rgba(${section.rgb},0.25)`
          }}
        >
          {section.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            {section.title}
          </p>
          {section.description ? (
            <p className="truncate text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
              {section.description}
            </p>
          ) : null}
        </div>

        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            color: section.color,
            backgroundColor: `rgba(${section.rgb},0.14)`
          }}
        >
          {section.functions.length}
        </span>
      </header>

      <div className="p-1.5">
        {section.functions.map((fn) => (
          <FunctionRow
            key={fn.id}
            fn={fn}
            section={section}
            onSelect={onSelect}
          />
        ))}
      </div>
    </article>
  );
});

interface FunctionRowProps {
  fn: FunctionEntry;
  section: SectionGroup;
  onSelect: (entry: FunctionEntry) => void;
}

const FunctionRow = memo(function FunctionRow({ fn, section, onSelect }: FunctionRowProps) {
  const level = getFunctionLevel(fn);
  const handleClick = useCallback(() => {
    onSelect(fn);
  }, [fn, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group mb-1 flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:bg-light-bg dark:hover:bg-dark-bg"
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor = `rgba(${section.rgb},0.08)`;
        event.currentTarget.style.borderColor = `rgba(${section.rgb},0.2)`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = '';
        event.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <span
        className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: LEVEL_META[level].dot }}
      />
      <code className="data-mono flex-shrink-0 text-[11px] font-semibold text-text-light-primary dark:text-text-dark-primary">
        {fn.name}
      </code>
      <span className="truncate text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
        {fn.shortDescription}
      </span>
      <ArrowRight
        className="ml-auto h-3 w-3 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: section.color }}
      />
    </button>
  );
});

interface FunctionDrawerProps {
  fn: FunctionEntry;
  section: SectionGroup;
  onClose: () => void;
}

const FunctionDrawer = memo(function FunctionDrawer({ fn, section, onClose }: FunctionDrawerProps) {
  const level = getFunctionLevel(fn);
  const primaryNote = fn.notes?.[0] ?? fn.performance ?? fn.longDescription;
  const primaryExample = fn.examples[0];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close details"
      />

      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-[620px] border-l border-light-border bg-light-bg shadow-2xl dark:border-dark-border dark:bg-[#0c0f17] xl:max-w-[680px]">
        <div
          className="h-0.5"
          style={{ background: `linear-gradient(90deg, ${section.color}, transparent)` }}
        />

        <div className="flex h-full flex-col">
          <header className="border-b border-light-border px-5 py-5 dark:border-dark-border">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]">
              <span style={{ color: section.color }}>{section.title}</span>
              <span className="h-2 w-px bg-light-border dark:bg-dark-border" />
              <span style={{ color: LEVEL_META[level].dot }}>{LEVEL_META[level].label}</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="data-mono text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {fn.name}
                </h2>
                <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {fn.shortDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-light-border p-1.5 text-text-light-tertiary transition-colors hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-tertiary dark:hover:text-text-dark-primary"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
                Syntax
              </p>
              <CodeBlock code={fn.syntax} label="Syntax" />
            </section>

            {primaryExample ? (
              <section>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary">
                  Example
                </p>
                <CodeBlock
                  code={primaryExample.code}
                  label={primaryExample.label || 'Example'}
                  output={primaryExample.output}
                />
              </section>
            ) : null}

            <section
              className="rounded-lg border p-3"
              style={{
                borderColor: `rgba(${section.rgb},0.2)`,
                backgroundColor: `rgba(${section.rgb},0.08)`
              }}
            >
              <p className="text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
                {primaryNote}
              </p>
            </section>
          </div>

          <footer className="border-t border-light-border px-5 py-4 dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
              style={{
                borderColor: `rgba(${section.rgb},0.3)`,
                color: section.color,
                backgroundColor: `rgba(${section.rgb},0.08)`
              }}
            >
              Back to list
              <ArrowRight className="h-4 w-4" />
            </button>
          </footer>
        </div>
      </aside>
    </>
  );
});
