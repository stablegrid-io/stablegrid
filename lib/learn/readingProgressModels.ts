import {
  getReadLessonCountFromSessionSnapshot,
  getReadLessonIdsFromSessionSnapshot
} from '@/lib/learn/readingSessionProgress';
import {
  getTheoryChapterMetadata,
  getTheoryLessonMetadata,
  getTheoryOrderedLessonIds
} from '@/lib/learn/theoryCatalog';
import {
  summarizeTheoryProgressFromSessions,
  type TheoryProgressSessionRow
} from '@/lib/learn/theoryProgress';
import type { ReadingHistoryEntry, ReadingSession, ReadingSessionMethod, Topic } from '@/types/progress';

const VALID_METHODS = new Set<ReadingSessionMethod>(['sprint', 'pomodoro', 'deep-focus', 'free-read']);

const toSessionMethod = (value: unknown): ReadingSessionMethod | null =>
  typeof value === 'string' && VALID_METHODS.has(value as ReadingSessionMethod)
    ? (value as ReadingSessionMethod)
    : null;

export interface ReadingSessionRowLike extends TheoryProgressSessionRow {
  id: string;
  user_id: string;
  topic: Topic;
  chapter_id: string;
  chapter_number: number;
  started_at: string;
  last_active_at: string;
  completed_at: string | null;
  sections_total: number;
  active_seconds: number;
  is_completed: boolean;
  sections_ids_read?: string[] | null;
  completed_lesson_ids?: string[] | null;
  lesson_seconds_by_id?: Record<string, unknown> | null;
  session_method?: string | null;
}

export interface ReadingHistoryRowLike {
  id: string;
  user_id: string;
  topic: Topic;
  chapter_id: string;
  chapter_number: number;
  lesson_id: string;
  lesson_order: number;
  read_at: string;
}

export interface TheoryProgressRowWithTopic extends TheoryProgressSessionRow {
  topic: Topic;
}

export const mapReadingSessionRow = (row: ReadingSessionRowLike): ReadingSession => {
  const orderedLessonIds = getTheoryOrderedLessonIds(row.topic, row.chapter_id);
  const sectionsTotal = Math.max(
    Number(row.sections_total ?? 0),
    orderedLessonIds.length
  );
  const sectionsIdsRead = row.is_completed
    ? orderedLessonIds.length > 0
      ? orderedLessonIds
      : getReadLessonIdsFromSessionSnapshot(row)
    : getReadLessonIdsFromSessionSnapshot(row, orderedLessonIds);
  const sectionsRead = row.is_completed
    ? sectionsTotal
    : getReadLessonCountFromSessionSnapshot(row, orderedLessonIds, sectionsTotal);

  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    chapterId: row.chapter_id,
    chapterNumber: row.chapter_number,
    startedAt: row.started_at,
    lastActiveAt: row.last_active_at,
    completedAt: row.completed_at,
    sectionsTotal,
    sectionsRead,
    sectionsIdsRead,
    activeSeconds: Number(row.active_seconds ?? 0),
    isCompleted: row.is_completed,
    sessionMethod: toSessionMethod(row.session_method)
  };
};

export const mapReadingHistoryRow = (row: ReadingHistoryRowLike): ReadingHistoryEntry => {
  const chapterMetadata = getTheoryChapterMetadata(row.topic, row.chapter_id);
  const lessonMetadata = getTheoryLessonMetadata(row.topic, row.chapter_id, row.lesson_id);

  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    chapterId: row.chapter_id,
    chapterNumber: chapterMetadata?.number ?? row.chapter_number,
    chapterTitle: chapterMetadata?.title ?? `Chapter ${row.chapter_number}`,
    lessonId: row.lesson_id,
    lessonOrder: lessonMetadata?.order ?? Math.max(1, row.lesson_order),
    lessonTitle:
      lessonMetadata?.title ?? `Lesson ${Math.max(1, row.lesson_order)}`,
    readAt: row.read_at
  };
};

export const buildTheorySummaryByTopic = (rows: TheoryProgressRowWithTopic[]) => {
  const rowsByTopic = new Map<Topic, TheoryProgressSessionRow[]>();

  rows.forEach((row) => {
    const topicRows = rowsByTopic.get(row.topic) ?? [];
    topicRows.push(row);
    rowsByTopic.set(row.topic, topicRows);
  });

  return new Map(
    Array.from(rowsByTopic.entries()).map(([topic, topicRows]) => [
      topic,
      summarizeTheoryProgressFromSessions(topic, topicRows)
    ])
  );
};
