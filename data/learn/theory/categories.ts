import type { TheoryChapter, TheoryDoc } from '@/types/theory';

export type TheoryCategorySlug =
  | 'fundamentals'
  | 'history'
  | 'architecture'
  | 'optimization'
  | 'data'
  | 'advanced';

export interface TheoryCategorySummary {
  slug: TheoryCategorySlug;
  label: string;
  description: string;
  chapterCount: number;
  totalMinutes: number;
  chapters: TheoryChapter[];
}

interface CategoryConfig {
  label: string;
  description: string;
}

const DEFAULT_CATEGORY_CONFIG: Record<TheoryCategorySlug, CategoryConfig> = {
  fundamentals: {
    label: 'Fundamentals',
    description: 'Core concepts, mental models, and foundational theory.'
  },
  history: {
    label: 'History',
    description: 'Why the technology exists and how it evolved.'
  },
  architecture: {
    label: 'Architecture',
    description: 'Execution model, components, and system internals.'
  },
  optimization: {
    label: 'Optimization',
    description: 'Performance tuning, bottlenecks, and scaling playbooks.'
  },
  data: {
    label: 'Data',
    description: 'Storage formats, partitioning, and data lifecycle decisions.'
  },
  advanced: {
    label: 'Advanced',
    description: 'Production patterns and specialized topics.'
  }
};

const PYSPARK_CATEGORY_CONFIG: Partial<Record<TheoryCategorySlug, CategoryConfig>> = {
  history: {
    label: 'Crash Course of PySpark',
    description:
      'Start with the big-data shift, why Spark exists, and the mental model for the full course.'
  },
  fundamentals: {
    label: 'Core Workflows',
    description:
      'Build fluency with SparkSession, DataFrames, Spark SQL, and the everyday PySpark workflow.'
  },
  architecture: {
    label: 'Engine Room',
    description:
      'Step inside Catalyst, DAG scheduling, and Tungsten to see how distributed work actually executes.'
  },
  optimization: {
    label: 'Performance Lab',
    description:
      'Tune joins, window functions, AQE, skew, and diagnostic workflows for production-scale performance.'
  },
  data: {
    label: 'Lakehouse Builder',
    description:
      'Shape raw data into reliable lakehouse assets with cleaning patterns, complex types, Delta, and modeling.'
  },
  advanced: {
    label: 'Production & Career Track',
    description:
      'Cover streaming, testing, deployment, governance, capstones, and interview-ready engineering depth.'
  }
};

const CATEGORY_ORDER: TheoryCategorySlug[] = [
  'fundamentals',
  'history',
  'architecture',
  'optimization',
  'data',
  'advanced'
];

const PYSPARK_OVERRIDES: Record<string, TheoryCategorySlug> = {
  'module-01': 'history',
  'module-02': 'fundamentals',
  'module-03': 'architecture',
  'module-04': 'optimization',
  'module-05': 'optimization',
  'module-06': 'fundamentals',
  'module-07': 'data',
  'module-08': 'data',
  'module-09': 'advanced',
  'module-10': 'advanced',
  'module-11': 'data',
  'module-12': 'advanced',
  'module-13': 'advanced',
  'module-14': 'advanced',
  'module-15': 'optimization',
  'module-16': 'optimization',
  'module-17': 'data',
  'module-18': 'fundamentals',
  'module-19': 'advanced',
  'module-20': 'advanced',
  'what-is-spark': 'history',
  architecture: 'architecture',
  'execution-model': 'architecture',
  shuffles: 'optimization',
  memory: 'optimization',
  joins: 'optimization',
  'data-skew': 'optimization',
  aqe: 'optimization',
  'optimization-playbook': 'optimization',
  'data-formats': 'data',
  'delta-lake': 'data',
  udfs: 'optimization',
  streaming: 'advanced'
};

const includesAny = (value: string, needles: string[]) =>
  needles.some((needle) => value.includes(needle));

const getCategoryConfig = (
  topic: string,
  slug: TheoryCategorySlug
): CategoryConfig => {
  if (topic === 'pyspark' && PYSPARK_CATEGORY_CONFIG[slug]) {
    return PYSPARK_CATEGORY_CONFIG[slug] as CategoryConfig;
  }

  return DEFAULT_CATEGORY_CONFIG[slug] ?? { label: slug, description: '' };
};

