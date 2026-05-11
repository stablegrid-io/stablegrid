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

const MAX_LOCAL_ENERGY_EVENTS = 200;

// Module-level in-flight guard for the flush POST. Without this, two
// rapid event-creating actions (addXP, answerQuestion) both fire
// `flushEnergyEvents` and produce overlapping POSTs; the second call's
// `set(...)` can re-add ids the first removed, since closure of the
// state is snapshotted at each call's start. Server upsert dedupes the
// actual rows, but client-side bookkeeping drifts.
let energyFlushInFlight = false;

/**
 * Trim the local energy-events array to the last N, but never drop a
 * pending event — those still need to be POSTed to the server. Without
 * this, a long session (>200 events between flushes) would slice the
 * earliest events out of the array while their ids remained in
 * `pendingEnergyEventIds`, causing the next `flushEnergyEvents` to find
 * no rows and clear the pending list — permanent data loss.
 */
const trimEnergyEvents = (
  events: EnergyEvent[],
  pendingIds: string[],
): EnergyEvent[] => {
  if (events.length <= MAX_LOCAL_ENERGY_EVENTS) return events;
  const pending = new Set(pendingIds);
  const tail = events.slice(-MAX_LOCAL_ENERGY_EVENTS);
  const idsInTail = new Set(tail.map((e) => e.id));
  const missingPending = events.filter(
    (e) => pending.has(e.id) && !idsInTail.has(e.id),
  );
  if (missingPending.length === 0) return tail;
  return [...missingPending, ...tail].sort((a, b) => a.timestamp - b.timestamp);
};

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
  /**
   * Practice-side numbers required by the tier system. Hydrated via
   * syncPracticeStats() (calls /api/operations/practice/mastery). Defaults
   * are zero so a fresh user resolves to Junior cleanly.
   */
  practiceTasksSolved: number;
  practiceModulesCompleteByTier: { junior: number; mid: number; senior: number };
  /** False until the first `syncPracticeStats` call resolves. Lets UI
   *  render a loading state instead of "0/30 tasks" on a fresh tab —
   *  the counts hydrate asynchronously after first render, so without
   *  this flag the tier gauges briefly read zero before the real numbers
   *  land (visible flash on slow connections). Once true it stays true
   *  for the session; reset only on user switch / reset. */
  practiceStatsHydrated: boolean;
  dailyXP: Record<string, number>;
  dailyQuestions: Record<string, number>;
  questionHistory: QuestionAttempt[];
  energyEvents: EnergyEvent[];
  /** User who owns the locally-persisted `energyEvents`. We only clear the
      log when a *different* user signs in on this device — not on every
      sign-out. Hydration from the server fills the same field for the
      logged-in operator. */
  energyEventsUserId: string | null;
  /** Client ids of events that have been generated locally but not yet
      acked by the server. Survives reload (in partialize) so a tab that
      crashed mid-flush retries on next boot. */
  pendingEnergyEventIds: string[];
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
  /** POST any locally-pending positive-units events to the server. Safe to
      call from anywhere — duplicates are dropped server-side via the
      (user_id, client_id) unique index. */
  flushEnergyEvents: () => Promise<void>;
  /** GET the operator's event log from the server and merge with local
      state. Called on sign-in and on syncProgress so chart history follows
      the account across devices. */
  hydrateEnergyEvents: () => Promise<void>;
  /** Refresh practiceTasksSolved + practiceModulesCompleteByTier from /mastery. */
  syncPracticeStats: () => Promise<void>;
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
      practiceTasksSolved: 0,
      practiceModulesCompleteByTier: { junior: 0, mid: 0, senior: 0 },
      practiceStatsHydrated: false,
      dailyXP: {},
      dailyQuestions: {},
      questionHistory: [],
      energyEvents: [],
      energyEventsUserId: null,
      pendingEnergyEventIds: [],
      lastSynced: null,
      userId: null,
      addXP: (xpToAdd, event) => {
        if (!Number.isFinite(xpToAdd) || xpToAdd <= 0) return;

        const now = new Date().toISOString();
        const today = now.split('T')[0];

        const newEvent: EnergyEvent = {
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          source: event?.source ?? 'manual',
          units: xpToAdd,
          timestamp: Date.now(),
          topic: event?.topic,
          label: event?.label
        };

        set((state) => {
          const nextPending = [...state.pendingEnergyEventIds, newEvent.id];
          return {
            xp: state.xp + xpToAdd,
            revision: state.revision + 1,
            dailyXP: {
              ...state.dailyXP,
              [today]: (state.dailyXP[today] ?? 0) + xpToAdd
            },
            energyEvents: trimEnergyEvents(
              [...state.energyEvents, newEvent],
              nextPending,
            ),
            pendingEnergyEventIds: nextPending
          };
        });

        void get().saveProgress();
        void get().flushEnergyEvents();
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
          const newPendingIds: string[] = [];
          if (shouldRecord && correct && xp > 0) {
            const evt: EnergyEvent = {
              id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              source: 'flashcard-correct',
              units: xp,
              timestamp: Date.now(),
              topic,
              label: 'Flashcard correct'
            };
            nextEnergyEvents.push(evt);
            newPendingIds.push(evt.id);
          }
          if (streakBonus > 0) {
            const evt: EnergyEvent = {
              id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              source: 'streak-milestone',
              units: streakBonus,
              timestamp: Date.now(),
              topic,
              label: `${nextStreak} streak milestone`
            };
            nextEnergyEvents.push(evt);
            newPendingIds.push(evt.id);
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
            energyEvents: trimEnergyEvents(
              nextEnergyEvents,
              [...state.pendingEnergyEventIds, ...newPendingIds],
            ),
            pendingEnergyEventIds: [...state.pendingEnergyEventIds, ...newPendingIds]
          };
        });

        void get().saveProgress();
        void get().flushEnergyEvents();
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
            energyEvents: trimEnergyEvents(
              [...state.energyEvents, deploymentEvent],
              state.pendingEnergyEventIds,
            )
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
      setUserId: (userId) => {
        let shouldHydrate = false;
        set((state) => {
          // Clear the energy log only when a *different* user signs in on
          // this device — preserve it across simple logout/login of the
          // same operator. Sign-out alone passes `userId === null`, which
          // we treat as a no-op for the log.
          if (
            userId !== null &&
            state.energyEventsUserId !== null &&
            state.energyEventsUserId !== userId
          ) {
            shouldHydrate = true;
            // Different user — clear the energy log and the cached
            // practice tier counts (they're personal numbers and would
            // briefly show the previous operator's data otherwise).
            return {
              userId,
              energyEvents: [],
              energyEventsUserId: userId,
              pendingEnergyEventIds: [],
              practiceTasksSolved: 0,
              practiceModulesCompleteByTier: { junior: 0, mid: 0, senior: 0 },
              practiceStatsHydrated: false
            };
          }
          if (userId !== null && state.energyEventsUserId === null) {
            shouldHydrate = true;
            return { userId, energyEventsUserId: userId };
          }
          return { userId };
        });
        if (shouldHydrate) {
          void get().hydrateEnergyEvents();
          void get().flushEnergyEvents();
        }
      },
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
        // Energy events live in their own table — pull them after the
        // main progress sync so the chart hydrates on every login.
        void get().hydrateEnergyEvents();
        void get().flushEnergyEvents();
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
      flushEnergyEvents: async () => {
        if (energyFlushInFlight) return;
        const state = get();
        if (state.userId === null) return;
        // Cross-user safety: only flush when the current session's user
        // owns the local log. Without this, a race between sign-out and
        // sign-in-as-different-user could POST user A's queued events
        // under user B's cookies (the server would happily insert them
        // under B). `setUserId` clears `energyEventsUserId` to match
        // the new userId before this guard runs.
        if (
          state.energyEventsUserId !== null &&
          state.energyEventsUserId !== state.userId
        ) {
          return;
        }
        if (state.pendingEnergyEventIds.length === 0) return;
        // Only push positive-units events. Spend events
        // (infrastructure-deploy, units < 0) stay local — the deployed
        // node list is the canonical record of spends.
        const pendingSet = new Set(state.pendingEnergyEventIds);
        const eventsById = new Map(state.energyEvents.map((e) => [e.id, e]));
        const toSend = state.energyEvents.filter(
          (e) => pendingSet.has(e.id) && e.units > 0,
        );
        if (toSend.length === 0) {
          // Pending ids reference no shippable events — only spend events
          // (units <= 0) or events that have been trimmed (which the
          // trim helper now prevents, but stay defensive). Drop only
          // those specific ids; don't blanket-clear pending or we'd
          // permanently forget events that genuinely haven't shipped.
          const stillPending = state.pendingEnergyEventIds.filter((id) => {
            const e = eventsById.get(id);
            return e !== undefined && e.units > 0;
          });
          if (stillPending.length !== state.pendingEnergyEventIds.length) {
            set({ pendingEnergyEventIds: stillPending });
          }
          return;
        }
        energyFlushInFlight = true;
        try {
          const response = await fetch('/api/energy-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ events: toSend }),
          });
          if (!response.ok) {
            // Leave pending in place; next call will retry.
            return;
          }
          // Drop the just-flushed ids from pending. New events may have
          // landed during the await — keep them.
          const flushed = new Set(toSend.map((e) => e.id));
          set((current) => ({
            pendingEnergyEventIds: current.pendingEnergyEventIds.filter(
              (id) => !flushed.has(id),
            ),
          }));
        } catch {
          // Network error — retain queue for next attempt.
        } finally {
          energyFlushInFlight = false;
        }
      },
      hydrateEnergyEvents: async () => {
        if (get().userId === null) return;
        try {
          const response = await fetch('/api/energy-events', {
            method: 'GET',
            credentials: 'same-origin',
          });
          if (!response.ok) return;
          const payload = await response.json();
          const remote = payload?.data?.events;
          if (!Array.isArray(remote)) return;
          set((state) => {
            // Merge by id — local entries that haven't been flushed yet
            // are preserved, and server entries (which are authoritative
            // for everything else) fill in history we don't have.
            const byId = new Map<string, EnergyEvent>();
            for (const r of remote) {
              const id = typeof r?.id === 'string' ? r.id : null;
              const ts = Number(r?.timestamp);
              const units = Number(r?.units);
              const source = typeof r?.source === 'string' ? r.source : null;
              if (!id || !source || !Number.isFinite(ts) || !Number.isFinite(units)) {
                continue;
              }
              byId.set(id, {
                id,
                source: source as EnergyEventSource,
                units,
                timestamp: ts,
                topic: typeof r?.topic === 'string' ? (r.topic as PracticeTopic) : undefined,
                label: typeof r?.label === 'string' ? r.label : undefined,
              });
            }
            for (const local of state.energyEvents) {
              byId.set(local.id, local);
            }
            const merged = Array.from(byId.values()).sort(
              (a, b) => a.timestamp - b.timestamp,
            );
            return {
              energyEvents: trimEnergyEvents(merged, state.pendingEnergyEventIds),
            };
          });
        } catch {
          // Network error — caller may retry.
        }
      },
      syncPracticeStats: async () => {
        try {
          const res = await fetch('/api/operations/practice/mastery', {
            credentials: 'same-origin',
          });
          if (!res.ok) return;
          const json = (await res.json()) as {
            summary?: {
              distinctTasksSolved?: number;
              modulesCompleteByTier?: { junior?: number; mid?: number; senior?: number };
            };
          };
          const s = json?.summary;
          if (!s) return;
          set({
            practiceTasksSolved: s.distinctTasksSolved ?? 0,
            practiceModulesCompleteByTier: {
              junior: s.modulesCompleteByTier?.junior ?? 0,
              mid: s.modulesCompleteByTier?.mid ?? 0,
              senior: s.modulesCompleteByTier?.senior ?? 0,
            },
            practiceStatsHydrated: true,
          });
        } catch {
          /* network failure — leave existing values, tier display
             stays at the last-known good state */
        }
      },
      resetStreak: () => set((state) => ({ streak: 0, revision: state.revision + 1 })),
      resetProgress: () =>
        // Logout no longer wipes `energyEvents` / `energyEventsUserId` —
        // those are local-only history that should survive a sign-out so
        // the chart still has data when the same operator signs back in.
        // Cross-user contamination is handled in `setUserId`, which clears
        // the log when a *different* user authenticates.
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
        energyEvents: state.energyEvents,
        energyEventsUserId: state.energyEventsUserId,
        pendingEnergyEventIds: state.pendingEnergyEventIds,
        // Cache the practice tier numbers so a fresh tab doesn't flash
        // "0/30" before `syncPracticeStats` resolves. The flag stays
        // true after first hydration; we only reset it on user switch
        // (handled in setUserId / resetProgress).
        practiceTasksSolved: state.practiceTasksSolved,
        practiceModulesCompleteByTier: state.practiceModulesCompleteByTier,
        practiceStatsHydrated: state.practiceStatsHydrated
      })
    }
  )
);

