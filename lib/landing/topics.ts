// Shared topic catalog used by the landing teaser (first 3) and the public /topics page (all).
// Category colors mirror @/components/home/orbitalMapData CATEGORY_COLORS so cards match the in-app theme.

export interface LandingTopic {
  /** URL slug for /topics/[slug] route — pretty, hyphen-free where possible. */
  slug: string;
  /** Topic id used to look up theoryDocs (and lib/learn keys). May differ from slug. */
  topicId: string;
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
  /** Long-form paragraph — anchors the landing page's "Why it matters" section. */
  whyItMatters: string;
  /** Real-world companies running on this stack (used as social proof on the landing). */
  realWorldUsers: readonly string[];
  /** One-line outcome statement — what you can do after the senior tier. */
  outcome: string;
}

export const LANDING_TOPICS: readonly LandingTopic[] = [
  {
    slug: 'airflow',
    topicId: 'airflow',
    name: 'Apache Airflow',
    icon: '/brand/apache-airflow-logo.svg',
    category: 'Orchestration',
    catRgb: '255,180,60',
    description:
      "Pipeline orchestration that doesn't break at 3am — DAGs, sensors, deferrable operators, and on-call-friendly reliability.",
    levels: {
      junior: 'DAG authoring, operators, scheduling basics',
      mid: 'Dynamic DAGs, sensors, XComs, monitoring',
      senior: 'Scaling executors, multi-tenant, debugging at depth',
    },
    progressPct: 0,
    whyItMatters:
      "Pipeline orchestration is the bedrock of modern data engineering. From Airbnb's original use case to today's production stacks at Lyft, Stripe, and Adobe, every team running scheduled jobs, ETL pipelines, or ML training workflows needs an orchestrator they can trust. As pipelines grow more complex and AI workloads scale, the demand for engineers who can author reliable DAGs, manage executors, and debug 3am failures has never been higher.",
    realWorldUsers: ['Airbnb', 'Lyft', 'Adobe', 'Stripe'],
    outcome:
      'Author production DAGs, scale executors, and debug failures with confidence.',
  },
  {
    slug: 'fabric',
    topicId: 'fabric',
    name: 'Microsoft Fabric',
    icon: '/brand/microsoft-fabric-track.svg',
    category: 'Platforms',
    catRgb: '34,200,150',
    description:
      "Microsoft's unified analytics stack — OneLake, Lakehouse, Pipelines, and Direct Lake from first workspace to enterprise governance.",
    levels: {
      junior: 'Workspaces, lakehouses, notebooks, data flows',
      mid: 'Production pipelines, governance, lineage',
      senior: 'Architecture, capacity planning, deployment patterns',
    },
    progressPct: 0,
    whyItMatters:
      "Microsoft's bet on unified analytics is reshaping the enterprise data landscape. OneLake collapses storage silos, Lakehouses blur the line between warehouse and lake, Pipelines orchestrate, and Direct Lake powers sub-second Power BI. As organizations consolidate around fewer platforms, Fabric expertise has become a fast-track skill — especially in enterprises already running on the Microsoft stack.",
    realWorldUsers: ['KPMG', 'Heathrow', 'Microsoft', 'Coca-Cola'],
    outcome:
      'Architect end-to-end analytics in Microsoft Fabric — from OneLake to Direct Lake.',
  },
  {
    slug: 'pyspark',
    topicId: 'pyspark',
    name: 'PySpark',
    icon: '/brand/pyspark-track-star.svg',
    category: 'Processing',
    catRgb: '170,120,255',
    description:
      'Distributed data engineering with Spark — partitions, the Catalyst optimizer, and lakehouse patterns that actually scale.',
    levels: {
      junior: 'DataFrames, transformations, joins, basics',
      mid: 'Window functions, partitioning, UDFs, broadcast',
      senior: 'Catalyst, AQE, skew handling, production tuning',
    },
    progressPct: 0,
    whyItMatters:
      'When the data outgrows a laptop, the answer is Spark. Netflix processes viewing telemetry, Uber computes trip economics, Shopify rolls up merchant analytics — all on PySpark. Understanding partitions, the Catalyst optimizer, AQE, and skew handling is what separates engineers who can run distributed jobs from engineers who can architect them. As data volumes climb and ML training pipelines scale, distributed-data fluency commands top compensation.',
    realWorldUsers: ['Netflix', 'Uber', 'Shopify', 'LinkedIn'],
    outcome:
      'Build, tune, and debug distributed Spark pipelines that scale to petabytes.',
  },
  {
    slug: 'sql',
    topicId: 'sql',
    name: 'SQL for Data Engineering',
    icon: '/brand/sql-logo.png',
    category: 'Foundations',
    catRgb: '200,210,220',
    description:
      'SQL for engineering the warehouse — multi-table joins, window functions, dimensional modeling, and query plans that hold up on production data.',
    levels: {
      junior: 'Joins, aggregations, windows, DDL for pipelines',
      mid: 'CTEs, dimensional modeling, query tuning, CI/CD',
      senior: 'Query planning, partitions, engine internals, governance',
    },
    progressPct: 0,
    whyItMatters:
      "SQL is the bedrock of every data warehouse and lakehouse. Stripe ships on it, Booking depends on it, Goldman Sachs models risk through it — and every modern data engineer reads and writes it daily. The line between someone who uses SQL and someone who engineers it runs through query planning, partitioning, dimensional modeling, and reasoning about cost at warehouse scale.",
    realWorldUsers: ['Stripe', 'Booking', 'Goldman Sachs', 'Datadog'],
    outcome:
      'Engineer warehouse-grade SQL — joins, windows, models, and query plans that scale.',
  },
  {
    slug: 'python',
    topicId: 'python-de',
    name: 'Python',
    icon: '/brand/python-logo.svg',
    category: 'Foundations',
    catRgb: '200,210,220',
    description:
      'The Python data engineers actually use — async I/O, pydantic, polars, and the patterns that make pipelines testable.',
    levels: {
      junior: 'Data structures, I/O, pandas basics',
      mid: 'Async, typing, packaging, testing pipelines',
      senior: 'Memory profiling, performance, production patterns',
    },
    progressPct: 0,
    whyItMatters:
      'Python runs the data world. From pipeline glue at NASA and Bloomberg to the entire ML and AI stack at OpenAI and Anthropic, Python is the lingua franca of modern engineering. The right Python — async I/O, type-safe data models with Pydantic, fast DataFrames with Polars, and tested production patterns — is what turns scripts into systems.',
    realWorldUsers: ['NASA', 'Bloomberg', 'OpenAI', 'Anthropic'],
    outcome:
      'Engineer Python data systems that are tested, typed, and production-ready.',
  },
];

export const getLandingTopicBySlug = (slug: string): LandingTopic | null =>
  LANDING_TOPICS.find((t) => t.slug === slug) ?? null;
