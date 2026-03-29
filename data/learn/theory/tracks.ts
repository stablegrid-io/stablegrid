import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';
import { pysparkMidTheory } from '@/data/learn/theory/pyspark-mid';
import { pysparkSeniorTheory } from '@/data/learn/theory/pyspark-senior';
import { fabricMidTheory } from '@/data/learn/theory/fabric-mid';
import { fabricSeniorTheory } from '@/data/learn/theory/fabric-senior';
import { airflowTheory } from '@/data/learn/theory/airflow';
import { airflowMidTheory } from '@/data/learn/theory/airflow-mid';
import { airflowSeniorTheory } from '@/data/learn/theory/airflow-senior';
import { sqlTheory } from '@/data/learn/theory/sql';
import { sqlMidTheory } from '@/data/learn/theory/sql-mid';
import { sqlSeniorTheory } from '@/data/learn/theory/sql-senior';
import { python_deTheory } from '@/data/learn/theory/python-de';

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
    },
    {
      slug: 'senior',
      label: 'Senior-Level Track',
      title: 'Senior-Level Track',
      eyebrow: 'Platform Architecture',
      description:
        'Platform architecture, advanced optimizer internals, enterprise governance, and the organizational patterns that make PySpark reliable at scale across multiple teams and countries.',
      highlights: [],
      sourceDoc: pysparkSeniorTheory,
    }
  ],
  fabric: [
    {
      slug: 'junior',
      label: 'Junior-Level Track',
      title: 'Junior-Level Track',
      eyebrow: 'Core Foundation',
      description:
        'Build Fabric capability from the ground up: the unified analytics platform, OneLake, Lakehouses, Spark notebooks, Data Factory pipelines, and production pipeline patterns.',
      highlights: [],
      sourceDoc: null as unknown as TheoryDoc,
    },
    {
      slug: 'mid',
      label: 'Mid-Level Track',
      title: 'Mid-Level Track',
      eyebrow: 'Advanced Systems',
      description:
        'Performance optimization, Delta Lake operations, advanced pipeline patterns, and production-grade Fabric practices for experienced data engineers.',
      highlights: [],
      sourceDoc: fabricMidTheory,
    },
    {
      slug: 'senior',
      label: 'Senior-Level Track',
      title: 'Senior-Level Track',
      eyebrow: 'Platform Engineering',
      description:
        'Multi-tenant platform architecture, advanced streaming patterns, enterprise governance, custom Spark optimization, and the transition from pipeline builder to platform designer.',
      highlights: [],
      sourceDoc: fabricSeniorTheory,
    }
  ],
  airflow: [
    {
      slug: 'junior',
      label: 'Junior-Level Track',
      title: 'Junior-Level Track',
      eyebrow: 'Core Foundation',
      description:
        'Build Airflow capability from the ground up: workflow orchestration fundamentals, DAG authoring, scheduling, sensors, configuration, monitoring, and production pipeline patterns.',
      highlights: [],
      sourceDoc: airflowTheory,
    },
    {
      slug: 'mid',
      label: 'Mid-Level Track',
      title: 'Mid-Level Track',
      eyebrow: 'Advanced Systems',
      description:
        'Data-aware scheduling, custom operators, advanced testing patterns, performance tuning, and production-grade Airflow practices for experienced data engineers.',
      highlights: [],
      sourceDoc: airflowMidTheory,
    },
    {
      slug: 'senior',
      label: 'Senior-Level Track',
      title: 'Senior-Level Track',
      eyebrow: 'Platform Engineering',
      description:
        'Multi-cluster architecture, custom executors, enterprise security, advanced plugin development, and the transition from DAG author to platform architect.',
      highlights: [],
      sourceDoc: airflowSeniorTheory,
    }
  ],
  sql: [
    {
      slug: 'junior',
      label: 'Junior-Level Track',
      title: 'Junior-Level Track',
      eyebrow: 'Core Foundation',
      description:
        'Build SQL capability from the ground up: relational databases, queries, joins, aggregations, subqueries, window functions, DDL, and production-ready data engineering patterns.',
      highlights: [],
      sourceDoc: sqlTheory,
    },
    {
      slug: 'mid',
      label: 'Mid-Level Track',
      title: 'Mid-Level Track',
      eyebrow: 'Advanced Systems',
      description:
        'Query optimization, advanced join patterns, analytical SQL, data modeling for pipelines, testing, CI/CD deployment, performance tuning, and data quality frameworks.',
      highlights: [],
      sourceDoc: sqlMidTheory,
    },
    {
      slug: 'senior',
      label: 'Senior-Level Track',
      title: 'Senior-Level Track',
      eyebrow: 'Platform Architecture',
      description:
        'Platform architecture at scale, optimizer internals, partition strategies, schema registries, SQL engine internals, storage I/O, multi-tenant security, streaming CDC, and enterprise governance.',
      highlights: [],
      sourceDoc: sqlSeniorTheory,
    }
  ],
  'python-de': [
    {
      slug: 'junior',
      label: 'Junior-Level Track',
      title: 'Junior-Level Track',
      eyebrow: 'Core Foundation',
      description:
        'Build Python capability from the ground up: data structures, functions, file I/O, error handling, data validation, APIs, and testing for production data pipelines.',
      highlights: [],
      sourceDoc: python_deTheory,
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
