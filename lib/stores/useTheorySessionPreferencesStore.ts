'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  clampTheorySessionConfig,
  getDefaultTheorySessionConfig,
  type TheorySessionConfig,
  type TheorySessionMethodId
} from '@/lib/learn/theorySession';

export const DEFAULT_THEORY_SESSION_CONFIGS: Record<
  TheorySessionMethodId,
  TheorySessionConfig
> = {
  pomodoro: getDefaultTheorySessionConfig('pomodoro'),
  'deep-focus': getDefaultTheorySessionConfig('deep-focus'),
  sprint: getDefaultTheorySessionConfig('sprint'),
  'free-read': getDefaultTheorySessionConfig('free-read')
};

export const resolveTheorySessionMethodConfig = ({
  methodId,
  storedConfigs
}: {
  methodId: TheorySessionMethodId;
  storedConfigs?: Partial<Record<TheorySessionMethodId, TheorySessionConfig>> | null;
}) => {
  const stored = storedConfigs?.[methodId];
  return stored
    ? clampTheorySessionConfig(stored)
    : DEFAULT_THEORY_SESSION_CONFIGS[methodId];
};

export const resolveTheorySessionMethodConfigs = (
  storedConfigs?: Partial<Record<TheorySessionMethodId, TheorySessionConfig>> | null
) => {
  return {
    pomodoro: resolveTheorySessionMethodConfig({ methodId: 'pomodoro', storedConfigs }),
    'deep-focus': resolveTheorySessionMethodConfig({
      methodId: 'deep-focus',
      storedConfigs
    }),
    sprint: resolveTheorySessionMethodConfig({ methodId: 'sprint', storedConfigs }),
    'free-read': resolveTheorySessionMethodConfig({
      methodId: 'free-read',
      storedConfigs
    })
  } satisfies Record<TheorySessionMethodId, TheorySessionConfig>;
};

interface TheorySessionPreferencesState {
  methodConfigs: Partial<Record<TheorySessionMethodId, TheorySessionConfig>>;
  hasHydrated: boolean;
  setMethodConfig: (methodId: TheorySessionMethodId, config: TheorySessionConfig) => void;
  resetMethodConfig: (methodId: TheorySessionMethodId) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useTheorySessionPreferencesStore = create<TheorySessionPreferencesState>()(
  persist(
    (set) => ({
      methodConfigs: {},
      hasHydrated: false,
      setMethodConfig: (methodId, config) =>
        set((state) => ({
          methodConfigs: {
            ...state.methodConfigs,
            [methodId]: clampTheorySessionConfig(config)
          }
        })),
      resetMethodConfig: (methodId) =>
        set((state) => {
          const nextConfigs = { ...state.methodConfigs };
          delete nextConfigs[methodId];
          return {
            methodConfigs: nextConfigs
          };
        }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: 'stablegrid-theory-session-defaults',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState as
          | {
              defaultConfig?: TheorySessionConfig | null;
              methodConfigs?: Partial<
                Record<TheorySessionMethodId, TheorySessionConfig>
              > | null;
            }
          | undefined;

        if (!state) {
          return {
            methodConfigs: {},
            hasHydrated: false
          };
        }

        if (state.methodConfigs) {
          return {
            methodConfigs: state.methodConfigs,
            hasHydrated: false
          };
        }

        if (state.defaultConfig) {
          return {
            methodConfigs: {
              [state.defaultConfig.methodId]: clampTheorySessionConfig(
                state.defaultConfig
              )
            },
            hasHydrated: false
          };
        }

        return {
          methodConfigs: {},
          hasHydrated: false
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
