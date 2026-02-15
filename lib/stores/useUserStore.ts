'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  balance: number;
  reputation: number;
  streak: number;
  completedTasks: string[];
  completeTask: (taskId: string, reward: number) => void;
  resetProgress: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      balance: 0,
      reputation: 0,
      streak: 0,
      completedTasks: [],
      completeTask: (taskId, reward) =>
        set((state) => ({
          balance: state.balance + reward,
          reputation: state.reputation + 10,
          completedTasks: state.completedTasks.includes(taskId)
            ? state.completedTasks
            : [...state.completedTasks, taskId],
          streak: state.streak + 1
        })),
      resetProgress: () =>
        set({
          balance: 0,
          reputation: 0,
          streak: 0,
          completedTasks: []
        })
    }),
    {
      name: 'gridlock-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
