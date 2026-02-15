'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PracticeTopic } from '@/lib/types';

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

interface ProgressState {
  xp: number;
  streak: number;
  completedQuestions: string[];
  topicProgress: Record<PracticeTopic, TopicStats>;
  dailyXP: Record<string, number>;
  dailyQuestions: Record<string, number>;
  questionHistory: QuestionAttempt[];
  lastSynced: string | null;
  userId: string | null;
  addXP: (xp: number) => void;
  answerQuestion: (
    questionId: string,
    topic: PracticeTopic,
    correct: boolean,
    xp: number
  ) => void;
  setUserId: (userId: string | null) => void;
  syncProgress: (userId: string) => Promise<void>;
  saveProgress: (userId: string) => Promise<void>;
  resetStreak: () => void;
  resetProgress: () => void;
}

const defaultTopicStats: Record<PracticeTopic, TopicStats> = {
  sql: { correct: 0, total: 0, lastAttempted: null },
  python: { correct: 0, total: 0, lastAttempted: null },
  pyspark: { correct: 0, total: 0, lastAttempted: null },
  excel: { correct: 0, total: 0, lastAttempted: null },
  statistics: { correct: 0, total: 0, lastAttempted: null },
  visualization: { correct: 0, total: 0, lastAttempted: null },
  etl: { correct: 0, total: 0, lastAttempted: null }
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      completedQuestions: [],
      topicProgress: defaultTopicStats,
      dailyXP: {},
      dailyQuestions: {},
      questionHistory: [],
      lastSynced: null,
      userId: null,
      addXP: (xpToAdd) => {
        if (!Number.isFinite(xpToAdd) || xpToAdd <= 0) return;

        const now = new Date().toISOString();
        const today = now.split('T')[0];

        set((state) => ({
          xp: state.xp + xpToAdd,
          dailyXP: {
            ...state.dailyXP,
            [today]: (state.dailyXP[today] ?? 0) + xpToAdd
          }
        }));

        const { userId } = get();
        if (userId) {
          void get().saveProgress(userId);
        }
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
          const nextDailyXP = {
            ...state.dailyXP,
            [today]: (state.dailyXP[today] ?? 0) + xp
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
              xp
            }
          ];
          return {
            xp: shouldRecord && correct ? state.xp + xp : state.xp,
            streak: shouldRecord ? (correct ? state.streak + 1 : 0) : state.streak,
            completedQuestions: nextCompleted,
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
            questionHistory: nextHistory
          };
        });

        const { userId } = get();
        if (userId) {
          void get().saveProgress(userId);
        }
      },
      setUserId: (userId) => set({ userId }),
      syncProgress: async (_userId) => {
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
            set({
              xp: data.xp ?? 0,
              streak: data.streak ?? 0,
              completedQuestions: data.completed_questions ?? [],
              topicProgress: {
                ...defaultTopicStats,
                ...(data.topic_progress ?? {})
              },
              lastSynced: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Failed to sync progress:', error);
        }
      },
      saveProgress: async (_userId) => {
        const state = get();
        try {
          const response = await fetch('/api/auth/sync-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              xp: state.xp,
              streak: state.streak,
              completedQuestions: state.completedQuestions,
              topicProgress: state.topicProgress
            })
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
      resetStreak: () => set({ streak: 0 }),
      resetProgress: () =>
        set({
          xp: 0,
          streak: 0,
          completedQuestions: [],
          topicProgress: defaultTopicStats,
          dailyXP: {},
          dailyQuestions: {},
          questionHistory: [],
          lastSynced: null,
          userId: null
        })
    }),
    {
      name: 'gridlock-progress',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        xp: state.xp,
        streak: state.streak,
        completedQuestions: state.completedQuestions,
        topicProgress: state.topicProgress,
        dailyXP: state.dailyXP,
        dailyQuestions: state.dailyQuestions,
        questionHistory: state.questionHistory
      })
    }
  )
);
