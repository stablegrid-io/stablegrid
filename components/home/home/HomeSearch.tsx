'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Code2,
  Search,
  X
} from 'lucide-react';
import type { HomeSearchItem, HomeSearchItemType } from '@/types/home-search';
import { getHomeTopicMeta } from './topicMeta';

const RECENT_STORAGE_KEY = 'datagridlab-home-search-recent';
const EMPTY_RECENT: string[] = [];

const FILTERS: Array<{ id: HomeSearchItemType | null; label: string }> = [
  { id: null, label: 'All' },
  { id: 'chapter', label: 'Theory' },
  { id: 'function', label: 'Functions' },
  { id: 'question', label: 'Practice' }
];

const TYPE_META: Record<HomeSearchItemType, { label: string; icon: JSX.Element }> = {
  chapter: { label: 'Theory', icon: <BookOpen className="h-3.5 w-3.5" /> },
  function: { label: 'Function', icon: <Code2 className="h-3.5 w-3.5" /> },
  question: { label: 'Question', icon: <CircleHelp className="h-3.5 w-3.5" /> }
};

interface HomeSearchProps {
  items: HomeSearchItem[];
  triggerVariant?: 'default' | 'nav';
}

export function HomeSearch({ items, triggerVariant = 'default' }: HomeSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [filter, setFilter] = useState<HomeSearchItemType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(EMPTY_RECENT);

  const rankedResults = useMemo(() => {
    if (!deferredQuery.trim()) {
      return [] as Array<HomeSearchItem & { score: number }>;
    }

    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return items
      .map((item) => {
        let score = 0;
        const title = item.title.toLowerCase();
        const subtitle = item.subtitle.toLowerCase();
        const keywords = item.keywords.map((entry) => entry.toLowerCase());

        if (title === normalizedQuery) score += 100;
        if (title.startsWith(normalizedQuery)) score += 80;
        if (title.includes(normalizedQuery)) score += 60;
        if (subtitle.includes(normalizedQuery)) score += 20;
        if (keywords.some((entry) => entry === normalizedQuery)) score += 30;
        if (keywords.some((entry) => entry.includes(normalizedQuery))) score += 12;

        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 24);
  }, [deferredQuery, items]);

  const filteredResults = useMemo(() => {
    if (!filter) {
      return rankedResults;
    }

    return rankedResults.filter((item) => item.type === filter);
  }, [filter, rankedResults]);

  const grouped = useMemo(() => {
    const chapters = filteredResults.filter((item) => item.type === 'chapter');
    const functions = filteredResults.filter((item) => item.type === 'function');
    const questions = filteredResults.filter((item) => item.type === 'question');
    return { chapters, functions, questions };
  }, [filteredResults]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
    setActiveIndex(0);

    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(RECENT_STORAGE_KEY) ?? '[]'
      ) as string[];
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.slice(0, 5));
      }
    } catch {
      setRecentSearches(EMPTY_RECENT);
    }
  }, [isOpen]);

  const saveRecent = useCallback((value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    setRecentSearches((current) => {
      const nextRecent = [normalized, ...current.filter((entry) => entry !== normalized)].slice(0, 5);
      try {
        window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(nextRecent));
      } catch {
        // ignore storage errors
      }
      return nextRecent;
    });
  }, []);

  const navigateTo = useCallback((item: HomeSearchItem) => {
    saveRecent(query || item.title);
    setIsOpen(false);
    setQuery('');
    setFilter(null);
    router.push(item.href);
  }, [query, router, saveRecent]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (!filteredResults.length) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const selected = filteredResults[activeIndex];
        if (selected) {
          navigateTo(selected);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, filteredResults, isOpen, navigateTo]);

  const renderGroup = (
    label: string,
    type: HomeSearchItemType,
    list: Array<HomeSearchItem & { score: number }>
  ) => {
    if (list.length === 0) {
      return null;
    }

    return (
      <div className="py-1">
        <div className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
          {label}
        </div>
        {list.map((item) => {
          const flatIndex = filteredResults.findIndex((entry) => entry.id === item.id);
          const active = flatIndex === activeIndex;
          const topic = getHomeTopicMeta(item.topic);
          const typeMeta = TYPE_META[type];

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateTo(item)}
              className={`mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20'
                  : 'border-transparent hover:border-light-border hover:bg-light-hover dark:hover:border-dark-border dark:hover:bg-dark-hover'
              }`}
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-sm"
                style={{
                  backgroundColor: topic.softBg,
                  border: `1px solid ${topic.softBorder}`
                }}
              >
                {topic.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  {item.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  <span className="inline-flex items-center gap-1 rounded-full bg-light-muted px-2 py-0.5 dark:bg-dark-muted">
                    {typeMeta.icon}
                    {typeMeta.label}
                  </span>
                  <span className="truncate">{item.subtitle}</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-text-light-tertiary dark:text-text-dark-tertiary" />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          triggerVariant === 'nav'
            ? 'flex w-full items-center gap-1.5 rounded-lg border border-light-border bg-light-surface px-2 py-1.5 text-left transition-all hover:border-brand-300 dark:border-dark-border dark:bg-dark-surface dark:hover:border-brand-700'
            : 'card flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:border-brand-300 dark:hover:border-brand-700'
        }
      >
        <Search
          className={`text-text-light-tertiary dark:text-text-dark-tertiary ${
            triggerVariant === 'nav' ? 'h-3.5 w-3.5' : 'h-4 w-4'
          }`}
        />
        <span
          className={`flex-1 text-text-light-tertiary dark:text-text-dark-tertiary ${
            triggerVariant === 'nav' ? 'text-[11px]' : 'text-sm'
          }`}
        >
          {triggerVariant === 'nav'
            ? 'Search'
            : 'Search chapters, functions, and questions...'}
        </span>
        <kbd
          className={`rounded-md border border-light-border bg-light-muted text-text-light-tertiary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-tertiary ${
            triggerVariant === 'nav' ? 'px-1 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[11px]'
          }`}
        >
          ⌘K
        </kbd>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="mx-auto mt-20 w-[min(760px,95vw)] overflow-hidden rounded-2xl border border-light-border bg-light-surface shadow-2xl dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center gap-2 border-b border-light-border px-4 py-3 dark:border-dark-border">
              <Search className="h-4 w-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search chapters, functions, questions..."
                className="flex-1 bg-transparent text-sm text-text-light-primary outline-none placeholder:text-text-light-tertiary dark:text-text-dark-primary dark:placeholder:text-text-dark-tertiary"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-md p-1 text-text-light-tertiary hover:bg-light-hover dark:text-text-dark-tertiary dark:hover:bg-dark-hover"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              <kbd className="rounded-md border border-light-border bg-light-muted px-2 py-0.5 text-[11px] text-text-light-tertiary dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-tertiary">
                ESC
              </kbd>
            </div>

            <div className="flex items-center gap-2 border-b border-light-border px-4 py-2 dark:border-dark-border">
              {FILTERS.map((entry) => (
                <button
                  key={entry.label}
                  type="button"
                  onClick={() => {
                    setFilter(entry.id);
                    setActiveIndex(0);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filter === entry.id
                      ? 'bg-brand-500 text-white'
                      : 'bg-light-muted text-text-light-secondary hover:bg-light-hover dark:bg-dark-muted dark:text-text-dark-secondary dark:hover:bg-dark-hover'
                  }`}
                >
                  {entry.label}
                </button>
              ))}

              {query ? (
                <span className="ml-auto text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  {filteredResults.length} result{filteredResults.length === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>

            <div className="max-h-[430px] overflow-y-auto py-1">
              {!query.trim() ? (
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-light-tertiary dark:text-text-dark-tertiary">
                    Recent searches
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recentSearches.length > 0 ? (
                      recentSearches.map((entry) => (
                        <button
                          key={entry}
                          type="button"
                          onClick={() => setQuery(entry)}
                          className="rounded-full border border-light-border bg-light-muted px-3 py-1 text-xs text-text-light-secondary hover:border-brand-300 hover:text-brand-600 dark:border-dark-border dark:bg-dark-muted dark:text-text-dark-secondary dark:hover:border-brand-700 dark:hover:text-brand-300"
                        >
                          {entry}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                        Start typing to build search history.
                      </span>
                    )}
                  </div>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    No results for &quot;{query}&quot;.
                  </p>
                  <p className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                    Try a different keyword.
                  </p>
                </div>
              ) : (
                <>
                  {renderGroup('Theory Chapters', 'chapter', grouped.chapters)}
                  {renderGroup('Functions', 'function', grouped.functions)}
                  {renderGroup('Practice Questions', 'question', grouped.questions)}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
