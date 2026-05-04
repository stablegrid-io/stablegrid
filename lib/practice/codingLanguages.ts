import { Star, Code2, Database } from 'lucide-react';
import type { Topic } from '@/components/practice/PracticeTopicSelectorPage';

/**
 * Language picker shown at /practice/coding. Each tile drills down to
 * /practice/coding/[language] which renders the topic gallery scoped to
 * that language.
 *
 * The same `Topic` shape powers PracticeTopicSelectorPage so the cards
 * inherit the existing visual language (icon + accent + category pill +
 * CTA pill) without bespoke styling.
 */
export type CodingLanguageId = 'pyspark' | 'python' | 'sql';

export const CODING_LANGUAGES: Topic[] = [
  {
    id: 'pyspark',
    title: 'PySpark',
    description:
      'Industrial-scale Spark — joins, aggregations, memory & skew, and plan reading across Junior, Mid, and Senior. One fictional power-grid scenario carries you the whole way.',
    icon: Star,
    accentRgb: '255,140,80',
    category: 'Distributed',
    comingSoon: false,
    ctaLabel: 'Choose topic',
  },
  {
    id: 'python',
    title: 'Python',
    description:
      'Pandas data manipulation the way data engineers actually write it — joins, groupby, indexing, and the patterns that hold up before you reach for Spark.',
    icon: Code2,
    accentRgb: '99,201,255',
    category: 'Tabular',
    comingSoon: false,
    ctaLabel: 'Choose topic',
  },
  {
    id: 'sql',
    title: 'SQL',
    description:
      'Warehouse-grade SQL — joins, window functions, dimensional modeling, and reading query plans on production data. First tracks landing soon.',
    icon: Database,
    accentRgb: '180,160,255',
    category: 'Declarative',
    comingSoon: false,
    ctaLabel: 'Choose topic',
  },
];

export const getCodingLanguage = (id: string) =>
  CODING_LANGUAGES.find((l) => l.id === id);

export const isCodingLanguage = (id: string): id is CodingLanguageId =>
  CODING_LANGUAGES.some((l) => l.id === id);
