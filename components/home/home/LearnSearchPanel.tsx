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

export function LearnSearchPanel({ triggerVariant = 'default' }: LearnSearchPanelProps) {
  const loader = useCallback(() => loadLearnSearchItems(), []);

  useEffect(() => {
    const preload = () => {
      void loadLearnSearchItems();
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 1800 });
      return () => {
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(preload, 900);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return <HomeSearch loadItems={loader} triggerVariant={triggerVariant} />;
}
