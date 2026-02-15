import type { CheatSheet } from '@/types/learn';

export const pythonData: CheatSheet = {
  topic: 'python',
  title: 'Python and Pandas Reference',
  description: 'Data-wrangling patterns for exploratory and production analysis.',
  version: 'Python 3.11 / Pandas 2.x',
  categories: [
    {
      id: 'io',
      label: 'IO',
      description: 'Load data files.',
      count: 1
    },
    {
      id: 'wrangling',
      label: 'Wrangling',
      description: 'Transform columns and rows.',
      count: 1
    },
    {
      id: 'joins',
      label: 'Joins',
      description: 'Combine datasets.',
      count: 1
    },
    {
      id: 'aggregation',
      label: 'Aggregation',
      description: 'Group and summarize.',
      count: 1
    }
  ],
  functions: [
    {
      id: 'pd-read-csv',
      name: 'pd.read_csv()',
      category: 'io',
      syntax: 'pd.read_csv(filepath, usecols=None, dtype=None, parse_dates=None)',
      shortDescription: 'Read CSV files into a DataFrame.',
      longDescription:
        'read_csv is the standard entry point for tabular text data. Use usecols and dtype to reduce memory and improve parse speed.',
      parameters: [
        {
          name: 'filepath',
          type: 'str',
          required: true,
          description: 'Path or URL to CSV file.'
        },
        {
          name: 'usecols',
          type: 'list[str]',
          required: false,
          description: 'Subset of columns to load.'
        },
        {
          name: 'dtype',
          type: 'dict[str, type]',
          required: false,
          description: 'Explicit column types.'
        }
      ],
      returns: 'pandas.DataFrame',
      examples: [
        {
          label: 'Load selected columns',
          code: 'import pandas as pd\n\ndf = pd.read_csv("sales.csv", usecols=["date", "region", "revenue"])'
        }
      ],
      relatedFunctions: ['df-query', 'df-groupby'],
      tags: ['pandas', 'io', 'csv', 'load'],
      difficulty: 'beginner'
    },
    {
      id: 'df-query',
      name: 'DataFrame.query()',
      category: 'wrangling',
      syntax: 'df.query("expression")',
      shortDescription: 'Filter DataFrame rows with expression strings.',
      longDescription:
        'query provides concise filtering syntax and is especially readable for chained transformations.',
      returns: 'Filtered DataFrame',
      examples: [
        {
          label: 'Filter active enterprise customers',
          code: 'filtered = df.query(\'status == "active" and plan == "enterprise"\')'
        }
      ],
      relatedFunctions: ['pd-read-csv', 'df-groupby'],
      notes: ['Escape quotes correctly when building dynamic expressions.'],
      tags: ['filter', 'query', 'wrangling'],
      difficulty: 'beginner'
    },
    {
      id: 'pd-merge',
      name: 'pd.merge()',
      category: 'joins',
      syntax: 'pd.merge(left, right, on=None, how="inner")',
      shortDescription: 'Join DataFrames with SQL-like semantics.',
      longDescription:
        'merge supports inner/left/right/outer joins and multiple keys. Validate key uniqueness before merge to avoid accidental duplication.',
      returns: 'Joined DataFrame',
      examples: [
        {
          label: 'Left join orders and customers',
          code: 'joined = pd.merge(orders, customers, on="customer_id", how="left")'
        }
      ],
      relatedFunctions: ['df-groupby'],
      performance:
        'For large joins, cast key types consistently and pre-select required columns.',
      tags: ['join', 'merge', 'pandas'],
      difficulty: 'intermediate'
    },
    {
      id: 'df-groupby',
      name: 'DataFrame.groupby()',
      category: 'aggregation',
      syntax: 'df.groupby(keys).agg(aggregations)',
      shortDescription: 'Aggregate data by one or more grouping keys.',
      longDescription:
        'groupby is a core primitive for metrics pipelines. You can apply multiple aggregations and then flatten resulting column indexes.',
      returns: 'Grouped/aggregated DataFrame',
      examples: [
        {
          label: 'Revenue summary by region',
          code: 'summary = (\n  df.groupby("region", as_index=False)\n    .agg(total_revenue=("revenue", "sum"), avg_order=("revenue", "mean"))\n)'
        }
      ],
      relatedFunctions: ['df-query', 'pd-merge'],
      tags: ['groupby', 'aggregate', 'metrics'],
      difficulty: 'intermediate'
    }
  ]
};
