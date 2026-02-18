'use client';

import { useCallback, useEffect } from 'react';
import { HomeSearch } from '@/components/home/home/HomeSearch';

let cachedItemsPromise: Promise<
  import('@/types/home-search').HomeSearchItem[]
> | null = null;

const loadLearnSearchItems = async () => {
  if (!cachedItemsPromise) {
    cachedItemsPromise = import('@/lib/learn-search').then(
      (module) => module.learnSearchItems
    );
  }
  return cachedItemsPromise;
};

interface LearnSearchPanelProps {
  triggerVariant?: 'default' | 'nav';
}

type WindowWithIdle = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function LearnSearchPanel({ triggerVariant = 'default' }: LearnSearchPanelProps) {
  const loader = useCallback(() => loadLearnSearchItems(), []);

  useEffect(() => {
    const preload = () => {
      void loadLearnSearchItems();
    };

    const win = window as WindowWithIdle;

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(preload, { timeout: 1800 });
      return () => {
        win.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = setTimeout(preload, 900);
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return <HomeSearch loadItems={loader} triggerVariant={triggerVariant} />;
}
