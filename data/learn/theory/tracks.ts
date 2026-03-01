import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';

export interface TheoryTrackSummary {
  slug: string;
  label: string;
  eyebrow: string;
  description: string;
  highlights: string[];
  chapters: TheoryChapter[];
  chapterCount: number;
  totalMinutes: number;
}

const buildTrack = (
  doc: TheoryDoc,
  {
    slug,
    label,
    eyebrow,
    description,
    highlights
  }: Omit<TheoryTrackSummary, 'chapters' | 'chapterCount' | 'totalMinutes'>
): TheoryTrackSummary => {
  const chapters = sortModulesByOrder(doc.modules ?? doc.chapters);

  return {
    slug,
    label,
    eyebrow,
    description,
    highlights,
    chapters,
    chapterCount: chapters.length,
    totalMinutes: chapters.reduce((sum, chapter) => sum + chapter.totalMinutes, 0)
  };
};

export const getTheoryTracks = (doc: TheoryDoc): TheoryTrackSummary[] => {
  if (doc.topic !== 'pyspark') {
    return [];
  }

  return [
    buildTrack(doc, {
      slug: 'full-stack',
      label: 'PySpark: The Full Stack',
      eyebrow: 'Track 01',
      description:
        'A single guided route through all 20 modules, from why Spark exists to optimization, lakehouse design, streaming, governance, and career readiness.',
      highlights: [
        'Foundations, internals, and distributed execution',
        'Delta, modeling, quality, and performance engineering',
        'Streaming, platform design, governance, and interview depth'
      ]
    })
  ];
};

export const getTheoryTrackBySlug = (
  doc: TheoryDoc,
  slug: string
): TheoryTrackSummary | null =>
  getTheoryTracks(doc).find((track) => track.slug === slug) ?? null;
