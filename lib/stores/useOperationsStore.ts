'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OperationResult {
  missionId: string;
  completed: boolean;
  correct: boolean;
  answeredAt: string;
  creditsPaid: number;
}

interface OperationsState {
  credits: number;
  completedOperations: Record<string, OperationResult>;
  gridPlacements: Record<number, string>; // slotId → assetId

  addCredits: (amount: number) => void;
  deductCredits: (amount: number) => void;
  recordOperationResult: (missionId: string, result: OperationResult) => void;
  placeAsset: (slotId: number, assetId: string) => void;
  removeAsset: (slotId: number) => void;
}

export const useOperationsStore = create<OperationsState>()(
  persist(
    (set) => ({
      credits: 0,
      completedOperations: {},
      gridPlacements: {},

      addCredits: (amount) =>
        set((s) => ({ credits: s.credits + amount })),

      deductCredits: (amount) =>
        set((s) => ({ credits: Math.max(0, s.credits - amount) })),

      recordOperationResult: (missionId, result) =>
        set((s) => ({
          completedOperations: { ...s.completedOperations, [missionId]: result },
        })),

      placeAsset: (slotId, assetId) =>
        set((s) => ({
          gridPlacements: { ...s.gridPlacements, [slotId]: assetId },
        })),

      removeAsset: (slotId) =>
        set((s) => {
          const next = { ...s.gridPlacements };
          delete next[slotId];
          return { gridPlacements: next };
        }),
    }),
    { name: 'grid-flux-operations' }
  )
);
