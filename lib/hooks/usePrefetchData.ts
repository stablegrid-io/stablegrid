'use client';

import { useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useProgressStore } from '@/lib/stores/useProgressStore';

/**
 * Hover-warming for Zustand-backed data that the destination route will
 * need on mount. The codebase doesn't use React Query / SWR, so we warm
 * stores directly — same idea, different shape.
 *
 * Two endpoints carry the most weight:
 *
 *   - `/api/auth/sync-progress` — XP, streak, completed questions. Powers
 *     the home dashboard and the tier badge in the topbar / sidebar.
 *   - `/api/operations/practice/mastery` — practice-tasks-solved, module
 *     completion by tier. Heaviest endpoint; powers the tier system.
 *
 * Routes that benefit:
 *   - `/home` → both endpoints (dashboard reads XP + tier breakdown)
 *   - `/practice`, `/stats`, `/settings` → mastery (tier badge needs it)
 *
 * We only fire if the store hasn't synced in `STALE_MS` to avoid a
 * thundering herd when a user hovers several links in a row.
 */

const STALE_MS = 60_000;

const ROUTES_NEEDING_PROGRESS = ['/home', '/stats', '/settings', '/profile'];
const ROUTES_NEEDING_PRACTICE_STATS = ['/practice', '/stats', '/settings', '/profile'];

const matchesPrefix = (href: string, prefixes: string[]) =>
  prefixes.some((prefix) => href === prefix || href.startsWith(`${prefix}/`));

export function usePrefetchData() {
  const lastFiredRef = useRef<{ progress: number; practiceStats: number }>({
    progress: 0,
    practiceStats: 0,
  });

  const prefetchData = useCallback((href: string) => {
    if (!href) return;
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = Date.now();
    const { syncProgress, syncPracticeStats, lastSynced } = useProgressStore.getState();
    const lastSyncedTs = lastSynced ? Date.parse(lastSynced) : 0;

    // Progress endpoint — cheap to call, but still skip if recently synced.
    if (matchesPrefix(href, ROUTES_NEEDING_PROGRESS)) {
      const localCooldownOk = now - lastFiredRef.current.progress > STALE_MS;
      const storeCooldownOk = now - lastSyncedTs > STALE_MS;
      if (localCooldownOk && storeCooldownOk) {
        lastFiredRef.current.progress = now;
        void syncProgress(userId);
      }
    }

    // Mastery endpoint — heaviest in the codebase, gate strictly.
    if (matchesPrefix(href, ROUTES_NEEDING_PRACTICE_STATS)) {
      const localCooldownOk = now - lastFiredRef.current.practiceStats > STALE_MS;
      if (localCooldownOk) {
        lastFiredRef.current.practiceStats = now;
        void syncPracticeStats();
      }
    }
  }, []);

  return prefetchData;
}
