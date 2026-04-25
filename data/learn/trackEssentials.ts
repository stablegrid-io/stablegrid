/**
 * Essential info for each (topic, tier) combination, rendered on the track-map
 * page above the zigzag tree. Five topics × three tiers = 15 variants.
 */

export type TrackTier = 'junior' | 'mid' | 'senior';

export interface TrackEssentials {
  focus: string;
  why: string;
  concepts: string[];
  outcomes: string[];
  prereqs: string;
  idealFor: string;
}

type EssentialsTopic = Record<TrackTier, TrackEssentials>;

const pyspark: EssentialsTopic = {
  junior: {
    focus: 'Go from Python mindset to distributed thinking.',
    why: 'PySpark powers the majority of batch workloads in modern data platforms. The junior track teaches how Spark partitions data across a cluster and why that model matters — so you stop writing pandas on a laptop and start writing pipelines that scale.',
    concepts: [
      'RDDs vs DataFrames — when each belongs',
      'Lazy evaluation and the execution DAG',
      'Transformations vs actions',
      'SparkSession and cluster configuration',
      'Reading CSV, JSON, and Parquet',
      'Filtering, selecting, and aggregating',
      'groupBy and joins',
      'Writing partitioned output',
    ],
    outcomes: [
      'Build a basic batch ingestion pipeline end-to-end',
      'Read and write Parquet with correct partitioning',
      'Debug job failures using the Spark UI',
      'Translate pandas patterns into PySpark idioms',
    ],
    prereqs: 'Comfortable with Python and basic SQL',
    idealFor: 'Analysts and Python developers moving into distributed batch processing.',
  },
  mid: {
    focus: 'Tune real pipelines on real data volumes.',
    why: "At mid-level, the question isn't 'how do I do X?' — it's 'why is X slow?'. This track shifts you from syntax to systems thinking: physical plans, partition skew, shuffle costs, and the Catalyst optimizer.",
    concepts: [
      'Catalyst optimizer and physical plans',
      'Adaptive Query Execution (AQE)',
      'Partitioning, bucketing, repartition vs coalesce',
      'Broadcast joins and shuffle hash joins',
      'Skew detection and mitigation',
      'Caching strategies and storage levels',
      'UDFs, Pandas UDFs, and built-ins',
      'Delta Lake basics: ACID, time travel, MERGE',
    ],
    outcomes: [
      'Read a physical plan and find the bottleneck',
      'Eliminate shuffle skew in production jobs',
      'Choose between broadcast and shuffle joins correctly',
      'Build incremental pipelines on Delta Lake',
    ],
    prereqs: 'Comfortable writing PySpark batch jobs in production',
    idealFor: 'Data engineers maintaining daily pipelines who want to cut runtime and cost.',
  },
  senior: {
    focus: 'Architect Spark platforms, not just jobs.',
    why: "Senior-level Spark isn't about faster queries — it's about designing systems teams of engineers can build on. You'll cover structured streaming, Spark on Kubernetes, cluster tuning, and the hardest migrations: legacy batch to streaming, small-file hell, and multi-tenant governance.",
    concepts: [
      'Structured Streaming: watermarks, stateful ops, exactly-once',
      'Spark on Kubernetes and dynamic allocation',
      'Cluster sizing, executor memory, off-heap',
      'Cost attribution and multi-tenancy',
      'Metastore architecture (Unity Catalog, Hive)',
      'Schema evolution at scale',
      'Liquid clustering and z-ordering',
      'Observability: streaming metrics and OpenLineage',
    ],
    outcomes: [
      'Design a streaming pipeline with proper watermarks and recovery',
      'Right-size a cluster for a given workload profile',
      'Lead a migration from legacy ETL to lakehouse',
      'Operate a shared Spark platform across multiple teams',
    ],
    prereqs: 'Has shipped and tuned production Spark jobs',
    idealFor: 'Senior data engineers and platform engineers owning shared Spark infrastructure.',
  },
};

