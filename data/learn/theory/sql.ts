import type { TheoryDoc } from '@/types/theory';

export const sqlTheory: TheoryDoc = {
  topic: 'sql',
  title: 'SQL Theory Guide',
  description: 'Relational foundations, query planning, and analytical SQL patterns.',
  version: 'ANSI SQL',
  chapters: [
    {
      id: 'sql-foundations',
      number: 1,
      title: 'Relational Foundations',
      description: 'Tables, keys, and normalization in analytical systems.',
      totalMinutes: 10,
      sections: [
        {
          id: 'relational-model',
          title: 'Relational Model',
          estimatedMinutes: 4,
          blocks: [
            {
              type: 'paragraph',
              content:
                'SQL relies on set-based operations over tables. Primary and foreign keys define entity relationships and support consistent joins.'
            }
          ]
        },
        {
          id: 'query-execution',
          title: 'How SQL Executes',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'table',
              headers: ['Clause', 'Logical order'],
              rows: [
                ['FROM / JOIN', '1'],
                ['WHERE', '2'],
                ['GROUP BY', '3'],
                ['HAVING', '4'],
                ['SELECT', '5'],
                ['ORDER BY', '6']
              ]
            }
          ]
        }
      ]
    }
  ]
};
