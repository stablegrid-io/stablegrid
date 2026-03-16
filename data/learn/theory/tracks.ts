import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';
import { pysparkDataEngineeringTrackTheory } from '@/data/learn/theory/pysparkDataEngineeringTrack';
import { fabricDataEngineeringTrack } from '@/data/learn/theory/fabric-data-engineering-track';
import { fabricBusinessIntelligenceTrack } from '@/data/learn/theory/fabric-business-intelligence-track';

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
  sourceDoc: TheoryDoc,
  {
    slug,
    label,
    eyebrow,
    description,
    highlights
  }: Omit<TheoryTrackSummary, 'chapters' | 'chapterCount' | 'totalMinutes'>
): TheoryTrackSummary => {
  const chapters = sortModulesByOrder(sourceDoc.modules ?? sourceDoc.chapters);

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

interface TheoryTrackConfig {
  slug: string;
  label: string;
  eyebrow: string;
  description: string;
  highlights: string[];
  sourceDoc: TheoryDoc;
}

const getTheoryTrackConfigs = (doc: TheoryDoc): TheoryTrackConfig[] => {
  switch (doc.topic) {
    case 'pyspark':
      return [
        {
          slug: 'full-stack',
          label: 'PySpark: The Full Stack',
          eyebrow: 'Track 01',
          description:
            'A single guided route through all 20 modules, from why Spark exists to optimization, lakehouse design, streaming, governance, and career readiness.',
          highlights: [
            'Foundations, internals, and distributed execution',
            'Delta, modeling, quality, and performance engineering',
            'Streaming, platform design, governance, and interview depth'
          ],
          sourceDoc: doc
        },
        {
          slug: 'data-engineering-track',
          label: 'PySpark: Data Engineering Track',
          eyebrow: 'Track 02',
          description:
            'A focused data engineering route: platform foundations, OneLake, lakehouse workflows, orchestration, Spark, and capstone delivery.',
          highlights: [
            'Platform and OneLake fundamentals first (F1 + F2)',
            'Core data engineering modules from DE1 through DE8',
            'Applied production patterns across pipeline, SQL, and medallion layers'
          ],
          sourceDoc: pysparkDataEngineeringTrackTheory
        }
      ];
    case 'fabric':
      return [
        {
          slug: 'full-stack',
          label: 'Fabric: End-to-End Platform',
          eyebrow: 'Track 01',
          description:
            'A single guided route through all 20 modules, from platform foundations and OneLake to Spark, SQL, realtime intelligence, BI, governance, and capstone delivery.',
          highlights: [
            'Platform architecture, OneLake, and core workloads',
            'Data movement, Spark engineering, warehousing, and SQL analytics',
            'Realtime intelligence, BI, governance, operations, and capstone'
          ],
          sourceDoc: doc
        },
        {
          slug: 'data-engineering-track',
          label: 'Fabric: Data Engineering Track',
          eyebrow: 'Track 02',
          description:
            'A focused data engineering route: platform foundations, OneLake, lakehouse workflows, data warehousing, T-SQL analytics, and ETL pipelines.',
          highlights: [
            'Platform and OneLake fundamentals (F1 + F2)',
            'Lakehouse architecture, warehousing, and SQL analytics (DW1-DW4)',
            'Medallion architecture, T-SQL, and pipeline orchestration (DW5-DW6)'
          ],
          sourceDoc: fabricDataEngineeringTrack
        },
        {
          slug: 'business-intelligence-track',
          label: 'Fabric: Business Intelligence Track',
          eyebrow: 'Track 03',
          description:
            'A specialized BI route: lakehouse foundations, semantic modeling, DAX analytics, report design, app distribution, governance, and capstone delivery.',
          highlights: [
            'Lakehouse, warehouse fundamentals, and BI foundations (BI1)',
            'Semantic models, DirectLake, DAX language, and analytics (BI2-BI3)',
            'Reports, dashboards, distribution, governance, and capstone project (BI4-BI7)'
          ],
          sourceDoc: fabricBusinessIntelligenceTrack
        }
      ];
    default:
      return [];
  }
};

export const getTheoryTracks = (doc: TheoryDoc): TheoryTrackSummary[] => {
  return getTheoryTrackConfigs(doc).map((config) =>
    buildTrack(config.sourceDoc, {
      slug: config.slug,
      label: config.label,
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
