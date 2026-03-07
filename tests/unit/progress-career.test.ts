import { describe, expect, it } from 'vitest';
import { buildWorkerCareerSnapshot } from '@/lib/progressCareer';
import type {
  ReadingHistoryEntry,
  ReadingSession,
  TopicProgress
} from '@/types/progress';
import type { UserMissionProgress } from '@/types/missions';

const nowIso = new Date().toISOString();
const yesterdayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const twoDaysAgoIso = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

const makeTopicProgress = (overrides: Partial<TopicProgress> = {}): TopicProgress => ({
  id: 'progress-pyspark',
  userId: 'user-1',
  topic: 'pyspark',
  theoryChaptersTotal: 20,
  theoryChaptersCompleted: 0,
  theorySectionsTotal: 100,
  theorySectionsRead: 0,
  theoryTotalMinutesRead: 0,
  practiceQuestionsTotal: 80,
  practiceQuestionsAttempted: 0,
  practiceQuestionsCorrect: 0,
  functionsTotal: 91,
  functionsViewed: 0,
  functionsBookmarked: 0,
  overallCompletionPct: 0,
  firstActivityAt: null,
  lastActivityAt: null,
  ...overrides
});

const makeReadingSession = (overrides: Partial<ReadingSession> = {}): ReadingSession => ({
  id: 'session-1',
  userId: 'user-1',
  topic: 'pyspark',
  chapterId: 'module-01',
  chapterNumber: 1,
  startedAt: twoDaysAgoIso,
  lastActiveAt: yesterdayIso,
  completedAt: null,
  sectionsTotal: 10,
  sectionsRead: 4,
  sectionsIdsRead: [],
  activeSeconds: 1200,
  isCompleted: false,
  ...overrides
});

const makeReadingHistory = (
  overrides: Partial<ReadingHistoryEntry> = {}
): ReadingHistoryEntry => ({
  id: 'history-1',
  userId: 'user-1',
  topic: 'pyspark',
  chapterId: 'module-01',
  chapterNumber: 1,
  chapterTitle: 'Module 1',
  lessonId: 'module-01-lesson-01',
  lessonOrder: 1,
  lessonTitle: 'Lesson 1',
  readAt: yesterdayIso,
  ...overrides
});

const makeMissionProgress = (
  overrides: Partial<UserMissionProgress> = {}
): UserMissionProgress => ({
  missionSlug: 'ghost-regulator',
  state: 'completed',
  unlocked: true,
  startedAt: twoDaysAgoIso,
  completedAt: nowIso,
  energyAwardedUnits: 1000,
  ...overrides
});

describe('buildWorkerCareerSnapshot', () => {
  it('builds an onboarding-friendly snapshot for users with no activity', () => {
    const snapshot = buildWorkerCareerSnapshot({
      topicProgress: [
        makeTopicProgress({ topic: 'pyspark', id: 'progress-1' }),
        makeTopicProgress({ topic: 'fabric', id: 'progress-2' })
      ],
      readingSessions: [],
      readingHistory: [],
      missionProgress: [],
      practiceHistory: [],
      streakDays: 0,
      totalEnergyUnits: 0,
      completedQuestionIds: []
    });

    expect(snapshot.currentRole).toBe('Trainee Operator');
    expect(snapshot.careerLevel).toBe(1);
    expect(snapshot.shiftLogEntries).toHaveLength(0);
    expect(snapshot.developmentTasks.length).toBeGreaterThan(0);
    expect(snapshot.developmentTasks.length).toBeLessThanOrEqual(3);
    expect(snapshot.activeDaysLast30).toBe(0);
    expect(snapshot.advancementProgress.kwhEarned).toBe(0);
    expect(snapshot.advancementProgress.tracksCompleted).toBe(0);
    expect(snapshot.advancementProgress.notebooksCompleted).toBe(0);
  });

  it('produces ladder, competency, and shift log data from mixed activity', () => {
    const snapshot = buildWorkerCareerSnapshot({
      topicProgress: [
        makeTopicProgress({
          id: 'progress-1',
          topic: 'pyspark',
          theoryChaptersCompleted: 9,
          theorySectionsRead: 46,
          practiceQuestionsAttempted: 42,
          practiceQuestionsCorrect: 31,
          firstActivityAt: twoDaysAgoIso,
          lastActivityAt: nowIso
        }),
        makeTopicProgress({
          id: 'progress-2',
          topic: 'fabric',
          theoryChaptersCompleted: 5,
          theorySectionsRead: 30,
          practiceQuestionsAttempted: 18,
          practiceQuestionsCorrect: 12,
          firstActivityAt: twoDaysAgoIso,
          lastActivityAt: yesterdayIso
        })
      ],
      readingSessions: [makeReadingSession()],
      readingHistory: [
        makeReadingHistory(),
        makeReadingHistory({
          id: 'history-2',
          topic: 'fabric',
          chapterId: 'module-02',
          chapterNumber: 2,
          lessonId: 'module-02-lesson-03',
          lessonOrder: 3,
          lessonTitle: 'Delta Fundamentals',
          readAt: nowIso
        })
      ],
      missionProgress: [makeMissionProgress(), makeMissionProgress({ missionSlug: 'load-shedding' })],
      practiceHistory: [],
      streakDays: 6,
      totalEnergyUnits: 6200,
      completedQuestionIds: ['q-1', 'q-2', 'q-3', 'nb-001', 'nb-002']
    });

    expect(snapshot.competencyScores).toHaveLength(4);
    expect(snapshot.ladderStages).toHaveLength(5);
    expect(snapshot.promotionCriteria).toHaveLength(5);
    expect(snapshot.shiftLogEntries.length).toBeGreaterThan(0);
    expect(snapshot.shiftLogEntries.some((entry) => entry.category === 'learning')).toBe(true);
    expect(snapshot.shiftLogEntries.some((entry) => entry.category === 'mission')).toBe(true);
    expect(snapshot.shiftLogEntries.some((entry) => entry.category === 'practice')).toBe(true);
    expect(snapshot.advancementProgress.kwhEarned).toBe(6.2);
    expect(snapshot.advancementProgress.flashcardsCompleted).toBeGreaterThan(50);
    expect(snapshot.advancementProgress.notebooksCompleted).toBe(2);
    expect(snapshot.promotionCriteria.map((criterion) => criterion.label)).toEqual(
      expect.arrayContaining([
        'Energy output (kWh)',
        'Track completion',
        'Flashcards completed',
        'Missions completed',
        'Notebook reviews'
      ])
    );
  });

  it('uses persisted notebook IDs from topic_progress stats for advancement gates', () => {
    const snapshot = buildWorkerCareerSnapshot({
      topicProgress: [
        makeTopicProgress({ topic: 'pyspark', id: 'progress-1' }),
        makeTopicProgress({ topic: 'fabric', id: 'progress-2' })
      ],
      readingSessions: [],
      readingHistory: [],
      missionProgress: [],
      practiceHistory: [],
      streakDays: 0,
      totalEnergyUnits: 0,
      completedQuestionIds: [],
      progressTopicStats: {
        notebooks: {
          completed_notebook_ids: ['nb-001', 'nb-002'],
          completed_notebooks_count: 2
        }
      }
    });

    expect(snapshot.advancementProgress.notebooksCompleted).toBe(2);
    expect(snapshot.promotionCriteria.find((criterion) => criterion.label === 'Notebook reviews'))
      .toBeDefined();
  });
});
