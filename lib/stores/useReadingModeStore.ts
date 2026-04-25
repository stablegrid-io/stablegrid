import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReadingMode = 'dark' | 'light' | 'book' | 'kindle' | 'nightowl' | 'black';

interface ReadingModeState {
  mode: ReadingMode;
  focusMode: boolean;
  hasHydrated: boolean;
  setMode: (mode: ReadingMode) => void;
  toggleFocus: () => void;
  setFocus: (value: boolean) => void;
}

function applyFullscreen(enable: boolean) {
  if (typeof document === 'undefined') return;
  try {
    if (enable && !document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.();
    } else if (!enable && document.fullscreenElement) {
      void document.exitFullscreen?.();
    }
  } catch {
    /* ignore — fullscreen may be blocked by browser */
  }
}

export const useReadingModeStore = create<ReadingModeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      focusMode: false,
      hasHydrated: false,
      setMode: (mode) => set({ mode }),
      toggleFocus: () => {
        set((state) => {
          const next = !state.focusMode;
          applyFullscreen(next);
          return { focusMode: next };
        });
      },
      setFocus: (value) => {
        set((state) => {
          if (state.focusMode === value) return state;
          applyFullscreen(value);
          return { focusMode: value };
        });
      },
    }),
    {
      name: 'stablegrid-reading-mode',
      // Don't persist focusMode — it should always start off so the user
      // can see the navigation chrome on every page load.
      partialize: (state) => ({ mode: state.mode }),
      // Drop any focusMode from previously persisted snapshots so it never
      // bleeds into a new session, even briefly.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<ReadingModeState>),
        focusMode: false,
      }),
      onRehydrateStorage: () => () => {
        useReadingModeStore.setState({ hasHydrated: true, focusMode: false });
      },
    }
  )
);

// Keep focusMode in sync when the user exits fullscreen via the browser (ESC, F11, etc.)
if (typeof document !== 'undefined') {
  document.addEventListener('fullscreenchange', () => {
    const inFullscreen = Boolean(document.fullscreenElement);
    const { focusMode } = useReadingModeStore.getState();
    if (focusMode && !inFullscreen) {
      useReadingModeStore.setState({ focusMode: false });
    }
  });
}
