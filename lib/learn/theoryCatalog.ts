import { theoryDocs } from '@/data/learn/theory';
import {
  getDisplayLessonTitle,
  sortLessonsByOrder,
  sortModulesByOrder
} from '@/lib/learn/freezeTheoryDoc';

interface TheoryLessonCatalogEntry {
  id: string;
  order: number;
  title: string;
}

interface TheoryChapterCatalogEntry {
  id: string;
  number: number;
  title: string;
  lessons: TheoryLessonCatalogEntry[];
}

interface TheoryCatalog {
  chapters: TheoryChapterCatalogEntry[];
}

const theoryCatalogCache = new Map<string, TheoryCatalog>();

const buildTheoryCatalog = (topic: string): TheoryCatalog => {
  const doc = theoryDocs[topic];
  if (!doc) {
    return { chapters: [] };
  }

  return {
    chapters: sortModulesByOrder(doc.modules ?? doc.chapters).map((chapter) => {
      const lessons = sortLessonsByOrder(chapter.sections).map((lesson, index) => {
        const lessonOrder = lesson.order ?? index + 1;
        return {
          id: lesson.id,
          order: lessonOrder,
          title: getDisplayLessonTitle(lesson, lessonOrder)
        };
      });

      return {
        id: chapter.id,
        number: chapter.order ?? chapter.number,
        title: chapter.title,
        lessons
      };
    })
  };
};

const getTheoryCatalog = (topic: string) => {
  const cached = theoryCatalogCache.get(topic);
  if (cached) {
    return cached;
  }

  const nextCatalog = buildTheoryCatalog(topic);
  theoryCatalogCache.set(topic, nextCatalog);
  return nextCatalog;
};

export const getTheoryChapterMetadata = (topic: string, chapterId: string) =>
  getTheoryCatalog(topic).chapters.find((chapter) => chapter.id === chapterId) ?? null;

export const getTheoryOrderedLessonIds = (topic: string, chapterId: string) =>
  getTheoryChapterMetadata(topic, chapterId)?.lessons.map((lesson) => lesson.id) ?? [];

export const getTheoryLessonMetadata = (
  topic: string,
  chapterId: string,
  lessonId: string
) =>
  getTheoryChapterMetadata(topic, chapterId)?.lessons.find((lesson) => lesson.id === lessonId) ??
  null;
