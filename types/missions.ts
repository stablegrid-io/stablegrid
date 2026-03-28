// Stub — missions system removed.
export type MissionState = 'not_started' | 'in_progress' | 'completed';
export interface UserMissionProgress {
  missionSlug: string;
  state: MissionState;
  completedAt: string | null;
}
