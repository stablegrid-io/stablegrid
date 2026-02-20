import type { CheatSheet } from '@/types/learn';
import { fabricData } from '@/data/learn/fabric';
import { pysparkData } from '@/data/learn/pyspark';
import { getTheoryMeta } from '@/data/learn/theory';

export const cheatSheets: Record<string, CheatSheet> = {
  pyspark: pysparkData,
  fabric: fabricData
};

export const learnTopics = Object.values(cheatSheets).map((sheet) => {
  const theory = getTheoryMeta(sheet.topic);
  return {
    id: sheet.topic,
    title: sheet.title.replace(' Reference', ''),
    description: sheet.description,
    functionCount: sheet.functions.length,
    chapterCount: theory?.chapterCount ?? 0
  };
});

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
