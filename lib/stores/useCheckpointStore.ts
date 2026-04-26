import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CheckpointResult {
  passed: boolean;
  attempts: number;
  bestScore: number;
  lastScore: number;
  totalQuestions: number;
  updatedAt: string;
}

interface CheckpointState {
  results: Record<string, CheckpointResult>;
  hasHydrated: boolean;
  recordAttempt: (
    key: string,
    payload: { correct: number; total: number; passed: boolean }
  ) => void;
  reset: (key: string) => void;
  resetAll: () => void;
}

export const buildCheckpointKey = (topic: string, moduleId: string) =>
  `${topic.toLowerCase()}::${moduleId}`;

export const useCheckpointStore = create<CheckpointState>()(
  persist(
    (set) => ({
      results: {},
      hasHydrated: false,
      recordAttempt: (key, { correct, total, passed }) =>
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
              },
            },
          };
        }),
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
