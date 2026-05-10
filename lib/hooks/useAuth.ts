'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useProgressStore } from '@/lib/stores/useProgressStore';

// `lastSynced` cooldown — skip the sync-progress GET if we ran one in the
// last `SYNC_COOLDOWN_MS`. Auth-state-change events (tab focus, token
// refresh) re-fire useAuth without the user actually mutating anything;
// the cooldown stops a stampede of identical GETs racing the first paint.
const SYNC_COOLDOWN_MS = 30_000;

// Practice-stats endpoint is the heaviest in the codebase. Defer it past
// first paint so the dashboard / sidebar can render with cached tier
// numbers from the persisted Zustand store. Idle callback timeout falls
// through to setTimeout for browsers that don't support it.
const PRACTICE_STATS_IDLE_TIMEOUT_MS = 1500;

type WindowWithIdle = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export const useAuth = (listen: boolean = false) => {
  const router = useRouter();
  const supabase = createClient();
  const { user, setUser, clearAuth } = useAuthStore();
  const { syncProgress, syncPracticeStats, setUserId, resetProgress } = useProgressStore();

  useEffect(() => {
    if (!listen) {
      return;
    }

    let isMounted = true;
    let practiceStatsIdleId: number | null = null;
    let practiceStatsTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedulePracticeStats = () => {
      const win = window as WindowWithIdle;
      const fire = () => {
        if (!isMounted) return;
        // Practice stats feed the tier system (lib/tiers.ts) — without
        // this fetch the sidebar / profile / dashboard would compute
        // tier from theory + zero practice and could under-report the
        // user's actual tier.
        void syncPracticeStats();
      };
      if (typeof win.requestIdleCallback === 'function') {
        practiceStatsIdleId = win.requestIdleCallback(fire, {
          timeout: PRACTICE_STATS_IDLE_TIMEOUT_MS,
        });
      } else {
        practiceStatsTimeoutId = setTimeout(fire, PRACTICE_STATS_IDLE_TIMEOUT_MS);
      }
    };

    const syncVerifiedUser = async () => {
      const {
        data: { user: verifiedUser }
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (verifiedUser) {
        setUser(verifiedUser);
        setUserId(verifiedUser.id);

        // Cooldown gate — skip the sync if we synced within the last 30s.
        const lastSyncedIso = useProgressStore.getState().lastSynced;
        const lastSyncedTs = lastSyncedIso ? Date.parse(lastSyncedIso) : 0;
        const sinceLastSync = Date.now() - (Number.isFinite(lastSyncedTs) ? lastSyncedTs : 0);
        if (sinceLastSync > SYNC_COOLDOWN_MS) {
          syncProgress(verifiedUser.id);
        }

        // Defer the heavier mastery fetch until after first paint.
        schedulePracticeStats();
      } else {
        clearAuth();
        setUserId(null);
        resetProgress();
      }
    };

    void syncVerifiedUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        clearAuth();
        setUserId(null);
        resetProgress();
        return;
      }

      void syncVerifiedUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      const win = window as WindowWithIdle;
      if (practiceStatsIdleId !== null && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(practiceStatsIdleId);
      }
      if (practiceStatsTimeoutId !== null) {
        clearTimeout(practiceStatsTimeoutId);
      }
    };
  }, [
    listen,
    supabase,
    setUser,
    setUserId,
    syncProgress,
    syncPracticeStats,
    clearAuth,
    resetProgress
  ]);

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    // Preserve the ?next= query param from the current URL so the OAuth
    // callback can honor it (see app/auth/callback/route.ts). Only relative
    // paths are forwarded; anything else is dropped for safety.
    let callbackUrl = `${window.location.origin}/auth/callback`;
    if (typeof window !== 'undefined') {
      const next = new URLSearchParams(window.location.search).get('next');
      if (next && /^\/[a-zA-Z0-9]/.test(next)) {
        callbackUrl += `?next=${encodeURIComponent(next)}`;
      }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl
      }
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
    setUserId(null);
    resetProgress();
    router.push('/login');
  };

  return {
    user,
    loading: useAuthStore((state) => state.loading),
    signInWithOAuth,
    signOut
  };
};