const fabric: EssentialsTopic = {
  junior: {
    focus: 'Learn the Fabric workspace from the ground up.',
    why: "Microsoft Fabric unifies OneLake, Lakehouse, Warehouse, Pipelines, and Power BI under one skin. The junior track gets you fluent in the vocabulary and the workspace before you touch production.",
    concepts: [
      'OneLake and the shortcut model',
      'Workspaces, capacities, and domains',
      'Lakehouse vs Warehouse — when to use which',
      'Delta tables in Fabric',
      'Notebooks and Spark in Fabric',
      'Data Pipelines and Copy Activity',
      'SQL endpoint and T-SQL basics',
      'Direct Lake mode for Power BI',
    ],
    outcomes: [
      'Stand up a Lakehouse and ingest a flat file',
      'Query Delta tables via the SQL endpoint',
      'Build a Pipeline that copies data on a schedule',
      'Connect Power BI to a Lakehouse via Direct Lake',
    ],
    prereqs: 'Basic SQL and comfort with cloud portals',
    idealFor: 'Analysts and BI developers moving from pure Power BI into a full lakehouse story.',
  },
  mid: {
    focus: 'Ship real Fabric solutions, not demos.',
    why: "At mid-level you stop clicking through the portal and start building solutions that survive change — governed, monitored, CI/CD-driven. This track covers medallion architecture, deployment pipelines, and the production gotchas Microsoft docs skip.",
    concepts: [
      'Medallion architecture (bronze/silver/gold) in Fabric',
      'Dataflows Gen2 vs Pipelines vs Notebooks',
      'Shortcuts and cross-workspace access',
      'Deployment pipelines and git integration',
      'Capacity management and throttling',
      'Row-level and column-level security',
      'Semantic models and Direct Lake tuning',
      'Monitoring hub, alerts, and failure handling',
    ],
    outcomes: [
      'Design a bronze→silver→gold lakehouse for a real domain',
      'Use deployment pipelines to promote dev to prod',
      'Debug a throttled capacity incident',
      'Apply row-level security across a semantic model',
    ],
    prereqs: 'Comfortable with SQL, basic PySpark, and Power BI modeling',
    idealFor: 'Data engineers shipping their first Fabric-based analytics product.',
  },
  senior: {
    focus: 'Own the Fabric platform for an enterprise.',
    why: "Senior Fabric work is about cross-workspace architecture, capacity strategy across business units, and the boring-but-critical governance story. You'll cover Purview integration, FinOps on capacities, and DR patterns for Lakehouse.",
    concepts: [
      'Multi-capacity strategy and workload isolation',
      'Purview integration and lineage',
      'FinOps: capacity sizing, pausing, burst',
      'Tenant-level governance and admin settings',
      'Shortcuts across tenants and regions',
      'DR patterns for Lakehouse and Warehouse',
      'Zero-copy vs ingest decisions',
      'Fabric APIs for automation',
    ],
    outcomes: [
      'Design a capacity plan for a multi-BU organization',
      'Implement lineage and governance across workspaces',
      'Automate workspace provisioning via the Fabric API',
      'Lead a DR drill for a production Lakehouse',
    ],
    prereqs: 'Has run Fabric in production and felt the pain',
    idealFor: 'Data architects and platform leads standardizing Fabric across the enterprise.',
  },
};

