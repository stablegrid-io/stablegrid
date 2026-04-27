import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CheckpointResult {
  passed: boolean;
  attempts: number;
  bestScore: number;
  lastScore: number;
  totalQuestions: number;
  updatedAt: string;
  /**
   * True when this entry was recorded but not yet acknowledged by the server.
   * Used by `flushPendingSync` to retry failed POSTs on next page load so a
   * pass made offline (or while the API was rate-limited) eventually syncs.
   * The server is the cross-device source of truth — see
   * lib/learn/serverTheoryProgress.ts and the module_checkpoints migration.
   */
  pendingSync?: boolean;
}

interface CheckpointState {
  results: Record<string, CheckpointResult>;
  hasHydrated: boolean;
  recordAttempt: (
    key: string,
    payload: { correct: number; total: number; passed: boolean }
  ) => void;
  /** Merge server-fetched checkpoint state into the cache. Server wins on `passed`
   *  (sticky-true on both sides) but never clobbers a local pass — that lets
   *  optimistic local updates survive a stale server response. */
  seedFromServer: (
    serverResults: Record<string, { passed: boolean; updatedAt?: string | null }>
  ) => void;
  /** Best-effort retry of any locally-flagged `pendingSync` results. */
  flushPendingSync: () => Promise<void>;
  reset: (key: string) => void;
  resetAll: () => void;
}

export const buildCheckpointKey = (topic: string, moduleId: string) =>
  `${topic.toLowerCase()}::${moduleId}`;

const parseCheckpointKey = (
  key: string
): { topic: string; moduleId: string } | null => {
  const idx = key.indexOf('::');
  if (idx < 0) return null;
  const topic = key.slice(0, idx);
  const moduleId = key.slice(idx + 2);
  if (!topic || !moduleId) return null;
  return { topic, moduleId };
};

const postRecord = async (
  key: string,
  payload: { correct: number; total: number }
): Promise<boolean> => {
  if (typeof fetch === 'undefined') return false;
  const parts = parseCheckpointKey(key);
  if (!parts) return false;
  try {
    const response = await fetch('/api/learn/module-checkpoint', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'record',
        topic: parts.topic,
        moduleId: parts.moduleId,
        correct: payload.correct,
        total: payload.total,
      }),
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const useCheckpointStore = create<CheckpointState>()(
  persist(
    (set, get) => ({
      results: {},
      hasHydrated: false,
      recordAttempt: (key, { correct, total, passed }) => {
        // 1. Immediate localStorage write keeps the UI responsive.
        set((state) => {
          const previous = state.results[key];
          const score = total > 0 ? correct / total : 0;
          const bestScore = Math.max(previous?.bestScore ?? 0, score);
          return {
            results: {
              ...state.results,
              [key]: {
                passed: previous?.passed === true ? true : passed,
                attempts: (previous?.attempts ?? 0) + 1,
                bestScore,
                lastScore: score,
                totalQuestions: total,
                updatedAt: new Date().toISOString(),
                pendingSync: true,
              },
            },
          };
        });

        // 2. Background sync. Failure is tolerated — the entry stays
        //    `pendingSync: true` and `flushPendingSync` will retry on next load.
        void postRecord(key, { correct, total }).then((ok) => {
          if (!ok) return;
          set((state) => {
            const current = state.results[key];
            if (!current) return state;
            return {
              results: {
                ...state.results,
                [key]: { ...current, pendingSync: false },
              },
            };
          });
        });
      },
      seedFromServer: (serverResults) =>
        set((state) => {
          const merged: Record<string, CheckpointResult> = { ...state.results };
          for (const [key, server] of Object.entries(serverResults)) {
            if (!server.passed) continue;
            const existing = merged[key];
            if (existing) {
              if (!existing.passed) {
                merged[key] = { ...existing, passed: true, pendingSync: false };
              } else if (existing.pendingSync) {
                merged[key] = { ...existing, pendingSync: false };
              }
            } else {
              merged[key] = {
                passed: true,
                attempts: 0,
                bestScore: 0,
                lastScore: 0,
                totalQuestions: 0,
                updatedAt: server.updatedAt ?? new Date().toISOString(),
              };
            }
          }
          return { results: merged };
        }),
      flushPendingSync: async () => {
        const pending = Object.entries(get().results).filter(
          ([, value]) => value.pendingSync
        );
        if (pending.length === 0) return;
        for (const [key, value] of pending) {
          // Re-derive correct/total from cached score; the server only needs
          // them to record an attempt and recompute `passed`. A pending entry
          // always has a known totalQuestions because it was set on attempt.
          const correct = Math.round(value.lastScore * value.totalQuestions);
          const total = value.totalQuestions;
          if (total <= 0) {
            // Legacy entry from before pendingSync existed — clear the flag.
            set((state) => {
              const current = state.results[key];
              if (!current) return state;
              return {
                results: {
                  ...state.results,
                  [key]: { ...current, pendingSync: false },
                },
              };
            });
            continue;
          }
          const ok = await postRecord(key, { correct, total });
          if (ok) {
            set((state) => {
              const current = state.results[key];
              if (!current) return state;
              return {
                results: {
                  ...state.results,
                  [key]: { ...current, pendingSync: false },
                },
              };
            });
          }
        }
      },
      reset: (key) =>
        set((state) => {
          if (!state.results[key]) return state;
          const next = { ...state.results };
          delete next[key];
          return { results: next };
        }),
      resetAll: () => set({ results: {} }),
    }),
    {
      name: 'stablegrid-checkpoints',
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
