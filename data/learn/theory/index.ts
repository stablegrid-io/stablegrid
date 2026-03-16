import type { FrozenTheoryDoc } from '@/types/theory';
import { fabricTheory } from '@/data/learn/theory/fabric';
import { pysparkTheory } from '@/data/learn/theory/pyspark';
import { freezeTheoryDoc } from '@/lib/learn/freezeTheoryDoc';

const rawTheoryDocs = {
  pyspark: pysparkTheory,
  fabric: fabricTheory
};

export const theoryDocs: Record<string, FrozenTheoryDoc> = Object.entries(
  rawTheoryDocs
).reduce<Record<string, FrozenTheoryDoc>>((accumulator, [topic, doc]) => {
  accumulator[topic] = freezeTheoryDoc(doc);
  return accumulator;
}, {});

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