const airflow: EssentialsTopic = {
  junior: {
    focus: 'From first DAG to scheduled pipeline.',
    why: "Airflow is the orchestration default of the industry. The junior track teaches you how to think in DAGs, scheduling intervals, and operators — so the next time someone asks 'can you schedule this?' you know exactly what to build.",
    concepts: [
      'DAG anatomy: tasks, operators, dependencies',
      'Scheduler, executor, and worker architecture',
      'Scheduling: cron, intervals, catchup, backfill',
      'Operators: Python, Bash, Branch, Sensor',
      'XComs and task communication',
      'Connections, Variables, and Hooks',
      'Task retries, SLAs, and timeouts',
      'Airflow UI: graph, grid, and logs',
    ],
    outcomes: [
      'Write a clean DAG from scratch',
      'Use sensors and branches for conditional flows',
      'Read Airflow logs to debug failures',
      'Parameterize a DAG safely via Variables',
    ],
    prereqs: 'Intermediate Python',
    idealFor: 'Data engineers or analytics engineers who need to schedule pipelines this week.',
  },
  mid: {
    focus: "Airflow that doesn't break at 3am.",
    why: "Mid-level Airflow is where junior DAGs meet reality — dynamic task mapping, deferrable operators, the TaskFlow API, and the ops patterns (alerting, retries, pool management) that keep on-call quiet.",
    concepts: [
      'TaskFlow API and typed XComs',
      'Dynamic task mapping (Airflow 2.3+)',
      'Deferrable operators and triggers',
      'Pools, queues, and executor tuning',
      'Custom operators and hooks',
      'Sensor anti-patterns and reschedule mode',
      'Alerting and SLA misses (callbacks)',
      'DAG unit testing',
    ],
    outcomes: [
      'Refactor a messy DAG into the TaskFlow API',
      'Replace polling sensors with deferrable triggers',
      'Write unit tests for DAG logic',
      'Design on-call-friendly retry and alert policies',
    ],
    prereqs: 'Shipped at least one scheduled DAG to production',
    idealFor: 'Data engineers owning an Airflow deployment and tired of pager noise.',
  },
  senior: {
    focus: 'Platform Airflow — multi-team, multi-tenant.',
    why: "At senior level, the interesting problems are scaling Airflow itself: Kubernetes executor at scale, DAG deploy pipelines, multi-tenant isolation, and the inevitable migration off (or onto) managed Airflow.",
    concepts: [
      'Kubernetes executor at scale',
      'DAG CI/CD and deploy pipelines',
      'Multi-tenant isolation (RBAC, pools, namespaces)',
      'Scheduler scaling and HA',
      'Metadata DB performance and upgrades',
      'Managed vs self-hosted tradeoffs',
      'OpenLineage and data lineage from DAGs',
      'Migration patterns: Airflow 1→2, Composer, MWAA',
    ],
    outcomes: [
      'Design a multi-tenant Airflow deployment',
      'Build a DAG deploy pipeline with safety checks',
      'Lead a production Airflow version upgrade',
      'Make an informed managed-vs-self-hosted decision',
    ],
    prereqs: 'Operates Airflow in production; comfortable with Kubernetes',
    idealFor: 'Platform engineers and tech leads owning shared orchestration infrastructure.',
  },
};

const sql: EssentialsTopic = {
  junior: {
    focus: 'Query data without hesitation.',
    why: 'SQL is the one language every data role touches. The junior track builds the reflexes — SELECT, JOIN, GROUP BY, window functions — so you can answer business questions in minutes instead of hours.',
    concepts: [
      'SELECT, WHERE, ORDER BY, LIMIT',
      'INNER, LEFT, RIGHT, and FULL joins',
      'Aggregations with GROUP BY and HAVING',
      'Subqueries and CTEs',
      'Window functions: ROW_NUMBER, RANK, LAG/LEAD',
      'Date and string functions',
      'CASE expressions',
      'NULL handling gotchas',
    ],
    outcomes: [
      'Write multi-table joins without second-guessing',
      'Answer "top N per group" with window functions',
      'Debug NULL-related bugs in aggregations',
      'Translate a vague business question into a clean query',
    ],
    prereqs: 'None',
    idealFor: 'Analysts, engineers, and anyone who wants to stop relying on someone else for answers.',
  },
  mid: {
    focus: 'Write SQL that scales past toy data.',
    why: "At mid-level, correctness isn't enough — queries need to run in seconds on real datasets. This track covers execution plans, indexing, and the query patterns that actually matter in production warehouses.",
    concepts: [
      'Reading EXPLAIN plans (Postgres, Snowflake, BigQuery)',
      'Indexing strategies: B-tree, hash, covering',
      'Partitioning and clustering',
      'Materialized views and result caches',
      'Anti-patterns: SELECT *, correlated subqueries',
      'Window-function optimization',
      'Transactions and isolation levels',
      'Advanced and recursive CTEs',
    ],
    outcomes: [
      'Read a query plan and find the bottleneck',
      'Add indexes that actually help — and none that don\'t',
      'Refactor slow queries to use sargable predicates',
      'Design partitioning for a fact table',
    ],
    prereqs: 'Comfortable joining 4+ tables and using window functions',
    idealFor: 'Analytics engineers and data engineers whose queries hit real production data.',
  },
  senior: {
    focus: 'Design the data model, not just the query.',
    why: "Senior SQL work is half query, half schema: the right grain for a fact, the right SCD type for a dimension, the right materialization strategy for your warehouse. You'll cover modeling patterns (Kimball, Data Vault, OBT) and the dbt-era concerns that come with them.",
    concepts: [
      'Dimensional modeling and Kimball patterns',
      'Slowly changing dimensions (SCD 1/2/3/6)',
      'Data Vault basics and when to use it',
      'Incremental model strategies',
      'Surrogate vs natural keys',
      'Time-series modeling (event vs snapshot)',
      'Query federation and lakehouse SQL',
      'Cost models across warehouse engines',
    ],
    outcomes: [
      'Design a fact table at the right grain',
      'Pick an SCD strategy and defend it',
      'Build an incremental model that survives late-arriving data',
      'Reason about SQL cost on Snowflake, BigQuery, or Redshift',
    ],
    prereqs: 'Has modeled at least one warehouse in production',
    idealFor: 'Senior analytics engineers and data architects owning warehouse design.',
  },
};

