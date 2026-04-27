// Shared topic catalog used by the landing teaser (first 3) and the public /topics page (all).
// Category colors mirror @/components/home/orbitalMapData CATEGORY_COLORS so cards match the in-app theme.

export interface LandingTopic {
  name: string;
  icon: string;
  category: string;
  catRgb: string;
  description: string;
  levels: {
    junior: string;
    mid: string;
    senior: string;
  };
  progressPct: number;
}

export const LANDING_TOPICS: readonly LandingTopic[] = [
  {
    name: 'Apache Airflow',
    icon: '/brand/apache-airflow-logo.svg',
    category: 'Orchestration',
    catRgb: '255,180,60',
    description:
      'Born at Airbnb, now orchestrating pipelines at Lyft, Adobe, and Stripe. Author DAGs, scale executors, debug production. 300 practice questions and a checkpoint per module.',
    levels: {
      junior: 'DAG authoring, operators, scheduling basics',
      mid: 'Dynamic DAGs, sensors, XComs, monitoring',
      senior: 'Scaling executors, multi-tenant, debugging at depth',
    },
    progressPct: 0,
  },
  {
    name: 'Microsoft Fabric',
    icon: '/brand/microsoft-fabric-track.svg',
    category: 'Platforms',
    catRgb: '34,200,150',
    description:
      "Microsoft's unified analytics stack — OneLake, lakehouses, and governance in one platform that enterprises like KPMG and Heathrow are betting on. 300 practice questions per tier.",
    levels: {
      junior: 'Workspaces, lakehouses, notebooks, data flows',
      mid: 'Production pipelines, governance, lineage',
      senior: 'Architecture, capacity planning, deployment patterns',
    },
    progressPct: 0,
  },
  {
    name: 'PySpark',
    icon: '/brand/pyspark-track-star.svg',
    category: 'Processing',
    catRgb: '170,120,255',
    description:
      'The engine behind batch and streaming at Netflix, Uber, and Shopify. DataFrames through Catalyst, AQE, and skew tuning. 360 practice questions plus hands-on coding tasks.',
    levels: {
      junior: 'DataFrames, transformations, joins, basics',
      mid: 'Window functions, partitioning, UDFs, broadcast',
      senior: 'Catalyst, AQE, skew handling, production tuning',
    },
    progressPct: 0,
  },
  {
    name: 'SQL',
    icon: '/brand/sql-logo.svg',
    category: 'Foundations',
    catRgb: '200,210,220',
    description:
      "The language every data team speaks — Stripe, Booking, Goldman, your last interview. Joins and windows through partitioning and query planning. 300 practice questions, junior to senior.",
    levels: {
      junior: 'Joins, aggregations, subqueries, basic windows',
      mid: 'Advanced windows, CTEs, indexing, optimization',
      senior: 'Query planning, partitioning, performance tuning',
    },
    progressPct: 0,
  },
  {
    name: 'Python',
    icon: '/brand/python-logo.svg',
    category: 'Foundations',
    catRgb: '200,210,220',
    description:
      'Powers Instagram, Spotify, and most of the data work at NASA and Bloomberg. Data structures through async, typing, packaging, and profiling. 300 practice questions for data engineers.',
    levels: {
      junior: 'Data structures, I/O, pandas basics',
      mid: 'Async, typing, packaging, testing pipelines',
      senior: 'Memory profiling, performance, production patterns',
    },
    progressPct: 0,
  },
];
