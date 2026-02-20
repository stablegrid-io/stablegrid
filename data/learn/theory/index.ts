import type { TheoryDoc } from '@/types/theory';
import { fabricTheory } from '@/data/learn/theory/fabric';
import { pysparkTheory } from '@/data/learn/theory/pyspark';

export const theoryDocs: Record<string, TheoryDoc> = {
  pyspark: pysparkTheory,
  fabric: fabricTheory
};

export const getTheoryMeta = (topic: string) => {
  const doc = theoryDocs[topic];
  if (!doc) return null;
  const chapterCount = doc.chapters.length;
  const totalMinutes = doc.chapters.reduce(
    (sum, chapter) => sum + chapter.totalMinutes,
    0
  );
  return { chapterCount, totalMinutes, version: doc.version };
};
