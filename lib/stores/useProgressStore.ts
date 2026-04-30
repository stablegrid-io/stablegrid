'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PracticeTopic } from '@/lib/types';
import type { TrackId } from '@/lib/tiers';
import { parseTrackId } from '@/lib/tiers';
import { createPayloadRequestKey } from '@/lib/api/requestKeys';
import {
  DEFAULT_DEPLOYED_NODE_IDS,
  ENERGY_REWARDS,
  FLASHCARD_STREAK_MILESTONES,
  INFRASTRUCTURE_BY_ID,
  getAvailableBudgetUnits as computeAvailableBudgetUnits,
  getGridStabilityPct as computeGridStabilityPct,
  kwhToUnits
} from '@/lib/energy';

const sanitizeCompletedTracks = (value: unknown): TrackId[] => {
  if (!Array.isArray(value)) return [];
  const out: TrackId[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    if (seen.has(item)) continue;
    const parsed = parseTrackId(item);
    if (!parsed) continue;
    seen.add(item);
    out.push(item as TrackId);
  }
  return out;
};

const sanitizeDeployedNodeIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [...DEFAULT_DEPLOYED_NODE_IDS];
  }

  const sanitized = value
    .filter((item): item is string => typeof item === 'string')
    .filter((item) => Boolean(INFRASTRUCTURE_BY_ID[item]));

  if (sanitized.length === 0) {
    return [...DEFAULT_DEPLOYED_NODE_IDS];
  }

  const deduped = Array.from(new Set(sanitized));
  if (!deduped.includes(DEFAULT_DEPLOYED_NODE_IDS[0])) {
    deduped.unshift(DEFAULT_DEPLOYED_NODE_IDS[0]);
  }

  return deduped;
};

interface TopicStats {
  correct: number;
  total: number;
  lastAttempted: string | null;
}

interface QuestionAttempt {
  questionId: string;
  topic: PracticeTopic;
  correct: boolean;
  timestamp: number;
  xp: number;
}

type EnergyEventSource =
  | 'flashcard-correct'
  | 'streak-milestone'
  | 'chapter-complete'
  | 'lesson-read'
  | 'practice-task'
  | 'practice-module-complete'
  | 'track-complete'
  | 'mission'
  | 'infrastructure-deploy'
  | 'manual';

interface EnergyEvent {
  id: string;
  source: EnergyEventSource;
  units: number;
  timestamp: number;
  topic?: PracticeTopic;
  label?: string;
}

interface ProgressState {
  xp: number;
  streak: number;
  completedQuestions: string[];
  deployedNodeIds: string[];
  lastDeployedNodeId: string | null;
  revision: number;
  topicProgress: Record<PracticeTopic, TopicStats>;
  /**
   * Track-level completion ids, e.g. ['pyspark-junior', 'sql-junior'].
   * Computed server-side from module_progress and hydrated via syncProgress.
   * Consumed by the tier system (see lib/tiers.ts) to gate Mid/Senior.
   */
  completedTracks: TrackId[];
  dailyXP: Record<string, number>;
  dailyQuestions: Record<string, number>;
  questionHistory: QuestionAttempt[];
  energyEvents: EnergyEvent[];
  lastSynced: string | null;
  userId: string | null;
  addXP: (
    xp: number,
    event?: {
      source?: EnergyEventSource;
      topic?: PracticeTopic;
      label?: string;
    }
  ) => void;
  answerQuestion: (
    questionId: string,
    topic: PracticeTopic,
    correct: boolean,
    xp: number
  ) => void;
  deployInfrastructure: (nodeId: string) => boolean;
  getAvailableBudgetUnits: () => number;
  getGridStabilityPct: () => number;
  setUserId: (userId: string | null) => void;
  syncProgress: (userId: string) => Promise<void>;
  saveProgress: () => Promise<void>;
  resetStreak: () => void;
  resetProgress: () => void;
}

