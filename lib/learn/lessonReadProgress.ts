export const MIN_LESSON_READ_SECONDS = 30;

export type LessonSecondsById = Record<string, number>;

export const sanitizeLessonSecondsById = (
  value: unknown,
  orderedLessonIds: string[],
  lessonIdSet: Set<string>
): LessonSecondsById => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const source = value as Record<string, unknown>;
  return orderedLessonIds.reduce<LessonSecondsById>((accumulator, lessonId) => {
    if (!lessonIdSet.has(lessonId)) {
      return accumulator;
    }

    const rawValue = source[lessonId];
    const numericValue =
      typeof rawValue === 'number'
        ? rawValue
        : typeof rawValue === 'string'
          ? Number(rawValue)
          : Number.NaN;

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return accumulator;
    }

    accumulator[lessonId] = Math.floor(numericValue);
    return accumulator;
  }, {});
};

export const seedLessonSecondsFromCompletedLessons = (
  lessonSecondsById: LessonSecondsById,
  completedLessonIds: string[]
) => {
  const nextLessonSecondsById = { ...lessonSecondsById };

  completedLessonIds.forEach((lessonId) => {
    if ((nextLessonSecondsById[lessonId] ?? 0) < MIN_LESSON_READ_SECONDS) {
      nextLessonSecondsById[lessonId] = MIN_LESSON_READ_SECONDS;
    }
  });

  return nextLessonSecondsById;
};

export const getReadLessonIds = (
  lessonSecondsById: LessonSecondsById,
  orderedLessonIds: string[]
) =>
  orderedLessonIds.filter(
    (lessonId) => (lessonSecondsById[lessonId] ?? 0) >= MIN_LESSON_READ_SECONDS
  );
