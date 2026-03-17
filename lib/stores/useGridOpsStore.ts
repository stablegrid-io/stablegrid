'use client';

import { create } from 'zustand';

interface GridOpsStore {
  activeIncidentCount: number;
  setActiveIncidentCount: (count: number) => void;
}

export const useGridOpsStore = create<GridOpsStore>()((set) => ({
  activeIncidentCount: 0,
  setActiveIncidentCount: (count) => set({ activeIncidentCount: count })
}));