const defaultTopicStats: Record<PracticeTopic, TopicStats> = {
  pyspark: { correct: 0, total: 0, lastAttempted: null },
  fabric: { correct: 0, total: 0, lastAttempted: null }
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      completedQuestions: [],
      deployedNodeIds: [...DEFAULT_DEPLOYED_NODE_IDS],
      lastDeployedNodeId: null,
      revision: 0,
      topicProgress: defaultTopicStats,
      completedTracks: [],
      dailyXP: {},
      dailyQuestions: {},
      questionHistory: [],
      energyEvents: [],
      lastSynced: null,
      userId: null,
      addXP: (xpToAdd, event) => {
        if (!Number.isFinite(xpToAdd) || xpToAdd <= 0) return;

        const now = new Date().toISOString();
        const today = now.split('T')[0];

        set((state) => ({
          xp: state.xp + xpToAdd,
          revision: state.revision + 1,
          dailyXP: {
            ...state.dailyXP,
            [today]: (state.dailyXP[today] ?? 0) + xpToAdd
          },
          energyEvents: [
            ...state.energyEvents,
            {
              id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              source: event?.source ?? 'manual',
              units: xpToAdd,
              timestamp: Date.now(),
              topic: event?.topic,
              label: event?.label
            }
          ].slice(-200)
        }));

        void get().saveProgress();
      },
      answerQuestion: (questionId, topic, correct, xp) => {
        const now = new Date().toISOString();
        const today = now.split('T')[0];
        set((state) => {
          const alreadyCompleted = state.completedQuestions.includes(questionId);
          const nextCompleted = alreadyCompleted
            ? state.completedQuestions
            : [...state.completedQuestions, questionId];
          const currentStats = state.topicProgress[topic] ?? {
            correct: 0,
            total: 0,
            lastAttempted: null
          };

          const shouldRecord = !alreadyCompleted;
          const nextStreak = shouldRecord ? (correct ? state.streak + 1 : 0) : state.streak;
          const streakBonus =
            shouldRecord &&
            correct &&
            FLASHCARD_STREAK_MILESTONES.includes(
              nextStreak as (typeof FLASHCARD_STREAK_MILESTONES)[number]
            )
              ? ENERGY_REWARDS.flashcardStreakMilestoneUnits
              : 0;
          const totalEnergyUnits = shouldRecord && correct ? xp + streakBonus : 0;
          const nextDailyXP = {
            ...state.dailyXP,
            [today]: (state.dailyXP[today] ?? 0) + totalEnergyUnits
          };
          const nextDailyQuestions = {
            ...state.dailyQuestions,
            [today]: (state.dailyQuestions[today] ?? 0) + 1
          };
          const nextHistory = [
            ...state.questionHistory,
            {
              questionId,
              topic,
              correct,
              timestamp: Date.now(),
              xp: totalEnergyUnits
            }
          ];
          const nextEnergyEvents = [...state.energyEvents];
          if (shouldRecord && correct && xp > 0) {
            nextEnergyEvents.push({
              id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              source: 'flashcard-correct',
              units: xp,
              timestamp: Date.now(),
              topic,
              label: 'Flashcard correct'
            });
          }
          if (streakBonus > 0) {
            nextEnergyEvents.push({
              id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              source: 'streak-milestone',
              units: streakBonus,
              timestamp: Date.now(),
              topic,
              label: `${nextStreak} streak milestone`
            });
          }
          return {
            xp: state.xp + totalEnergyUnits,
            streak: nextStreak,
            completedQuestions: nextCompleted,
            revision: state.revision + 1,
            topicProgress: {
              ...state.topicProgress,
              [topic]: {
                correct: shouldRecord && correct ? currentStats.correct + 1 : currentStats.correct,
                total: shouldRecord ? currentStats.total + 1 : currentStats.total,
                lastAttempted: now
              }
            },
            dailyXP: nextDailyXP,
            dailyQuestions: nextDailyQuestions,
            questionHistory: nextHistory,
            energyEvents: nextEnergyEvents.slice(-200)
          };
        });

        void get().saveProgress();
      },
      deployInfrastructure: (nodeId) => {
        let didDeploy = false;
        set((state) => {
          if (state.deployedNodeIds.includes(nodeId)) {
            return state;
          }

          const infrastructure = INFRASTRUCTURE_BY_ID[nodeId];
          if (!infrastructure) {
            return state;
          }

          const availableUnits = computeAvailableBudgetUnits(
            state.xp,
            state.deployedNodeIds
          );
          const requiredUnits = kwhToUnits(infrastructure.kwhRequired);
          if (availableUnits < requiredUnits) {
            return state;
          }

          const deploymentEvent: EnergyEvent = {
            id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            source: 'infrastructure-deploy',
            units: -requiredUnits,
            timestamp: Date.now(),
            label: `Deployed ${infrastructure.name}`
          };

          didDeploy = true;
          return {
            deployedNodeIds: [...state.deployedNodeIds, nodeId],
            lastDeployedNodeId: nodeId,
            revision: state.revision + 1,
            energyEvents: [...state.energyEvents, deploymentEvent].slice(-200)
          };
        });

        if (didDeploy) {
          void get().saveProgress();
        }

        return didDeploy;
      },
      getAvailableBudgetUnits: () => {
        const state = get();
        return computeAvailableBudgetUnits(state.xp, state.deployedNodeIds);
      },
      getGridStabilityPct: () => {
        const state = get();
        return computeGridStabilityPct(state.deployedNodeIds);
      },
      setUserId: (userId) => set({ userId }),
      syncProgress: async (_userId) => {
        const syncStartedAt = Date.now();
        const syncStartRevision = get().revision;
        try {
          const response = await fetch('/api/auth/sync-progress', {
            method: 'GET'
          });
          if (!response.ok) {
            return;
          }
          const payload = await response.json();
          const data = payload?.data;
          if (data) {
            const deployedNodeIds = sanitizeDeployedNodeIds(data.deployed_node_ids);
            const rawLastDeployedNodeId =
              typeof data.last_deployed_node_id === 'string'
                ? data.last_deployed_node_id
                : null;
            set((state) => {
              // Prevent stale sync responses from overriding newer local writes (e.g. deploy right after login).
              if (state.revision !== syncStartRevision) {
                return {
                  lastSynced: new Date().toISOString()
                };
              }
              const latestSync = state.lastSynced ? Date.parse(state.lastSynced) : 0;
              if (Number.isFinite(latestSync) && latestSync > syncStartedAt) {
                return state;
              }

              return {
                xp: data.xp ?? 0,
                streak: data.streak ?? 0,
                completedQuestions: data.completed_questions ?? [],
                deployedNodeIds,
                lastDeployedNodeId:
                  rawLastDeployedNodeId && deployedNodeIds.includes(rawLastDeployedNodeId)
                    ? rawLastDeployedNodeId
                    : null,
                topicProgress: {
                  ...defaultTopicStats,
                  ...(data.topic_progress ?? {})
                },
                completedTracks: sanitizeCompletedTracks(data.completed_tracks),
                lastSynced: new Date().toISOString()
              };
            });
          }
        } catch (error) {
          console.error('Failed to sync progress:', error);
        }
      },
      saveProgress: async () => {
        const state = get();
        try {
          const requestBody = {
            xp: state.xp,
            streak: state.streak,
            completedQuestions: state.completedQuestions,
            deployedNodeIds: state.deployedNodeIds,
            lastDeployedNodeId: state.lastDeployedNodeId,
            topicProgress: state.topicProgress
          };
          const response = await fetch('/api/auth/sync-progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': createPayloadRequestKey('sync_progress', requestBody)
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const payload = await response.json();
            console.error('Failed to save progress:', payload?.error);
            return;
          }

          set({ lastSynced: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to save progress:', error);
        }
      },
      resetStreak: () => set((state) => ({ streak: 0, revision: state.revision + 1 })),
      resetProgress: () =>
        set((state) => ({
          xp: 0,
          streak: 0,
          completedQuestions: [],
          deployedNodeIds: [...DEFAULT_DEPLOYED_NODE_IDS],
          lastDeployedNodeId: null,
          revision: state.revision + 1,
          topicProgress: defaultTopicStats,
          completedTracks: [],
          dailyXP: {},
          dailyQuestions: {},
          questionHistory: [],
          energyEvents: [],
          lastSynced: null,
          userId: null
        }))
    }),
    {
      name: 'stablegrid-progress',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        xp: state.xp,
        streak: state.streak,
        completedQuestions: state.completedQuestions,
        deployedNodeIds: state.deployedNodeIds,
        lastDeployedNodeId: state.lastDeployedNodeId,
        topicProgress: state.topicProgress,
        completedTracks: state.completedTracks,
        dailyXP: state.dailyXP,
        dailyQuestions: state.dailyQuestions,
        questionHistory: state.questionHistory,
        energyEvents: state.energyEvents
      })
    }
  )
);

