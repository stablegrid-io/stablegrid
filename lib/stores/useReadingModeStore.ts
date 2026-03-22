import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReadingMode = 'dark' | 'light' | 'book';

interface ReadingModeState {
  mode: ReadingMode;
  focusMode: boolean;
  hasHydrated: boolean;
  setMode: (mode: ReadingMode) => void;
  toggleFocus: () => void;
}

export const useReadingModeStore = create<ReadingModeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      focusMode: false,
      hasHydrated: false,
      setMode: (mode) => set({ mode }),
      toggleFocus: () => set((state) => ({ focusMode: !state.focusMode })),
    }),
    {
      name: 'stablegrid-reading-mode',
      onRehydrateStorage: () => () => {
        useReadingModeStore.setState({ hasHydrated: true });
      },
    }
  )
);
