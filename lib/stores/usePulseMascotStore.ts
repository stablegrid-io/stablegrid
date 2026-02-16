'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PulseMood, PulseMotion, PulseAction } from '@/types/mascot';

interface PulseMascotState {
  mood: PulseMood;
  motion: PulseMotion;
  action: PulseAction;
  setMood: (mood: PulseMood) => void;
  setMotion: (motion: PulseMotion) => void;
  setAction: (action: PulseAction) => void;
  reset: () => void;
}

const DEFAULT_STATE: Pick<PulseMascotState, 'mood' | 'motion' | 'action'> = {
  mood: 'focused',
  motion: 'flow',
  action: 'idle'
};

export const usePulseMascotStore = create<PulseMascotState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setMood: (mood) => set({ mood }),
      setMotion: (motion) => set({ motion }),
      setAction: (action) => set({ action }),
      reset: () => set(DEFAULT_STATE)
    }),
    {
      name: 'datagridlab-pulse-mascot',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mood: state.mood,
        motion: state.motion,
        action: state.action
      })
    }
  )
);