const inferCategory = (doc: TheoryDoc, chapter: TheoryChapter): TheoryCategorySlug => {
  if (doc.topic === 'pyspark' && PYSPARK_OVERRIDES[chapter.id]) {
    return PYSPARK_OVERRIDES[chapter.id];
  }

  const haystack = `${chapter.id} ${chapter.title}`.toLowerCase();

  if (
    includesAny(haystack, ['history', 'origin', 'evolution', 'what-is', 'what is'])
  ) {
    return 'history';
  }

  if (
    includesAny(haystack, ['architecture', 'driver', 'executor', 'dag', 'execution'])
  ) {
    return 'architecture';
  }

  if (
    includesAny(haystack, [
      'optimiz',
      'performance',
      'shuffle',
      'memory',
      'join',
      'window',
      'skew',
      'aqe',
      'playbook'
    ])
  ) {
    return 'optimization';
  }

  if (
    includesAny(haystack, [
      'format',
      'delta',
      'storage',
      'partition',
      'modeling',
      'clean',
      'json',
      'struct',
      'array',
      'lakehouse'
    ])
  ) {
    return 'data';
  }

  if (
    includesAny(haystack, [
      'stream',
      'udf',
      'advanced',
      'production',
      'testing',
      'observability',
      'security',
      'governance',
      'access',
      'capstone',
      'career',
      'interview'
    ])
  ) {
    return 'advanced';
  }

  return 'fundamentals';
};

export const getTheoryCategoryForChapter = (
  doc: TheoryDoc,
  chapter: TheoryChapter
) => {
  const slug = inferCategory(doc, chapter);
  const meta = getCategoryConfig(doc.topic, slug);

  return {
    slug,
    label: meta.label,
    description: meta.description
  };
};

export const getTheoryCategories = (doc: TheoryDoc): TheoryCategorySummary[] => {
  const grouped = new Map<TheoryCategorySlug, TheoryChapter[]>();

  doc.chapters.forEach((chapter) => {
    const slug = inferCategory(doc, chapter);
    const bucket = grouped.get(slug) ?? [];
    bucket.push(chapter);
    grouped.set(slug, bucket);
  });

  const categoryRows = CATEGORY_ORDER.map((slug) => {
    const chapters = grouped.get(slug) ?? [];
    const meta = getCategoryConfig(doc.topic, slug);
    return {
      slug,
      label: meta.label,
      description: meta.description,
      chapterCount: chapters.length,
      totalMinutes: chapters.reduce((sum, chapter) => sum + chapter.totalMinutes, 0),
      chapters
    };
  }).filter((category) => category.chapterCount > 0);

  // Keep display order aligned with module progression (M1 -> M2 -> ...).
  return categoryRows.sort((left, right) => {
    const leftMin = Math.min(...left.chapters.map((chapter) => chapter.number));
    const rightMin = Math.min(...right.chapters.map((chapter) => chapter.number));
    return leftMin - rightMin;
  });
};

export const filterTheoryDocByCategory = (
  doc: TheoryDoc,
  category: TheoryCategorySlug | 'all'
): TheoryDoc => {
  if (category === 'all') {
    return doc;
  }

  const categories = getTheoryCategories(doc);
  const selected = categories.find((item) => item.slug === category);
  if (!selected) {
    return {
      ...doc,
      chapters: []
    };
  }

  return {
    ...doc,
    chapters: selected.chapters
  };
};

export const getChapterCategorySlug = (
  doc: TheoryDoc,
  chapterId: string
): TheoryCategorySlug | null => {
  const chapter = doc.chapters.find((c) => c.id === chapterId);
  if (!chapter) return null;
  return inferCategory(doc, chapter);
};

export const getTheoryCategoryMeta = (
  slug: TheoryCategorySlug | 'all',
  topic?: string
) => {
  if (slug === 'all') {
    return {
      slug,
      label: 'All Modules',
      description: 'Browse the complete module list for this topic.'
    };
  }

  const config = getCategoryConfig(topic ?? '', slug);
  return {
    slug,
    label: config.label,
    description: config.description
  };
};
