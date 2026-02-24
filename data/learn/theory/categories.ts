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

const CATEGORY_CONFIG: Record<TheoryCategorySlug, CategoryConfig> = {
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
  'module-05': 'advanced',
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
      'skew',
      'aqe',
      'playbook'
    ])
  ) {
    return 'optimization';
  }

  if (
    includesAny(haystack, ['format', 'delta', 'storage', 'partition', 'modeling'])
  ) {
    return 'data';
  }

  if (includesAny(haystack, ['stream', 'udf', 'advanced', 'production'])) {
    return 'advanced';
  }

  return 'fundamentals';
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
    const meta = CATEGORY_CONFIG[slug];
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

export const getTheoryCategoryMeta = (slug: TheoryCategorySlug | 'all') => {
  if (slug === 'all') {
    return {
      slug,
      label: 'All Modules',
      description: 'Browse the complete module list for this topic.'
    };
  }

  const config = CATEGORY_CONFIG[slug];
  return {
    slug,
    label: config.label,
    description: config.description
  };
};
