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
   *  optimistic local updates survive a stale server response. Score fields
   *  (lastScore / bestScore) are merged so cross-device reads pick them up
   *  without waiting for a fresh attempt. */
  seedFromServer: (
    serverResults: Record<
      string,
      {
        passed: boolean;
        lastScore?: number;
        bestScore?: number;
        totalQuestions?: number;
        updatedAt?: string | null;
      }
    >
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
            const existing = merged[key];
            const serverLastScore =
              typeof server.lastScore === 'number' && Number.isFinite(server.lastScore)
                ? Math.max(0, Math.min(1, server.lastScore))
                : undefined;
            const serverBestScore =
              typeof server.bestScore === 'number' && Number.isFinite(server.bestScore)
                ? Math.max(0, Math.min(1, server.bestScore))
                : undefined;
            const serverTotal =
              typeof server.totalQuestions === 'number' && server.totalQuestions > 0
                ? server.totalQuestions
                : undefined;

            // No-op: nothing useful to seed for an entry the server has no
            // record of beyond passed=false (e.g. optimistic local-only writes).
            if (!server.passed && serverLastScore === undefined && serverBestScore === undefined) {
              continue;
            }

            if (existing) {
              merged[key] = {
                ...existing,
                // Sticky-true: never demote a local pass.
                passed: existing.passed || server.passed,
                // Adopt server score when local is missing or lower.
                lastScore: serverLastScore !== undefined && serverLastScore > existing.lastScore
                  ? serverLastScore
                  : existing.lastScore,
                bestScore: serverBestScore !== undefined && serverBestScore > existing.bestScore
                  ? serverBestScore
                  : existing.bestScore,
                totalQuestions: existing.totalQuestions || serverTotal || 0,
                pendingSync: existing.pendingSync && !server.passed,
              };
            } else {
              merged[key] = {
                passed: server.passed,
                attempts: 0,
                bestScore: serverBestScore ?? 0,
                lastScore: serverLastScore ?? 0,
                totalQuestions: serverTotal ?? 0,
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
