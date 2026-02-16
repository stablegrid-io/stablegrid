export type MissionState = 'not_started' | 'in_progress' | 'completed';

export interface UserMissionProgress {
  missionSlug: string;
  state: MissionState;
  unlocked: boolean;
  startedAt: string | null;
  completedAt: string | null;
  energyAwardedUnits: number;
}