const pythonDe: EssentialsTopic = {
  junior: {
    focus: 'Python the way data engineers actually use it.',
    why: 'Every data platform eventually has Python glue somewhere. The junior track covers the subset of Python that shows up in ingestion scripts, transformations, and API integrations — with the patterns that keep code reviewable.',
    concepts: [
      'Core types, comprehensions, generators',
      'File I/O: CSV, JSON, Parquet via pyarrow',
      'requests and basic API integration',
      'pandas for tabular work — and when not to use it',
      'Virtualenvs, pip, and dependency basics',
      'Logging and config patterns',
      'Pytest basics',
      'Type hints and mypy basics',
    ],
    outcomes: [
      'Write a clean ingestion script from an API',
      'Use pandas for exploratory transforms',
      'Package a script with its dependencies',
      'Add tests to a data script',
    ],
    prereqs: 'Basic programming in any language',
    idealFor: 'Analysts and SQL-first engineers leveling up their Python.',
  },
  mid: {
    focus: "Write data code you'd be proud to maintain.",
    why: 'Mid-level Python for data engineering is about craftsmanship: async I/O for APIs, typed data classes, proper error handling, and the architecture patterns (functional core, imperative shell) that make pipelines easy to test.',
    concepts: [
      'Async and concurrency (asyncio, httpx)',
      'pydantic, dataclasses, attrs',
      'Functional core, imperative shell',
      'Error handling, retries, circuit breakers',
      'polars vs pandas vs pyarrow',
      'Packaging: pyproject.toml and uv',
      'Testing: fixtures, mocks, integration tests',
      'Profiling and memory debugging',
    ],
    outcomes: [
      'Refactor a sync script into safe async I/O',
      'Model an API response with pydantic',
      'Pick the right DataFrame library for a workload',
      'Ship a tested, pip-installable data package',
    ],
    prereqs: 'Writes Python daily',
    idealFor: 'Data engineers who want to stop apologizing for their Python.',
  },
  senior: {
    focus: 'Python as a platform, not just a language.',
    why: 'At senior level, Python choices shape the platform — framework design, plugin systems, C extensions for hot paths, and the packaging strategy that keeps 50 engineers productive. This track covers the decisions behind frameworks like Dagster, Airflow, and dbt.',
    concepts: [
      'Plugin systems and entry points',
      'Metaclasses, descriptors, protocols',
      'CPython performance: GIL, multiprocessing, subinterpreters',
      'Rust and Cython for hot paths (PyO3)',
      'Monorepo packaging (uv workspaces, Bazel)',
      'Type system edges: Protocol, TypedDict, Generics',
      'Framework design patterns',
      'Migration: Python 3.x upgrades at scale',
    ],
    outcomes: [
      'Design a plugin interface for a data tool',
      'Profile and optimize a hot Python path with Rust',
      'Architect packaging for a large multi-service codebase',
      'Lead a Python version upgrade across teams',
    ],
    prereqs: 'Senior Python; has maintained a library others depend on',
    idealFor: 'Platform engineers and framework authors.',
  },
};

export const TRACK_ESSENTIALS: Record<string, EssentialsTopic> = {
  pyspark,
  fabric,
  airflow,
  sql,
  'python-de': pythonDe,
};

export const getTrackEssentials = (topic: string, tier: string): TrackEssentials | null => {
  const topicKey = topic.toLowerCase();
  const topicEntry = TRACK_ESSENTIALS[topicKey];
  if (!topicEntry) return null;
  const tierKey = tier.toLowerCase() as TrackTier;
  return topicEntry[tierKey] ?? null;
};
