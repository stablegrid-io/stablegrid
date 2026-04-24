// Shared topic catalog used by the landing teaser (first 3) and the public /topics page (all).
// Category colors mirror @/components/home/orbitalMapData CATEGORY_COLORS so cards match the in-app theme.

export interface LandingTopic {
  name: string;
  icon: string;
  category: string;
  catRgb: string;
  description: string;
  progressPct: number;
}

export const LANDING_TOPICS: readonly LandingTopic[] = [
  {
    name: 'Apache Airflow',
    icon: '/brand/apache-airflow-logo.svg',
    category: 'Orchestration',
    catRgb: '255,180,60',
    description: 'Build Apache Airflow capability across orchestration foundations, DAG authoring, scheduling, monitoring, and production debugging.',
    progressPct: 0,
  },
  {
    name: 'Microsoft Fabric',
    icon: '/brand/microsoft-fabric-track.svg',
    category: 'Platforms',
    catRgb: '34,200,150',
    description: 'Build Microsoft Fabric capability across platform foundations, analytics workflows, governance controls, and production delivery practices.',
    progressPct: 0,
  },
  {
    name: 'PySpark',
    icon: '/brand/pyspark-track-star.svg',
    category: 'Processing',
    catRgb: '170,120,255',
    description: 'Build PySpark capability across foundations, data engineering workflows, optimization, and production-ready governance patterns.',
    progressPct: 0,
  },
  {
    name: 'SQL',
    icon: '/brand/sql-logo.svg',
    category: 'Foundations',
    catRgb: '200,210,220',
    description: 'Build SQL capability across query foundations, window functions, performance tuning, and production data modeling patterns.',
    progressPct: 0,
  },
  {
    name: 'Python',
    icon: '/brand/python-logo.svg',
    category: 'Foundations',
    catRgb: '200,210,220',
    description: 'Build Python capability across language foundations, async patterns, packaging, and production-ready data engineering practices.',
    progressPct: 0,
  },
  {
    name: 'Apache Kafka',
    icon: '/brand/apache-kafka-logo.svg',
    category: 'Orchestration',
    catRgb: '255,180,60',
    description: 'Build Apache Kafka capability across streaming foundations, producer/consumer design, schemas, and production resilience.',
    progressPct: 0,
  },
  {
    name: 'Docker',
    icon: '/brand/docker-logo.svg',
    category: 'Infrastructure',
    catRgb: '100,180,255',
    description: 'Build Docker capability across container foundations, image optimization, networking, and production orchestration patterns.',
    progressPct: 0,
  },
  {
    name: 'dbt',
    icon: '/brand/dbt-logo.svg',
    category: 'Processing',
    catRgb: '170,120,255',
    description: 'Build dbt capability across modeling foundations, testing, materialization strategies, and production analytics workflows.',
    progressPct: 0,
  },
];
