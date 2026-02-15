'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bookmark } from 'lucide-react';
import type { CheatSheet, FunctionEntry } from '@/types/learn';
import type { Topic } from '@/types/progress';
import { trackFunctionView, toggleBookmark } from '@/lib/progress';
import { CategoryFilter } from '@/components/learn/CategoryFilter';
import { SearchBar } from '@/components/learn/SearchBar';
import { FunctionList } from '@/components/learn/FunctionList';
import { DetailPanel } from '@/components/learn/DetailPanel';

interface CheatSheetLayoutProps {
  data: CheatSheet;
}

export const CheatSheetLayout = ({ data }: CheatSheetLayoutProps) => {
  const searchParams = useSearchParams();
  const requestedFunctionId = searchParams.get('function');
  const topic = data.topic as Topic;
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFunction, setSelectedFunction] = useState<FunctionEntry | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);

  const bookmarkStorageKey = `gridlock-learn-bookmarks:${data.topic}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(bookmarkStorageKey);
      setBookmarks(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setBookmarks([]);
    } finally {
      setBookmarksLoaded(true);
    }
  }, [bookmarkStorageKey]);

  useEffect(() => {
    if (!bookmarksLoaded) return;
    localStorage.setItem(bookmarkStorageKey, JSON.stringify(bookmarks));
  }, [bookmarks, bookmarkStorageKey, bookmarksLoaded]);

  const filteredFunctions = useMemo(() => {
    return data.functions.filter((entry) => {
      if (search) {
        const needle = search.toLowerCase();
        const matchesSearch =
          entry.name.toLowerCase().includes(needle) ||
          entry.shortDescription.toLowerCase().includes(needle) ||
          entry.longDescription.toLowerCase().includes(needle) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(needle));
        if (!matchesSearch) return false;
      }

      if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
        return false;
      }

      if (showBookmarksOnly && !bookmarks.includes(entry.id)) {
        return false;
      }

      return true;
    });
  }, [bookmarks, data.functions, search, selectedCategory, showBookmarksOnly]);

  const categoriesWithCounts = useMemo(() => {
    const counts = new Map<string, number>();
    data.functions.forEach((entry) => {
      counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    });

    const fromData = data.categories.map((category) => ({
      ...category,
      count: counts.get(category.id) ?? 0
    }));

    const knownIds = new Set(fromData.map((category) => category.id));
    const extras = Array.from(counts.entries())
      .filter(([id]) => !knownIds.has(id))
      .map(([id, count]) => ({
        id,
        label: id
          .split(/[-_]/g)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' '),
        description: '',
        count
      }));

    return [...fromData, ...extras];
  }, [data.categories, data.functions]);

  useEffect(() => {
    if (!selectedFunction) return;
    const stillVisible = filteredFunctions.some(
      (entry) => entry.id === selectedFunction.id
    );
    if (!stillVisible) {
      setSelectedFunction(null);
      setShowMobileDetail(false);
    }
  }, [filteredFunctions, selectedFunction]);

  useEffect(() => {
    if (!requestedFunctionId) {
      return;
    }

    const entry = data.functions.find((item) => item.id === requestedFunctionId);
    if (!entry) {
      return;
    }

    setSelectedFunction(entry);
    setShowMobileDetail(true);
    void trackFunctionView(topic, entry.id);
  }, [data.functions, requestedFunctionId, topic]);

  const handleSelect = (entry: FunctionEntry) => {
    setSelectedFunction(entry);
    setShowMobileDetail(true);
    void trackFunctionView(topic, entry.id);
  };

  const handleToggleBookmark = (id: string) => {
    const nextBookmarked = !bookmarks.includes(id);
    setBookmarks((previous) =>
      previous.includes(id)
        ? previous.filter((bookmarkId) => bookmarkId !== id)
        : [...previous, id]
    );
    void toggleBookmark(topic, id, nextBookmarked);
  };

  const handleSelectRelated = (id: string) => {
    const entry = data.functions.find((item) => item.id === id);
    if (!entry) return;
    setSelectedFunction(entry);
    setShowMobileDetail(true);
    void trackFunctionView(topic, entry.id);
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href={`/learn/${data.topic}`} className="btn btn-ghost text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="h-5 w-px bg-light-border dark:bg-dark-border" />

          <div>
            <h1 className="text-base font-semibold">{data.title}</h1>
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              {data.description}
              {data.version ? ` · ${data.version}` : ''}
            </p>
          </div>

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setShowBookmarksOnly((value) => !value)}
              className={`btn btn-ghost text-sm ${showBookmarksOnly ? 'text-brand-500' : ''}`}
            >
              <Bookmark
                className={`h-4 w-4 ${showBookmarksOnly ? 'fill-brand-500 text-brand-500' : ''}`}
              />
              <span className="hidden sm:inline">Bookmarks</span>
              {bookmarks.length ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
                  {bookmarks.length}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <CategoryFilter
            categories={categoriesWithCounts}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={`${
            showMobileDetail ? 'hidden lg:flex' : 'flex'
          } w-full flex-col border-r border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg lg:w-[26rem] lg:flex-shrink-0`}
        >
          <div className="border-b border-light-border p-4 dark:border-dark-border">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search functions, descriptions, tags..."
            />
            <p className="mt-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              {filteredFunctions.length} of {data.functions.length} entries
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <FunctionList
              functions={filteredFunctions}
              selectedId={selectedFunction?.id ?? null}
              onSelect={handleSelect}
              bookmarkedIds={bookmarks}
              onToggleBookmark={handleToggleBookmark}
            />
          </div>
        </aside>

        <section
          className={`${
            showMobileDetail ? 'block' : 'hidden lg:block'
          } min-h-0 flex-1 overflow-hidden bg-light-bg dark:bg-dark-bg`}
        >
          <DetailPanel
            selectedFunction={selectedFunction}
            allFunctions={data.functions}
            onSelectRelated={handleSelectRelated}
            onClose={() => {
              setShowMobileDetail(false);
              setSelectedFunction(null);
            }}
          />
        </section>
      </div>
    </div>
  );
};
