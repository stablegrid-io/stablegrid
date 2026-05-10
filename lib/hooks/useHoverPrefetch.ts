'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Returns a stable `prefetchRoute(href)` that dedups across the component's
 * lifetime — calling it twice for the same href no-ops on the second call.
 *
 * Extracted from the inline implementation that previously lived in
 * `components/navigation/TopBar.tsx` and `Sidebar.tsx`. The original logic
 * was: lazily prefetch a route when the user hovers a Link, and remember
 * which routes have been prefetched so we don't thrash the network on
 * repeated hovers.
 *
 * Usage:
 *   const prefetch = useHoverPrefetch();
 *   <Link href="/theory" onMouseEnter={() => prefetch('/theory')}>...</Link>
 *
 * Pair with `usePrefetchData` to warm both the JS chunk *and* the data the
 * destination route will need on mount.
 */
export function useHoverPrefetch() {
  const router = useRouter();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetchRoute = useCallback(
    (href: string) => {
      if (!href) return;
      if (prefetchedRef.current.has(href)) return;
      prefetchedRef.current.add(href);
      try {
        router.prefetch(href);
      } catch {
        // Some navigations (intent: 'reload', external URLs) throw — drop them
        // on the floor rather than spamming the console. We re-allow retry by
        // *not* leaving the entry in the dedup set on failure.
        prefetchedRef.current.delete(href);
      }
    },
    [router],
  );

  return prefetchRoute;
}
