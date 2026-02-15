import { MISSIONS, type MissionDefinition } from '@/data/missions';
import type { UserMissionProgress } from '@/types/missions';

export type MissionWithProgress = MissionDefinition;

export const applyMissionProgress = (
  missions: MissionDefinition[],
  progress: UserMissionProgress[]
): MissionWithProgress[] => {
  const progressMap = new Map(progress.map((item) => [item.missionSlug, item]));

  return missions.map((mission) => {
    const userProgress = progressMap.get(mission.slug);

    if (!userProgress) {
      return {
        ...mission,
        completed: false,
        status: mission.status
      };
    }

    const completed = userProgress.state === 'completed';
    const status: MissionDefinition['status'] = userProgress.unlocked
      ? 'available'
      : 'locked';

    return {
      ...mission,
      completed,
      status
    };
  });
};

export const mergeWithDefaultMissions = (
  progress: UserMissionProgress[]
): MissionWithProgress[] => applyMissionProgress(MISSIONS, progress);
