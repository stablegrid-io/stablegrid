import type { CheatSheet } from '@/types/learn';
import { pysparkData } from '@/data/learn/pyspark';

// Pre-computed theory meta to avoid importing 6.2 MB of theory JSON into client bundles.
// Update these when theory content changes significantly.
// Combined chapter counts across all tracks (Junior + Mid + Senior)
const THEORY_META: Record<string, { chapterCount: number; totalMinutes: number; version: string }> = {
  pyspark: { chapterCount: 30, totalMinutes: 10265, version: '1.0' },
};

const getTheoryMeta = (topic: string) => THEORY_META[topic] ?? null;

export const cheatSheets: Record<string, CheatSheet> = {
  pyspark: pysparkData,
};

export const learnTopics = Object.values(cheatSheets)
  .map((sheet) => {
    const theory = getTheoryMeta(sheet.topic);
    return {
      id: sheet.topic,
      title: sheet.title.replace(' Reference', ''),
      description: sheet.description,
      functionCount: sheet.functions.length,
      chapterCount: theory?.chapterCount ?? 0
    };
  })
;

export const getLearnTopicMeta = (topic: string) => {
  const sheet = cheatSheets[topic];
  if (!sheet) {
    return null;
  }

  const theory = getTheoryMeta(topic);
  return {
    topic,
    title: sheet.title.replace(' Reference', ''),
    description: sheet.description,
    version: theory?.version ?? sheet.version,
    functionCount: sheet.functions.length,
    chapterCount: theory?.chapterCount ?? 0,
    chapterMinutes: theory?.totalMinutes ?? 0
  };
};
