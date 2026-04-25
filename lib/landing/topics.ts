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
    description: 'Build Apache Airflow capability across orchestration foundations, DAG authoring, scheduling, monitoring, and production debugging.',
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
    description: 'Build Microsoft Fabric capability across platform foundations, analytics workflows, governance controls, and production delivery practices.',
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
    description: 'Build PySpark capability across foundations, data engineering workflows, optimization, and production-ready governance patterns.',
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
    description: 'Build SQL capability across query foundations, window functions, performance tuning, and production data modeling patterns.',
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
    description: 'Build Python capability across language foundations, async patterns, packaging, and production-ready data engineering practices.',
    levels: {
      junior: 'Data structures, I/O, pandas basics',
      mid: 'Async, typing, packaging, testing pipelines',
      senior: 'Memory profiling, performance, production patterns',
    },
    progressPct: 0,
  },
];
