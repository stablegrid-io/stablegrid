import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';

export interface TheoryTrackSummary {
  slug: string;
  label: string;
  title?: string;
  subtitle?: string;
  eyebrow: string;
  description: string;
  highlights: string[];
  chapters: TheoryChapter[];
  chapterCount: number;
  totalMinutes: number;
}

const buildTrack = (
  sourceDoc: TheoryDoc,
  {
    slug,
    label,
    title,
    subtitle,
    eyebrow,
    description,
    highlights
  }: Omit<TheoryTrackSummary, 'chapters' | 'chapterCount' | 'totalMinutes'>
): TheoryTrackSummary => {
  const chapters = sortModulesByOrder(sourceDoc.modules ?? sourceDoc.chapters);

  return {
    slug,
    label,
    ...(title && { title }),
    ...(subtitle && { subtitle }),
    eyebrow,
    description,
    highlights,
    chapters,
    chapterCount: chapters.length,
    totalMinutes: chapters.reduce((sum, chapter) => sum + chapter.totalMinutes, 0)
  };
};

interface TheoryTrackConfig {
  slug: string;
  label: string;
  title?: string;
  subtitle?: string;
  eyebrow: string;
  description: string;
  highlights: string[];
  sourceDoc: TheoryDoc;
}

const getTheoryTrackConfigs = (_doc: TheoryDoc): TheoryTrackConfig[] => {
  return [];
};

export const getTheoryTracks = (doc: TheoryDoc): TheoryTrackSummary[] => {
  return getTheoryTrackConfigs(doc).map((config) =>
    buildTrack(config.sourceDoc, {
      slug: config.slug,
      label: config.label,
      ...(config.title && { title: config.title }),
      ...(config.subtitle && { subtitle: config.subtitle }),
      eyebrow: config.eyebrow,
      description: config.description,
      highlights: config.highlights
    })
  );
};

export const getTheoryTrackBySlug = (
  doc: TheoryDoc,
  slug: string
): TheoryTrackSummary | null =>
  getTheoryTracks(doc).find((track) => track.slug === slug) ?? null;

export const getTheoryTrackDocBySlug = (
  doc: TheoryDoc,
  slug: string
): TheoryDoc | null =>
  getTheoryTrackConfigs(doc).find((track) => track.slug === slug)?.sourceDoc ?? null;
