import type { ServerTheoryChapterProgressSnapshot } from '@/lib/learn/serverTheoryProgress';

interface TrackProgressChapter {
  id: string;
  sections: Array<unknown>;
}

export const clampLessonProgress = (
  snapshot: ServerTheoryChapterProgressSnapshot | undefined,
  totalLessons: number,
  isCompleted: boolean
) => {
  if (isCompleted) {
    return totalLessons;
  }

  const lessonsRead = Number(snapshot?.sectionsRead ?? 0);
  if (!Number.isFinite(lessonsRead)) {
    return 0;
  }

  return Math.max(0, Math.min(totalLessons, Math.round(lessonsRead)));
};

export const summarizeTrackLessonProgress = ({
  chapters,
  completedChapterIds,
  chapterProgressById = {}
}: {
  chapters: TrackProgressChapter[];
  completedChapterIds: string[];
  chapterProgressById?: Record<string, ServerTheoryChapterProgressSnapshot>;
}) => {
  const completedSet = new Set(completedChapterIds);
  const totalLessons = chapters.reduce((sum, chapter) => sum + chapter.sections.length, 0);
  const completedLessons = chapters.reduce(
    (sum, chapter) =>
      sum +
      clampLessonProgress(
        chapterProgressById[chapter.id],
        chapter.sections.length,
        completedSet.has(chapter.id)
      ),
    0
  );
  const completedModules = chapters.filter((chapter) => completedSet.has(chapter.id)).length;

  return {
    totalLessons,
    completedLessons,
    completedModules,
    progressPct: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  };
};
