import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';
import { pysparkMidTheory } from '@/data/learn/theory/pyspark-mid';

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

const TOPIC_TRACK_CONFIGS: Record<string, TheoryTrackConfig[]> = {
  pyspark: [
    {
      slug: 'junior',
      label: 'Junior-Level Track',
      title: 'Junior-Level Track',
      eyebrow: 'Core Foundation',
      description:
        'Build PySpark capability from the ground up: distributed computing fundamentals, SparkSession, DataFrames, transformations, actions, reading and writing data, and production pipeline patterns.',
      highlights: [],
      sourceDoc: null as unknown as TheoryDoc, // placeholder, set below
    },
    {
      slug: 'mid',
      label: 'Mid-Level Track',
      title: 'Mid-Level Track',
      eyebrow: 'Advanced Systems',
      description:
        'Performance optimization, advanced join strategies, shuffle mechanics, execution plan analysis, and production-grade pipeline patterns for experienced PySpark engineers.',
      highlights: [],
      sourceDoc: pysparkMidTheory,
    }
  ]
};

const getTheoryTrackConfigs = (doc: TheoryDoc): TheoryTrackConfig[] => {
  const chapters = doc.modules ?? doc.chapters;

  const topicConfigs = TOPIC_TRACK_CONFIGS[doc.topic];
  if (topicConfigs) {
    return topicConfigs
      .map((cfg) => ({
        ...cfg,
        // If sourceDoc is not set (junior track), use the main doc
        sourceDoc: cfg.sourceDoc?.topic ? cfg.sourceDoc : doc,
      }))
      .filter((cfg) => {
        const chs = cfg.sourceDoc.modules ?? cfg.sourceDoc.chapters;
        return chs.length > 0;
      });
  }

  // Default: single track from the doc itself
  return [
    {
      slug: 'all',
      label: doc.title,
      eyebrow: 'Core Foundation',
      description: doc.description,
      highlights: [],
      sourceDoc: doc
    }
  ];
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
