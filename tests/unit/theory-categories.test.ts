import { describe, expect, it } from 'vitest';
import {
  getTheoryCategories,
  getTheoryCategoryMeta
} from '@/data/learn/theory/categories';
import type { TheoryDoc } from '@/types/theory';

const doc: TheoryDoc = {
  topic: 'pyspark',
  title: 'PySpark Modules',
  description: 'Course categories',
  chapters: [
    {
      id: 'module-01',
      number: 1,
      title: 'Module 1: The Dawn of PySpark',
      description: 'History module',
      totalMinutes: 90,
      sections: [
        {
          id: 'module-01-lesson-01',
          title: 'Lesson 1: Intro',
          estimatedMinutes: 15,
          blocks: [{ type: 'paragraph', content: 'Intro' }]
        }
      ]
    },
    {
      id: 'module-03',
      number: 3,
      title: 'Module 3: Inside the Engine',
      description: 'Architecture module',
      totalMinutes: 120,
      sections: [
        {
          id: 'module-03-lesson-01',
          title: 'Lesson 1: Catalyst',
          estimatedMinutes: 20,
          blocks: [{ type: 'paragraph', content: 'Catalyst' }]
        }
      ]
    }
  ]
};

describe('theory category metadata', () => {
  it('uses PySpark-specific gallery labels', () => {
    const categories = getTheoryCategories(doc);

    expect(categories.map((category) => category.label)).toEqual([
      'Crash Course of PySpark',
      'Engine Room'
    ]);
  });

  it('returns PySpark-specific category meta by slug', () => {
    expect(getTheoryCategoryMeta('history', 'pyspark')).toEqual({
      slug: 'history',
      label: 'Crash Course of PySpark',
      description:
        'Start with the big-data shift, why Spark exists, and the mental model for the full course.'
    });
  });
});
