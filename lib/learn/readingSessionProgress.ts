import { MIN_LESSON_READ_SECONDS } from '@/lib/learn/lessonReadProgress';

interface ReadingSessionProgressSnapshot {
  sections_read?: number | null;
  sections_ids_read?: string[] | null;
  completed_lesson_ids?: string[] | null;
  lesson_seconds_by_id?: Record<string, unknown> | null;
}

const dedupeLessonIds = (lessonIds: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  return lessonIds.filter((lessonId): lessonId is string => {
    if (typeof lessonId !== 'string' || lessonId.trim().length === 0 || seen.has(lessonId)) {
      return false;
    }
    seen.add(lessonId);
    return true;
  });
};

const getTimedLessonIds = (
  lessonSecondsById: Record<string, unknown> | null | undefined
) => {
  if (!lessonSecondsById || typeof lessonSecondsById !== 'object') {
    return [];
  }

  return dedupeLessonIds(
    Object.entries(lessonSecondsById).flatMap(([lessonId, rawValue]) => {
      const numericValue =
        typeof rawValue === 'number'
          ? rawValue
          : typeof rawValue === 'string'
            ? Number(rawValue)
            : Number.NaN;

      return Number.isFinite(numericValue) && numericValue >= MIN_LESSON_READ_SECONDS
        ? [lessonId]
        : [];
    })
  );
};

export const getReadLessonIdsFromSessionSnapshot = (
  snapshot: ReadingSessionProgressSnapshot,
  orderedLessonIds: string[] = []
) => {
  const timedLessonIds = getTimedLessonIds(snapshot.lesson_seconds_by_id);
  const fallbackLessonIds = dedupeLessonIds([
    ...(snapshot.completed_lesson_ids ?? []),
    ...(snapshot.sections_ids_read ?? [])
  ]);

  if (orderedLessonIds.length > 0) {
    const knownLessonIds = new Set(orderedLessonIds);
    const sourceLessonIds = timedLessonIds.length > 0 ? timedLessonIds : fallbackLessonIds;
    const sourceSet = new Set(sourceLessonIds.filter((lessonId) => knownLessonIds.has(lessonId)));
    return orderedLessonIds.filter((lessonId) => sourceSet.has(lessonId));
  }

  return timedLessonIds.length > 0 ? timedLessonIds : fallbackLessonIds;
};

export const getReadLessonCountFromSessionSnapshot = (
  snapshot: ReadingSessionProgressSnapshot,
  orderedLessonIds: string[] = [],
  sectionsTotal?: number | null
) => {
  const readLessonIds = getReadLessonIdsFromSessionSnapshot(snapshot, orderedLessonIds);
  if (readLessonIds.length > 0) {
    const maxCount =
      typeof sectionsTotal === 'number' && Number.isFinite(sectionsTotal)
        ? Math.max(0, Math.round(sectionsTotal))
        : readLessonIds.length;
    return Math.max(0, Math.min(maxCount, readLessonIds.length));
  }

  const numericSectionsRead = Number(snapshot.sections_read ?? 0);
  if (!Number.isFinite(numericSectionsRead)) {
    return 0;
  }

  const fallbackCount = Math.max(0, Math.round(numericSectionsRead));
  if (typeof sectionsTotal === 'number' && Number.isFinite(sectionsTotal)) {
    return Math.min(Math.max(0, Math.round(sectionsTotal)), fallbackCount);
  }

  return fallbackCount;
};
