import type { CheatSheet } from '@/types/learn';

export const sqlData: CheatSheet = {
  topic: 'sql',
  title: 'SQL Reference',
  description: 'Core SQL patterns for analytics, reporting, and optimization.',
  version: 'ANSI SQL',
  categories: [
    {
      id: 'querying',
      label: 'Querying',
      description: 'Select and filter records.',
      count: 1
    },
    {
      id: 'joins',
      label: 'Joins',
      description: 'Combine tables.',
      count: 1
    },
    {
      id: 'aggregations',
      label: 'Aggregations',
      description: 'Summarize data.',
      count: 1
    },
    {
      id: 'window',
      label: 'Window Functions',
      description: 'Analytics over partitions.',
      count: 1
    }
  ],
  functions: [
    {
      id: 'sql-select-distinct',
      name: 'SELECT DISTINCT',
      category: 'querying',
      syntax: 'SELECT DISTINCT col1, col2 FROM table_name;',
      shortDescription: 'Return unique row combinations.',
      longDescription:
        'DISTINCT removes duplicate rows in the result set. Use only on required columns to avoid unnecessary sorting/hashing overhead.',
      returns: 'Result set with unique rows',
      examples: [
        {
          label: 'Unique countries',
          code: 'SELECT DISTINCT country\nFROM customers;'
        }
      ],
      relatedFunctions: ['sql-group-by'],
      notes: ['DISTINCT applies after projection (SELECT list).'],
      tags: ['select', 'distinct', 'deduplicate'],
      difficulty: 'beginner'
    },
    {
      id: 'sql-inner-join',
      name: 'INNER JOIN',
      category: 'joins',
      syntax:
        'SELECT ... FROM left_table l INNER JOIN right_table r ON l.key = r.key;',
      shortDescription: 'Keep rows that match in both tables.',
      longDescription:
        'INNER JOIN returns only records with matching keys in both datasets. It is the most common join type in warehouse queries.',
      returns: 'Joined result with matched rows',
      examples: [
        {
          label: 'Orders with customer segment',
          code: 'SELECT o.order_id, c.segment\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id;'
        }
      ],
      relatedFunctions: ['sql-group-by', 'sql-row-number'],
      notes: ['Check key cardinality to avoid row explosion.'],
      performance:
        'Indexes on join keys can significantly improve execution plans.',
      tags: ['join', 'inner join', 'relationship'],
      difficulty: 'beginner'
    },
    {
      id: 'sql-group-by',
      name: 'GROUP BY',
      category: 'aggregations',
      syntax: 'SELECT key, AGG(col) FROM table GROUP BY key;',
      shortDescription: 'Aggregate rows by one or more keys.',
      longDescription:
        'GROUP BY creates groups and applies aggregate functions such as COUNT, SUM, AVG, MIN, and MAX.',
      returns: 'Aggregated result set',
      examples: [
        {
          label: 'Revenue per region',
          code: 'SELECT region, SUM(revenue) AS total_revenue\nFROM sales\nGROUP BY region;'
        }
      ],
      relatedFunctions: ['sql-select-distinct'],
      notes: ['Use HAVING for post-aggregation filters.'],
      tags: ['group by', 'aggregate', 'sum', 'count'],
      difficulty: 'intermediate'
    },
    {
      id: 'sql-row-number',
      name: 'ROW_NUMBER() OVER()',
      category: 'window',
      syntax:
        'ROW_NUMBER() OVER (PARTITION BY key ORDER BY metric DESC) AS row_num',
      shortDescription: 'Assign ordered row index within partitions.',
      longDescription:
        'ROW_NUMBER is useful for top-N, deduplication, and latest-record logic. Unlike RANK, it does not preserve ties.',
      returns: 'Integer column per row',
      examples: [
        {
          label: 'Latest row per customer',
          code: 'WITH ranked AS (\n  SELECT *,\n         ROW_NUMBER() OVER (\n           PARTITION BY customer_id\n           ORDER BY updated_at DESC\n         ) AS rn\n  FROM customer_events\n)\nSELECT *\nFROM ranked\nWHERE rn = 1;'
        }
      ],
      relatedFunctions: ['sql-inner-join'],
      notes: ['Always specify ORDER BY for deterministic ranking.'],
      performance:
        'Window functions can be expensive on large partitions; prune rows early.',
      tags: ['window', 'row_number', 'top-n', 'dedup'],
      difficulty: 'advanced'
    }
  ]
};
