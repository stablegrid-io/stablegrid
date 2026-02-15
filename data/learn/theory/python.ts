import type { TheoryDoc } from '@/types/theory';

export const pythonTheory: TheoryDoc = {
  topic: 'python',
  title: 'Python and Pandas Theory Guide',
  description: 'Concepts behind vectorization, memory, and tabular transformations.',
  version: 'Python 3.11 / Pandas 2.x',
  chapters: [
    {
      id: 'python-data-model',
      number: 1,
      title: 'Python Data Model for Analytics',
      description: 'Mutability, references, and implications for data workflows.',
      totalMinutes: 9,
      sections: [
        {
          id: 'object-model',
          title: 'Objects and References',
          estimatedMinutes: 4,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Python variables reference objects. Understanding copy vs view semantics avoids subtle data bugs in ETL and notebook workflows.'
            }
          ]
        },
        {
          id: 'pandas-vectorization',
          title: 'Vectorization in Pandas',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'callout',
              variant: 'insight',
              content:
                'Vectorized operations are typically much faster than row-wise apply because they delegate loops to optimized native implementations.'
            }
          ]
        }
      ]
    }
  ]
};
