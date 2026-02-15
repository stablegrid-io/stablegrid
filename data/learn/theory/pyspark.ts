// data/learn/theory/pyspark.ts
// Exhaustive PySpark Theory — Architecture, Internals, Optimization Playbook
// Covers: Spark engine, memory, shuffles, joins, skew, AQE, Delta, Streaming, UDFs

import { TheoryDoc } from '@/types/theory'

export const pysparkTheory: TheoryDoc = {
  topic: 'pyspark',
  title: 'PySpark: Complete Theory Guide',
  description:
    'Deep internals, architecture, and optimization playbook for billion-row datasets. Every concept explained with real-world examples.',
  version: 'Spark 3.4+',

  chapters: [

    // ═══════════════════════════════════════════════
    // CHAPTER 1 — WHAT IS SPARK
    // ═══════════════════════════════════════════════
    {
      id: 'what-is-spark',
      number: 1,
      title: 'What is Apache Spark?',
      description: 'The big picture — why Spark exists, what it replaces, and when to use it.',
      totalMinutes: 10,
      sections: [
        {
          id: 'the-problem',
          title: 'The Problem Spark Solves',
          estimatedMinutes: 4,
          blocks: [
            {
              type: 'paragraph',
              content:
                'In the early 2010s, datasets grew past what a single machine could process. A 10TB transaction log, a 500GB event stream, a 2 billion-row clickstream table — none of these fit in one computer\'s memory or can be processed in a reasonable time on one CPU. The industry needed a way to split work across hundreds of machines and coordinate the results.',
            },
            {
              type: 'paragraph',
              content:
                'The first widely-adopted solution was Hadoop MapReduce. It worked — but it was brutally slow. Every intermediate step wrote data to disk. A 10-step pipeline meant 10 disk writes and 10 disk reads. A job that conceptually should take 5 minutes took 45 minutes because the bottleneck was disk I/O, not computation.',
            },
            {
              type: 'diagram',
              title: 'Hadoop MapReduce — the disk I/O bottleneck',
              content: `
Step 1: Read from HDFS → Map → Write to HDFS  (disk write #1)
Step 2: Read from HDFS → Shuffle → Write to HDFS  (disk write #2)
Step 3: Read from HDFS → Reduce → Write to HDFS  (disk write #3)
Step 4: Read from HDFS → Map → Write to HDFS  (disk write #4)
...

Each arrow = disk write + disk read = slow

Real benchmark: A 100GB sorting job
  Hadoop MapReduce:  ~150 minutes
  Apache Spark:      ~23 minutes  (6.5x faster)
  Spark (in-memory): ~3 minutes   (50x faster)`,
              caption: 'Hadoop writes to disk between every step. Spark keeps data in RAM.',
            },
            {
              type: 'callout',
              variant: 'insight',
              title: 'Spark\'s Core Insight: RAM is the new disk',
              content:
                'Spark\'s key innovation (from the 2010 Berkeley paper): keep intermediate results in memory (RAM) across computation steps. RAM is 100-1000x faster than disk. Instead of disk→compute→disk→compute, Spark does compute→RAM→compute→RAM. This single idea made Spark 10-100x faster than Hadoop for most workloads.',
            },
            {
              type: 'paragraph',
              content:
                'Apache Spark was created at UC Berkeley\'s AMPLab in 2009, open-sourced in 2010, and donated to the Apache Software Foundation in 2013. By 2015 it had overtaken Hadoop MapReduce as the dominant big data engine. Today it powers data pipelines at Uber, Airbnb, Netflix, LinkedIn, Apple, and virtually every company handling large-scale data.',
            },
          ],
        },
        {
          id: 'what-spark-does',
          title: 'The Unified Analytics Engine',
          estimatedMinutes: 3,
          blocks: [
            {
              type: 'paragraph',
              content:
                '"Unified" is the operative word in Spark\'s tagline. One engine handles four distinct workloads with the same API and programming model:',
            },
            {
              type: 'table',
              headers: ['Workload', 'What it does', 'API', 'Replaces'],
              rows: [
                ['Batch ETL', 'Process historical data at scale', 'DataFrame / SQL', 'Hadoop MapReduce'],
                ['Streaming', 'Process real-time event streams', 'Structured Streaming', 'Apache Storm / Flink'],
                ['Machine Learning', 'Train models on distributed data', 'MLlib / Spark ML', 'Mahout'],
                ['Graph Processing', 'Analyze networks and relationships', 'GraphX', 'Pregel'],
              ],
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Why "Unified" Matters',
              content:
                'Before Spark, a company might run Hadoop for ETL, Storm for streaming, and a separate ML cluster. Three systems to manage, three sets of connectors, three sets of engineers. Spark collapses this into one. Your ETL pipeline and your ML training job use the same API, the same cluster, and the same team.',
            },
          ],
        },
        {
          id: 'pyspark-vs-pandas',
          title: 'PySpark vs Pandas — When to Use Which',
          estimatedMinutes: 3,
          blocks: [
            {
              type: 'comparison',
              title: 'PySpark vs Pandas — the honest comparison',
              left: {
                label: '✅ Use PySpark when',
                points: [
                  'Dataset > 10GB (does not fit in RAM)',
                  'You need parallelism across a cluster',
                  'Daily/hourly ETL pipelines at scale',
                  'Working with Parquet, Delta, S3, HDFS',
                  'You need fault tolerance on failures',
                  'Processing billions of rows',
                ],
              },
              right: {
                label: '✅ Use Pandas when',
                points: [
                  'Dataset < 10GB (fits in RAM easily)',
                  'Exploratory analysis / prototyping',
                  'Full Python ecosystem (scipy, statsmodels)',
                  'Speed of development > speed of execution',
                  'Single machine workflow',
                  'Complex indexing or mixed types',
                ],
              },
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'The Spark Overhead Tax',
              content:
                'Spark has 5-30 second startup overhead, cluster coordination overhead per operation, and serialization overhead. For a 100MB CSV file, Pandas will finish in 2 seconds. Spark will take 30 seconds. Spark\'s benefits only outweigh its costs when data is large enough that parallelism matters.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'The breakeven point — rough estimate',
              content: `# Rule of thumb benchmarks (single-machine Spark vs Pandas):
#
# 100MB  → Pandas: 0.5s,  Spark: 15s  → USE PANDAS
# 1GB    → Pandas: 5s,    Spark: 20s  → USE PANDAS
# 10GB   → Pandas: 45s,   Spark: 30s  → TIE (prefer Spark for pipeline)
# 100GB  → Pandas: OOM,   Spark: 3min → USE SPARK
# 1TB    → Pandas: OOM,   Spark: 20min→ USE SPARK
# 10TB   → Pandas: OOM,   Spark: 2hr  → USE SPARK
#
# These assume a modest cluster. With 100 executors, Spark on 10TB takes ~15min.`,
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 2 — ARCHITECTURE
    // ═══════════════════════════════════════════════
    {
      id: 'architecture',
      number: 2,
      title: 'Spark Architecture Deep Dive',
      description: 'Driver, Executors, Cluster Manager — how every component fits together.',
      totalMinutes: 18,
      sections: [
        {
          id: 'driver-executor',
          title: 'Driver and Executors',
          estimatedMinutes: 7,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Every Spark application runs as two types of processes: one Driver and many Executors. This is the most fundamental concept in Spark. Confusing driver-side code with executor-side code is the root cause of the most common bugs and performance problems.',
            },
            {
              type: 'diagram',
              title: 'Full Spark cluster architecture',
              content: `
┌─────────────────────────────────────────────────────────────────────┐
│                        CLUSTER MANAGER                              │
│               (YARN / Kubernetes / Standalone)                      │
│   - Allocates CPU cores and RAM to the application                  │
│   - Monitors executor health, restarts failed ones                  │
└────────────────────────┬────────────────────────────────────────────┘
                         │ "give me 50 executors with 8GB each"
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                    YOUR SPARK APPLICATION                          │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                       DRIVER NODE                           │  │
│  │                                                             │  │
│  │  SparkSession / SparkContext                                │  │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐   │  │
│  │  │  Catalyst         │  │  DAG Scheduler               │   │  │
│  │  │  Optimizer        │  │  - Breaks DAG into Stages    │   │  │
│  │  │  - Parses SQL     │  │  - Submits Tasks to Executors│   │  │
│  │  │  - Optimizes plan │  └──────────────────────────────┘   │  │
│  │  └──────────────────┘                                       │  │
│  │                                                             │  │
│  │  ⚠️  Your Python code runs here                             │  │
│  │  ⚠️  NO data lives here (only metadata/schema)              │  │
│  │  ⚠️  Typically 4-16GB RAM                                   │  │
│  └────────────────────────────┬────────────────────────────────┘  │
│                               │ sends tasks                        │
│              ┌────────────────┼────────────────┐                   │
│              ▼                ▼                ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  EXECUTOR 1  │  │  EXECUTOR 2  │  │  EXECUTOR N  │             │
│  │  8GB RAM     │  │  8GB RAM     │  │  8GB RAM     │             │
│  │  4 cores     │  │  4 cores     │  │  4 cores     │             │
│  │              │  │              │  │              │             │
│  │  Task  Task  │  │  Task  Task  │  │  Task  Task  │             │
│  │  Task  Task  │  │  Task  Task  │  │  Task  Task  │             │
│  │              │  │              │  │              │             │
│  │  [DATA]      │  │  [DATA]      │  │  [DATA]      │             │
│  │  Partition0  │  │  Partition4  │  │  Partition8  │             │
│  │  Partition1  │  │  Partition5  │  │  Partition9  │             │
│  │  Partition2  │  │  Partition6  │  │  Partition10 │             │
│  │  Partition3  │  │  Partition7  │  │  Partition11 │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────────────────────────────────────────────┘`,
              caption: 'The Driver coordinates. Executors hold data and do computation.',
            },
            {
              type: 'key-concept',
              term: 'Driver',
              definition:
                'The single JVM process running your Python/Scala code. It builds the query plan, schedules tasks, and tracks progress. It does NOT process data — it tells executors what to do. Crashes in the driver kill the entire application.',
              analogy:
                'A restaurant manager who designs the menu (query plan) and tells cooks (executors) what to make. The manager never cooks — they coordinate.',
            },
            {
              type: 'key-concept',
              term: 'Executor',
              definition:
                'JVM worker processes launched on cluster nodes. They hold data partitions in memory, execute tasks, and return results to the driver. If an executor fails, Spark restarts it and recomputes its partitions from the lineage.',
              analogy:
                'The cooks in the kitchen. Each cook works on their section of the menu simultaneously. If one cook quits, the manager (driver) assigns their tasks to another cook.',
            },
            {
              type: 'callout',
              variant: 'danger',
              title: 'The Most Common Spark Bug: Bringing Data to the Driver',
              content:
                'df.collect(), df.toPandas(), and df.toLocalIterator() pull ALL data from executors to the driver\'s RAM. A 100GB DataFrame will crash a 16GB driver immediately. Always filter, aggregate, or limit BEFORE collecting. The driver is not for data — it is for coordination.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Safe vs dangerous driver operations',
              content: `# ❌ DANGEROUS: Collecting large DataFrames to driver
df = spark.read.parquet("s3://bucket/events/")  # 500GB
rows = df.collect()       # ← CRASH: 500GB → 16GB driver RAM
pdf  = df.toPandas()      # ← CRASH: same reason

# ✅ SAFE: Aggregate first, then collect the small result
summary = (df
    .groupBy("region")
    .agg(count("*").alias("total"), sum("revenue").alias("revenue"))
    .collect()   # 10 rows → perfectly safe
)

# ✅ SAFE: Limit before collecting
sample = df.limit(1000).toPandas()  # 1000 rows → safe

# ✅ SAFE: Write large results to storage, not to driver
df.write.parquet("s3://bucket/output/")  # stays on executors`,
            },
          ],
        },
        {
          id: 'sparksession-deep',
          title: 'SparkSession and SparkContext',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'paragraph',
              content:
                'SparkSession is the single entry point to all Spark functionality since Spark 2.0. It combines the old SQLContext, HiveContext, and SparkContext into one unified object. When you create a SparkSession, you start the driver process and connect it to a cluster.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Production SparkSession configuration',
              content: `from pyspark.sql import SparkSession

spark = (SparkSession.builder
    # ── Identity ──────────────────────────────────────────────────────
    .appName("DailyRevenueETL")        # Shown in Spark UI
    .master("yarn")                    # yarn / k8s / local[*]

    # ── Executor resources ────────────────────────────────────────────
    .config("spark.executor.instances",    "50")      # 50 executors
    .config("spark.executor.cores",        "4")       # 4 cores each
    .config("spark.executor.memory",       "8g")      # 8GB RAM each
    .config("spark.executor.memoryOverhead","2g")     # off-heap (Python/containers)
    .config("spark.driver.memory",         "4g")      # driver RAM

    # ── Serialization ─────────────────────────────────────────────────
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")

    # ── Shuffle tuning ────────────────────────────────────────────────
    .config("spark.sql.shuffle.partitions",  "400")   # 2-4x total cores
    .config("spark.default.parallelism",     "400")   # for RDD operations

    # ── Adaptive Query Execution (Spark 3.x) ─────────────────────────
    .config("spark.sql.adaptive.enabled",                        "true")
    .config("spark.sql.adaptive.coalescePartitions.enabled",     "true")
    .config("spark.sql.adaptive.skewJoin.enabled",               "true")
    .config("spark.sql.adaptive.advisoryPartitionSizeInBytes",   "134217728")  # 128MB

    # ── Join optimization ─────────────────────────────────────────────
    .config("spark.sql.autoBroadcastJoinThreshold",  str(50 * 1024 * 1024))  # 50MB

    # ── Delta Lake ────────────────────────────────────────────────────
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")

    .getOrCreate()
)

sc = spark.sparkContext  # lower-level RDD API (rarely needed directly)
sc.setLogLevel("WARN")   # reduce log noise`,
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Always use getOrCreate()',
              content:
                'getOrCreate() returns an existing SparkSession if one already exists in the JVM. This is critical in: (1) Notebooks — prevents creating duplicate sessions when re-running cells. (2) Test suites — lets tests share one session instead of starting/stopping for each test. (3) Libraries — your library code should not assume it owns the session.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Accessing and modifying session config at runtime',
              content: `# Read current config
print(spark.conf.get("spark.sql.shuffle.partitions"))  # "400"

# Change config at runtime (most SQL configs are mutable)
spark.conf.set("spark.sql.shuffle.partitions", "800")

# Check if AQE is enabled
print(spark.conf.get("spark.sql.adaptive.enabled"))  # "true"

# Get all configs with a prefix
for key, val in spark.sparkContext.getConf().getAll():
    if "adaptive" in key:
        print(f"{key} = {val}")`,
            },
          ],
        },
        {
          id: 'execution-hierarchy',
          title: 'Jobs, Stages, and Tasks',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Spark\'s execution model has three levels: Jobs, Stages, and Tasks. Understanding this hierarchy is essential for reading the Spark UI and diagnosing performance problems.',
            },
            {
              type: 'diagram',
              title: 'Execution hierarchy',
              content: `
APPLICATION
└── JOB (triggered by one action: count(), show(), write(), etc.)
    └── STAGE (group of tasks with no shuffle between them)
        ├── STAGE 1: Read + Filter + Select    (no shuffle needed)
        │   ├── Task 1 → processes Partition 0
        │   ├── Task 2 → processes Partition 1
        │   ├── Task 3 → processes Partition 2
        │   └── Task N → processes Partition N
        │
        │   [SHUFFLE BOUNDARY: groupBy requires data redistribution]
        │
        └── STAGE 2: GroupBy + Aggregate      (after shuffle)
            ├── Task 1 → aggregates all "US" rows
            ├── Task 2 → aggregates all "EU" rows
            └── Task 3 → aggregates all "APAC" rows

Key rule: A new Stage starts whenever a shuffle is required.
All Tasks in a Stage run in parallel. Stages run sequentially.`,
              caption: 'Tasks are parallel. Stages are sequential. A Job completes when all Stages finish.',
            },
            {
              type: 'key-concept',
              term: 'Job',
              definition:
                'Created by each Action (count, show, write, collect). One action = one job. A complex pipeline with 3 write() calls creates 3 jobs.',
            },
            {
              type: 'key-concept',
              term: 'Stage',
              definition:
                'A group of tasks that can execute without a shuffle. Each shuffle boundary creates a new stage. Stages within a job run sequentially (each waits for the previous to finish).',
            },
            {
              type: 'key-concept',
              term: 'Task',
              definition:
                'The smallest unit of work. One task processes one partition on one executor core. If you have 400 partitions and 200 cores, Spark runs 200 tasks simultaneously, then another 200.',
            },
            {
              type: 'callout',
              variant: 'insight',
              title: 'Why Spark UI shows "Stage 2 is slow"',
              content:
                'Stage 2 being slow almost always means: (1) shuffle is taking too long — too much data moved across network, or (2) one task is processing 10x more data than others — data skew. Check Stage 2\'s "Input Size" vs "Shuffle Read Size" in the UI.',
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 3 — LAZY EVALUATION & DAG
    // ═══════════════════════════════════════════════
    {
      id: 'execution-model',
      number: 3,
      title: 'Lazy Evaluation, DAG & Catalyst',
      description: 'How Spark builds and optimizes query plans before running anything.',
      totalMinutes: 16,
      sections: [
        {
          id: 'lazy-eval',
          title: 'Lazy Evaluation — Nothing Runs Until You Ask',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'callout',
              variant: 'insight',
              title: 'The Most Important Concept in PySpark',
              content:
                'Calling filter(), select(), groupBy(), join(), withColumn() does NOT process any data. These are lazy transformations that record your intent into a query plan. Spark only executes when you call an Action: show(), count(), collect(), write(). This enables global optimization before any work starts.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Lazy evaluation in practice',
              content: `import time
from pyspark.sql.functions import col, sum, year

# ALL of these are INSTANT — no data is read or processed
start = time.time()

df = spark.read.parquet("s3://bucket/events/")  # records: "read from here"
df = df.filter(col("country") == "US")          # records: "apply this filter"
df = df.filter(col("amount") > 100)             # records: "apply this too"
df = df.select("user_id", "amount", "date")     # records: "keep these columns"
df = df.withColumn("year", year(col("date")))   # records: "add this column"
df = df.groupBy("user_id", "year")             # records: "group by these"
df = df.agg(sum("amount").alias("total"))       # records: "aggregate like this"

print(f"Plan built in: {time.time() - start:.3f}s")  # ~0.001 seconds

# THIS triggers execution — Spark now reads data, filters, aggregates
start = time.time()
result = df.collect()  # ← EXECUTION HAPPENS HERE
print(f"Execution in: {time.time() - start:.1f}s")   # ~30 seconds on large data`,
            },
            {
              type: 'paragraph',
              content:
                'Why does lazy evaluation matter? Because Spark can see the ENTIRE pipeline before executing any of it. The Catalyst optimizer can then apply transformations that a row-by-row eager system could not — like pushing the filter before the join, or reading only the columns you actually use from Parquet files.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'What Catalyst actually does to your plan',
              content: `# You write this (logically):
result = (
    large_events                          # 1 billion rows
    .join(users, "user_id")               # join with 10M users
    .filter(col("country") == "US")       # then filter
    .select("user_id", "event_type")      # then select columns
)

# Catalyst rewrites it to this (optimized):
# 1. Read ONLY "user_id" and "event_type" columns from Parquet (column pruning)
# 2. Apply filter "country == US" at READ TIME on Parquet (predicate pushdown)
# 3. Broadcast the users table if it fits in memory (join optimization)
# 4. Join the pre-filtered, pre-projected data

# To see what Catalyst actually produces:
result.explain("formatted")
# Look for: "PushedFilters", "ReadSchema" (only selected cols), "BroadcastHashJoin"`,
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Practical implication: Order your code for readability, not performance',
              content:
                'Because Catalyst reorders operations, you do NOT need to manually put filters before joins in your code for performance. Write your code in the most readable logical order. Catalyst will optimize. That said, extremely complex pipelines benefit from explicit early filtering to help the optimizer.',
            },
          ],
        },
        {
          id: 'catalyst',
          title: 'Catalyst Optimizer — The Four Phases',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Catalyst is Spark\'s query optimizer. It transforms your code through four phases. You interact with Phase 1; Phases 2-4 are automatic. Understanding what each phase does helps you write code that optimizes well.',
            },
            {
              type: 'diagram',
              title: 'Catalyst\'s four phases',
              content: `
Phase 1: ANALYSIS
  Your code → Unresolved Plan → Resolved Logical Plan
  - Column names resolved against the schema
  - Types checked and inferred
  - UDFs registered
  Example: "amount" → validates it exists and is DoubleType

Phase 2: LOGICAL OPTIMIZATION
  Resolved Plan → Optimized Logical Plan
  Rules applied:
  ✦ Predicate Pushdown  → move filters closer to data source
  ✦ Constant Folding    → "2024" - 1 → "2023" at plan time
  ✦ Column Pruning      → remove unneeded columns early
  ✦ Boolean Simplification → NOT(NOT(x)) → x

Phase 3: PHYSICAL PLANNING
  Logical Plan → Physical Plan(s) → Best Physical Plan
  Choices made:
  ✦ Join strategy: BroadcastHash? SortMerge? Shuffle Hash?
  ✦ Aggregation: Hash aggregate or Sort aggregate?
  ✦ Scan type: Parquet with predicate pushdown?

Phase 4: CODE GENERATION (Tungsten)
  Physical Plan → JVM bytecode
  - Avoids virtual function calls (10x speedup)
  - SIMD-friendly CPU instructions
  - Keeps data in CPU cache as long as possible`,
              caption: 'You write Phase 1. Catalyst handles 2-4 automatically.',
            },
            {
              type: 'table',
              headers: ['Optimization', 'What happens', 'Speed impact'],
              rows: [
                ['Predicate Pushdown', 'filter(year=2024) pushed into Parquet file scan → skips irrelevant row groups', '2-10x'],
                ['Column Pruning', 'select("a","b") → only columns a and b read from Parquet files', '2-5x'],
                ['Constant Folding', 'filter(1+1 == 2) → always true → removed entirely', 'tiny'],
                ['Broadcast Join', 'Small table replicated to all executors → no shuffle', '5-50x for small tables'],
                ['AQE Coalescing', 'Many small shuffle partitions merged into fewer larger ones', '1.5-3x'],
                ['AQE Skew Fix', 'Skewed partition split into balanced sub-partitions', '5-100x for skewed jobs'],
              ],
            },
            {
              type: 'code',
              language: 'python',
              label: 'Verifying optimizations are applied — reading explain()',
              content: `df = (spark.read.parquet("s3://bucket/orders/")
    .filter(col("year") == 2024)
    .filter(col("country") == "US")
    .select("order_id", "amount", "country")
)

df.explain("formatted")

# Good signs to look for in the output:
# ✅ "PushedFilters: [IsNotNull(year), EqualTo(year,2024), EqualTo(country,US)]"
#    → Filter pushed into Parquet scan — rows skipped at file level
#
# ✅ "ReadSchema: struct<order_id:string, amount:double, country:string>"
#    → Only 3 columns read (not all 50 columns in the Parquet file)
#
# ✅ "BroadcastHashJoin" (after a join with a small table)
#    → Small table broadcast — no shuffle needed
#
# ❌ "SortMergeJoin" (after joining two large tables)
#    → Both sides shuffled — expensive but sometimes unavoidable
#
# ❌ "Exchange hashpartitioning" without AQE
#    → Shuffle happening — check if it can be avoided`,
            },
          ],
        },
        {
          id: 'tungsten',
          title: 'Tungsten — Under-the-Hood Performance',
          estimatedMinutes: 4,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Tungsten is Spark\'s execution engine introduced in Spark 1.4. It bypasses Java\'s JVM overhead to make computation as fast as the hardware allows. You do not interact with Tungsten directly, but understanding it explains why native Spark functions are dramatically faster than Python UDFs.',
            },
            {
              type: 'table',
              headers: ['Tungsten Feature', 'What it does', 'Why it matters'],
              rows: [
                ['Off-heap memory', 'Stores binary data outside JVM heap', 'Eliminates GC pressure on large datasets'],
                ['Whole-stage codegen', 'Compiles entire query stage to JVM bytecode', '5-10x faster than interpreted execution'],
                ['Vectorized execution', 'Processes data in 1024-row batches (like Arrow)', 'CPU cache efficiency; SIMD instructions'],
                ['Cache-aware algorithms', 'Sorts data that fits in CPU L1/L2 cache', 'Avoids slow RAM lookups'],
                ['Binary format', 'Data stored as raw bytes, not Java objects', '2-5x less memory; no serialization cost'],
              ],
            },
            {
              type: 'callout',
              variant: 'danger',
              title: 'Why UDFs break Tungsten',
              content:
                'When you call a Python UDF, Spark must: (1) serialize each row from JVM binary format → Python pickle format, (2) send data to Python interpreter via socket, (3) execute your Python function row by row, (4) serialize result back → JVM binary format. This completely bypasses Tungsten, Whole-stage codegen, and vectorized execution. The result is 10-100x slower than equivalent native Spark functions.',
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 4 — SHUFFLES IN DEPTH
    // ═══════════════════════════════════════════════
    {
      id: 'shuffles',
      number: 4,
      title: 'Shuffles — The Performance Killer',
      description: 'What shuffles are, what triggers them, and every technique to minimize them.',
      totalMinutes: 20,
      sections: [
        {
          id: 'what-is-shuffle',
          title: 'What is a Shuffle?',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'paragraph',
              content:
                'A shuffle is the redistribution of data across executor nodes. It happens when Spark needs to group together rows that currently live on different machines — because the operation requires all rows with the same key to be on the same executor.',
            },
            {
              type: 'diagram',
              title: 'A groupBy shuffle — step by step',
              content: `
You run: df.groupBy("country").agg(sum("revenue"))

BEFORE SHUFFLE:
  Exec 1: [US:$100] [EU:$50]  [US:$200] [APAC:$300]
  Exec 2: [EU:$150] [US:$400] [APAC:$100] [EU:$200]
  Exec 3: [APAC:$500] [US:$50] [EU:$100] [US:$300]

Problem: US rows are on Exec 1, 2, AND 3.
         Can't compute sum(US) without all US rows together.

SHUFFLE PHASE 1 — Map side (write):
  Each executor hashes each row's key (country):
    hash("US")   % 3 = 0  → goes to Exec 1's shuffle files
    hash("EU")   % 3 = 1  → goes to Exec 2's shuffle files
    hash("APAC") % 3 = 2  → goes to Exec 3's shuffle files

SHUFFLE PHASE 2 — Reduce side (read):
  Exec 1 reads ALL "US" shuffle files from Exec 1, 2, 3
  Exec 2 reads ALL "EU" shuffle files from Exec 1, 2, 3
  Exec 3 reads ALL "APAC" shuffle files from Exec 1, 2, 3

AFTER SHUFFLE:
  Exec 1: ALL US rows   → sum = $1,050
  Exec 2: ALL EU rows   → sum = $500
  Exec 3: ALL APAC rows → sum = $900

What just happened on the network: Every executor talked to every other executor.
On a 100-node cluster: 100 × 100 = 10,000 network connections opened.`,
              caption: 'Every shuffle = disk write + network transfer + disk read. On 1TB datasets this takes minutes.',
            },
            {
              type: 'callout',
              variant: 'danger',
              title: 'The true cost of a shuffle',
              content:
                'A shuffle involves: (1) Writing shuffle map output files to disk on all executors, (2) Transferring data across the network from all executors to all other executors, (3) Reading shuffle files from disk on the receiving side, (4) Sorting data by key on the reduce side. On a 100-node cluster processing 1TB, a shuffle might move 500GB across the network. This alone can take 5-10 minutes.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Identifying shuffles in your pipeline',
              content: `df = spark.read.parquet("s3://bucket/events/")

# Check which operations trigger shuffles
df.filter("amount > 100").explain()
# → No "Exchange" in plan = NO SHUFFLE ✅

df.groupBy("country").count().explain()
# → "Exchange hashpartitioning(country)" = SHUFFLE ❌ (expected)

df.orderBy("amount").explain()
# → "Exchange rangepartitioning(amount)" = SHUFFLE ❌

df.join(other_df, "user_id").explain()
# → "Exchange hashpartitioning(user_id)" on BOTH sides = 2 SHUFFLES ❌

df.join(broadcast(small_df), "user_id").explain()
# → "BroadcastHashJoin" = NO SHUFFLE on small_df side ✅`,
            },
          ],
        },
        {
          id: 'shuffle-partitions-tuning',
          title: 'Tuning shuffle.partitions — The #1 Config',
          estimatedMinutes: 7,
          blocks: [
            {
              type: 'paragraph',
              content:
                'spark.sql.shuffle.partitions controls how many output partitions are created after every shuffle. Default is 200. This is wrong for virtually every real workload. It is too low for large clusters (huge partitions → OOM) and too high for small workloads (thousands of tiny tasks → overhead).',
            },
            {
              type: 'diagram',
              title: 'Effect of shuffle partition count on a 100GB job',
              content: `
Too FEW — e.g., 10 partitions after shuffle:
  Each partition = 100GB / 10 = 10GB
  Executor RAM = 8GB
  → OOM: partition doesn't fit in memory
  → Spill to disk: 100x slower than RAM
  [██████████ 10GB ██████████] Task 1 → OOM / slow spill
  [██████████ 10GB ██████████] Task 2 → OOM / slow spill

Goldilocks — e.g., 400 partitions:
  Each partition = 100GB / 400 = 250MB
  Executor RAM = 8GB → fits 32 partitions comfortably
  [██ 250MB ██] [██ 250MB ██] × 400 → fast, efficient

Too MANY — e.g., 20,000 partitions:
  Each partition = 100GB / 20000 = 5MB
  Task overhead > execution time
  [▏5MB] [▏5MB] [▏5MB] × 20,000 → scheduler drowns in tiny tasks
  
Target: 128MB – 1GB per partition after shuffle`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Tuning shuffle partitions — practical approaches',
              content: `# ── Approach 1: Formula-based ─────────────────────────────────────────
# Rule of thumb: total executor cores × 2 to 4
executors    = 50
cores_each   = 4
total_cores  = executors * cores_each   # 200 cores

# Light jobs: 2x cores, heavy jobs: 4x cores
spark.conf.set("spark.sql.shuffle.partitions", str(total_cores * 3))  # 600


# ── Approach 2: Data-size based ───────────────────────────────────────
# Target partition size: 256MB
data_size_gb       = 500
target_part_mb     = 256
target_parts       = int(data_size_gb * 1024 / target_part_mb)  # 2048
spark.conf.set("spark.sql.shuffle.partitions", str(target_parts))


# ── Approach 3: Let AQE handle it (Spark 3.x best practice) ──────────
spark.conf.set("spark.sql.adaptive.enabled",                    "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.advisoryPartitionSizeInBytes", str(256 * 1024 * 1024))

# Start high — AQE will coalesce small ones down
spark.conf.set("spark.sql.shuffle.partitions", "2000")
# AQE might reduce this to 400 after seeing actual data sizes


# ── Approach 4: Per-query override for mixed workloads ────────────────
# Heavy job: use more partitions
spark.conf.set("spark.sql.shuffle.partitions", "1000")
heavy_result = big_df.groupBy("user_id").agg(...)

# Light job: use fewer partitions
spark.conf.set("spark.sql.shuffle.partitions", "50")
light_result = small_df.groupBy("country").count()`,
            },
            {
              type: 'callout',
              variant: 'insight',
              title: 'AQE Partition Coalescing — The Automatic Fix',
              content:
                'With spark.sql.adaptive.coalescePartitions.enabled=true, Spark starts with a high shuffle partition count, then at runtime merges small partitions together. Set shuffle.partitions to 3-5x your expected target and let AQE collapse excess tiny partitions. This removes the guesswork entirely.',
            },
          ],
        },
        {
          id: 'avoiding-shuffles',
          title: 'Techniques to Minimize Shuffles',
          estimatedMinutes: 7,
          blocks: [
            {
              type: 'paragraph',
              content:
                'The best shuffle is one that never happens. Here are every technique for reducing or eliminating shuffles:',
            },
            {
              type: 'numbered-list',
              items: [
                'Filter aggressively before any join or groupBy — every removed row is a row not shuffled',
                'Use broadcast joins for any table < 50-100MB — eliminates the shuffle on the small side',
                'Pre-aggregate before joining — if you need SUM per user, aggregate first, then join',
                'Bucket your data on disk by join key — co-partitioned tables join without shuffling',
                'Use repartition(n, "join_key") before multiple joins on the same key — one shuffle, many joins',
                'Use coalesce() not repartition() when reducing partition count — no shuffle',
                'Avoid orderBy() unless absolutely required — a global sort is the most expensive shuffle',
                'Use sortWithinPartitions() instead of orderBy() when you only need local order',
                'Enable AQE — it automatically converts sort-merge joins to broadcast joins at runtime',
              ],
            },
            {
              type: 'code',
              language: 'python',
              label: 'Pre-aggregation before join — a critical pattern',
              content: `# ❌ SLOW: Join 1B rows to 100M rows, THEN aggregate
result = (
    events_1B            # 1 billion rows
    .join(users_100M, "user_id")
    .groupBy("country")
    .agg(sum("revenue"))
)
# Shuffle: 1B rows moved to co-locate with user data
# Then shuffle again for groupBy
# Total: 2 shuffles of large data

# ✅ FAST: Pre-aggregate, THEN join small result to users
user_revenue = (
    events_1B
    .groupBy("user_id")          # shuffle 1B rows → shuffle once
    .agg(sum("revenue").alias("revenue"))
    # result: 50M rows (one per user)
)

result = (
    user_revenue                 # 50M rows
    .join(broadcast(users_100M.select("user_id", "country")), "user_id")
    .groupBy("country")
    .agg(sum("revenue"))
    # broadcast join: NO shuffle. tiny final groupBy: fast shuffle
)
# Total: 1 large shuffle + 1 tiny shuffle = 50% less shuffled data`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Bucketing — eliminate shuffles for repeated joins',
              content: `# Write both tables bucketed by the join key
# Do this ONCE — pays off on every future join

orders.write \
    .bucketBy(200, "customer_id") \
    .sortBy("customer_id") \
    .saveAsTable("orders_bucketed")

customers.write \
    .bucketBy(200, "customer_id") \
    .sortBy("customer_id") \
    .saveAsTable("customers_bucketed")

# Now every future join on customer_id skips the shuffle entirely
orders_b   = spark.table("orders_bucketed")
customers_b = spark.table("customers_bucketed")

# Spark detects matching bucket layout → SortMergeJoin WITHOUT shuffle
result = orders_b.join(customers_b, "customer_id")
result.explain()
# → "SortMergeJoin" with NO "Exchange" before it  ← no shuffle!`,
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 5 — MEMORY MANAGEMENT
    // ═══════════════════════════════════════════════
    {
      id: 'memory',
      number: 5,
      title: 'Memory Management',
      description: 'Executor memory layout, spill to disk, OOM errors, caching strategy.',
      totalMinutes: 18,
      sections: [
        {
          id: 'executor-memory',
          title: 'Executor Memory Layout',
          estimatedMinutes: 7,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Every executor has a fixed amount of RAM, divided into carefully managed regions. Misunderstanding this layout leads to OOM errors, excessive GC pauses, and performance degradation. Here is what actually lives in your executor\'s memory:',
            },
            {
              type: 'diagram',
              title: 'Executor memory layout — 10GB executor example',
              content: `
spark.executor.memory = 10g
spark.executor.memoryOverhead = 2g  (off-heap; containers, Python)
────────────────────────────────────────────────────────────────────
Total container memory = 12g

INSIDE the 10g JVM heap:
┌───────────────────────────────────────────────────────────────┐
│ RESERVED: 300MB (fixed)                                       │
│ → Spark internal objects, system overhead                     │
├───────────────────────────────────────────────────────────────┤
│ USABLE MEMORY = (10g - 300MB) = 9.7g                         │
│                                                               │
│ UNIFIED MEMORY = 9.7g × spark.memory.fraction (0.6)          │
│               = 5.82g                                         │
│ ┌─────────────────────────┬─────────────────────────────────┐ │
│ │  EXECUTION: 50%         │  STORAGE: 50%                   │ │
│ │  = 2.91g                │  = 2.91g                        │ │
│ │                         │                                 │ │
│ │  Shuffles               │  df.cache()                     │ │
│ │  Hash joins             │  df.persist()                   │ │
│ │  Sort operations        │  Broadcast tables               │ │
│ │  Aggregations           │  RDD cache                      │ │
│ │                         │                                 │ │
│ │  ↕ Can borrow from      │  ↕ Can borrow from              │ │
│ │    storage region       │    execution region             │ │
│ └─────────────────────────┴─────────────────────────────────┘ │
│                                                               │
│ USER MEMORY = 9.7g × (1 - 0.6) = 3.88g                      │
│ → Your Python objects, custom data structures, UDF state      │
└───────────────────────────────────────────────────────────────┘

OUTSIDE the JVM heap (off-heap):
┌───────────────────────────────────────────────────────────────┐
│ spark.executor.memoryOverhead = 2g                            │
│ → Python worker process (PySpark)                             │ 
│ → Container overhead, NIO buffers, JVM overhead               │
│ → Pandas UDF data exchange (Arrow buffers)                    │
└───────────────────────────────────────────────────────────────┘`,
              caption: 'The unified memory region dynamically borrows between execution and storage.',
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'PySpark needs extra overhead memory',
              content:
                'In PySpark, each executor spawns a Python worker process that lives OUTSIDE the JVM heap. This Python process needs RAM for your code and data. Always set spark.executor.memoryOverhead to at least 1-2GB when using PySpark. Without it, containers are killed by YARN/Kubernetes for exceeding memory limits — which looks like executor loss, not OOM.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Tuning memory configuration',
              content: `# For CPU-heavy jobs with small data per partition
spark.conf.set("spark.executor.memory",         "8g")
spark.conf.set("spark.executor.memoryOverhead",  "1g")   # Python overhead
spark.conf.set("spark.memory.fraction",          "0.6")  # default — fine
spark.conf.set("spark.memory.storageFraction",   "0.3")  # less cache, more execution

# For jobs that cache a lot of data (e.g., iterative ML)
spark.conf.set("spark.memory.storageFraction",   "0.7")  # more cache

# For jobs with very large shuffles (joins of TB-scale data)
spark.conf.set("spark.executor.memory",          "16g")
spark.conf.set("spark.memory.fraction",          "0.7")  # more unified memory
spark.conf.set("spark.memory.storageFraction",   "0.3")  # less cache, more shuffle

# For Pandas UDF heavy workloads (large Arrow buffers needed)
spark.conf.set("spark.executor.memoryOverhead",  "4g")   # bigger overhead`,
            },
          ],
        },
        {
          id: 'spill',
          title: 'Spill to Disk — When Memory Runs Out',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'paragraph',
              content:
                'When an operation (sort, shuffle map, hash join, aggregation) needs more execution memory than available, Spark spills excess data to disk. Spilling is safer than crashing, but disk I/O is 100-1000x slower than RAM. Heavy spilling means your partition sizes are too large for the available memory.',
            },
            {
              type: 'diagram',
              title: 'Spill to disk flow',
              content: `
Operation: Sort 2GB of data on an executor with 1GB execution memory

Round 1:
  Read 1GB into memory → sort in-memory → write sorted run to disk
  Spill file 1: sorted_run_1.tmp (1GB on disk)

Round 2:
  Read next 1GB into memory → sort in-memory → write sorted run to disk
  Spill file 2: sorted_run_2.tmp (1GB on disk)

Merge phase:
  Read both sorted spill files → merge sort → final sorted output

Cost:
  Without spill: 2GB processed in RAM → very fast
  With spill:    2GB written to disk + 2GB read from disk + merge pass
                 → 4GB extra disk I/O → 10-100x slower`,
              caption: 'Spill = extra disk writes and reads. Avoid by tuning partition sizes.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Detecting and fixing spill',
              content: `# ── Detecting spill ──────────────────────────────────────────────────
# Spark UI: Stages tab → look at "Shuffle Spill (Memory)" and 
# "Shuffle Spill (Disk)" columns. If disk spill > 0, you have a problem.

# In logs, look for:
# "Spilling data because of memory pressure" 

# ── Fix 1: Increase executor memory ──────────────────────────────────
spark.conf.set("spark.executor.memory", "16g")   # give executors more RAM

# ── Fix 2: Increase shuffle partitions → smaller partitions ──────────
# If each post-shuffle partition is 2GB and executor has 1GB execution:
# → Set shuffle.partitions 4x higher so each partition is 500MB
spark.conf.set("spark.sql.shuffle.partitions", "2000")  # was 500

# ── Fix 3: Check for data skew ────────────────────────────────────────
# One partition 10x larger than others → one executor spills, rest idle
# Fix: see Chapter 9 on data skew

# ── Fix 4: Increase execution memory fraction ─────────────────────────
# Less cache, more execution memory
spark.conf.set("spark.memory.fraction",        "0.7")   # default 0.6
spark.conf.set("spark.memory.storageFraction", "0.2")   # default 0.5 of fraction`,
            },
          ],
        },
        {
          id: 'caching-strategy',
          title: 'Cache and Persist — When and How',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Cache stores a DataFrame in memory so subsequent actions reuse it without recomputing from scratch. Used correctly, caching is a major speedup. Used incorrectly, it wastes memory and slows other operations.',
            },
            {
              type: 'callout',
              variant: 'insight',
              title: 'The Golden Rule of Caching',
              content:
                'Cache a DataFrame only if you use it 3+ times in your pipeline AND the computation to produce it is expensive (large read, complex joins, etc.). Never cache a DataFrame you use once — it wastes memory with no benefit.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Caching patterns and storage levels',
              content: `from pyspark import StorageLevel

# ── Basic cache (MEMORY_AND_DISK) ─────────────────────────────────────
# Safe default: tries memory first, spills to disk if needed
df_base = (spark.read.parquet("s3://bucket/events/")
    .filter(col("year") == 2024)
    .join(broadcast(lookup_table), "category")
    .cache()    # equivalent to persist(MEMORY_AND_DISK)
)

# IMPORTANT: cache() is lazy. Force it to materialize now:
df_base.count()   # triggers computation and caches the result
# Without .count(), data is only cached when the first action runs

# ── Reuse the cached DataFrame multiple times ─────────────────────────
count_by_region  = df_base.groupBy("region").count()        # uses cache ✅
count_by_product = df_base.groupBy("product").count()       # uses cache ✅
avg_revenue      = df_base.agg(avg("revenue"))              # uses cache ✅
top_users        = df_base.orderBy("revenue", asc=False)    # uses cache ✅

# ── Always unpersist when done ────────────────────────────────────────
df_base.unpersist()   # free memory for other operations

# ── Storage levels explained ──────────────────────────────────────────
# MEMORY_ONLY: fastest read, but evicts if OOM (data must be recomputed)
df.persist(StorageLevel.MEMORY_ONLY)

# MEMORY_AND_DISK: safe default — spills to disk on OOM
df.persist(StorageLevel.MEMORY_AND_DISK)

# MEMORY_ONLY_SER: compressed in-memory (less RAM, slower read)
df.persist(StorageLevel.MEMORY_ONLY_SER)

# DISK_ONLY: slowest, never evicted, good for large rarely-used data
df.persist(StorageLevel.DISK_ONLY)

# MEMORY_AND_DISK_2: replicated — survives one executor failure
df.persist(StorageLevel.MEMORY_AND_DISK_2)`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Cache anti-patterns — what NOT to do',
              content: `# ❌ Anti-pattern 1: Cache then use only once
df.cache()
df.count()   # only one action → cache wasted memory
df.unpersist()

# ❌ Anti-pattern 2: Forget to unpersist
for partition_date in date_range:
    df = spark.read.parquet(f"s3://bucket/{partition_date}/")
    df.cache()
    process(df)
    # df never unpersisted! Each iteration adds to cache → OOM after N iterations
    
# ✅ Fix:
for partition_date in date_range:
    df = spark.read.parquet(f"s3://bucket/{partition_date}/")
    df.cache()
    df.count()   # materialize
    process(df)
    df.unpersist()   # free before next iteration

# ❌ Anti-pattern 3: Cache after a transformations that changes
# the data (result won't reflect later changes to source)
df_source = spark.read.parquet("s3://bucket/live_data/")
df_processed = df_source.filter(...).cache()
# If s3://bucket/live_data/ updates, the cache holds the old data
# Must unpersist and recompute to get fresh data`,
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 6 — JOINS IN DEPTH
    // ═══════════════════════════════════════════════
    {
      id: 'joins',
      number: 6,
      title: 'Joins Deep Dive',
      description: 'Every join strategy Spark uses, when each applies, and how to force the right one.',
      totalMinutes: 18,
      sections: [
        {
          id: 'join-strategies',
          title: 'Spark\'s Four Join Strategies',
          estimatedMinutes: 8,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Spark chooses from four physical join implementations based on table sizes, available memory, and your hints. Knowing which strategy is used (and why) is the key to fixing slow joins.',
            },
            {
              type: 'table',
              headers: ['Strategy', 'When used', 'Shuffle?', 'Speed', 'Memory'],
              rows: [
                ['BroadcastHashJoin', 'One table < autoBroadcastJoinThreshold (default 10MB)', 'No (small side)', '🚀 Fastest', '⚠️ Small table must fit in each executor'],
                ['ShuffleHashJoin', 'One side can fit in executor memory after shuffle', 'Yes (one side)', '✅ Fast', '⚠️ Medium'],
                ['SortMergeJoin', 'Both tables large; default for big-big joins', 'Yes (both sides)', '🐌 Slower', '✅ Low'],
                ['BroadcastNestedLoopJoin', 'No join key (cross join or non-equi join)', 'No', '🐌🐌 Very slow', '⚠️ Dangerous'],
              ],
            },
            {
              type: 'diagram',
              title: 'BroadcastHashJoin — the fast path',
              content: `
How BroadcastHashJoin works:

1. Driver collects the SMALL table (e.g., 5MB lookup table)
2. Driver broadcasts a copy to EVERY executor
3. Each executor builds a hash map of the small table in memory
4. Each executor scans its partition of the LARGE table
5. For each row, look up the join key in the local hash map → instant match

Benefit: The large table NEVER moves. Only the small table is broadcast.
         No shuffle at all on the large table side.

Result: Large table (500GB) stays in place
        Small table (5MB) copied to 50 executors
        Total data moved: 5MB × 50 = 250MB  ← MUCH less than shuffling 500GB`,
              caption: 'BroadcastHashJoin is 5-50x faster than SortMergeJoin for small-large joins.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Controlling join strategy with hints',
              content: `from pyspark.sql.functions import broadcast

# ── BroadcastHashJoin — explicit hint ────────────────────────────────
# Always use when you KNOW one side is small (< 100MB)
result = large_orders.join(
    broadcast(small_lookup),    # hint to broadcast this table
    "region_code",
    "left"
)

# ── Force BroadcastHashJoin via config ───────────────────────────────
# Raise threshold so Spark auto-broadcasts tables up to 50MB
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", str(50 * 1024 * 1024))

# Disable auto-broadcast (force SortMergeJoin — useful for testing)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "-1")

# ── SortMergeJoin hint ────────────────────────────────────────────────
result = df1.hint("MERGE").join(df2, "key")   # force sort-merge

# ── ShuffleHashJoin hint ──────────────────────────────────────────────
result = df1.hint("SHUFFLE_HASH").join(df2, "key")

# ── Verify which strategy was chosen ─────────────────────────────────
result.explain("formatted")
# Look for: BroadcastHashJoin, SortMergeJoin, ShuffleHashJoin`,
            },
          ],
        },
        {
          id: 'join-best-practices',
          title: 'Join Best Practices and Pitfalls',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'callout',
              variant: 'danger',
              title: 'Pitfall: Joining on nullable columns',
              content:
                'In SQL semantics (and PySpark), NULL != NULL. If both tables have NULL in the join key, those rows will NOT match. This silently drops data. Always filter nulls from join keys before joining, or handle nulls explicitly.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Join pitfalls and fixes',
              content: `# ── Pitfall 1: NULL join keys (silent data loss) ─────────────────────
# ❌ WRONG: NULL keys silently excluded
result = df1.join(df2, "customer_id")
# If customer_id is NULL in either table → rows are dropped silently

# ✅ FIX: Filter nulls before joining (and understand why they exist)
df1_clean = df1.filter(col("customer_id").isNotNull())
df2_clean = df2.filter(col("customer_id").isNotNull())
result    = df1_clean.join(df2_clean, "customer_id")

# ── Pitfall 2: Duplicate column names after join ──────────────────────
# ❌ WRONG: Both tables have "date" column → ambiguous after join
result = orders.join(returns, "order_id")
result.select("date")  # AnalysisException: ambiguous reference

# ✅ FIX: Rename before joining, or select with table alias
result = (
    orders.withColumnRenamed("date", "order_date")
    .join(
        returns.withColumnRenamed("date", "return_date"),
        "order_id"
    )
)

# ── Pitfall 3: Joining on string keys with different casing ───────────
# ❌ WRONG: "US" != "us" → rows don't match
result = df1.join(df2, "country")

# ✅ FIX: Normalize case before joining
df1_norm = df1.withColumn("country", lower(col("country")))
df2_norm = df2.withColumn("country", lower(col("country")))
result   = df1_norm.join(df2_norm, "country")

# ── Pitfall 4: Cross join by accident ────────────────────────────────
# ❌ DANGEROUS: No join key → cartesian product!
# 1M rows × 1M rows = 1 trillion rows
result = df1.join(df2)  # missing "on" argument → cross join
# This will run for days and OOM your cluster

# ✅ Spark 3.x raises an error for implicit cross joins by default
# To allow explicitly:
result = df1.crossJoin(df2)  # explicitly declare intent`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Advanced: multiple joins with pre-partitioning',
              content: `# If you join the same large table multiple times on the same key,
# repartition ONCE at the start to avoid repeated shuffles

# ❌ SLOW: 3 separate shuffles on the same key
result = (
    events
    .join(users, "user_id")           # shuffle events by user_id
    .join(user_segments, "user_id")   # shuffle again by user_id
    .join(user_attributes, "user_id") # shuffle again by user_id
)

# ✅ FAST: Repartition once, then 3 joins share the same layout
events_partitioned       = events.repartition(400, "user_id")
users_partitioned        = users.repartition(400, "user_id")
segments_partitioned     = user_segments.repartition(400, "user_id")
attributes_partitioned   = user_attributes.repartition(400, "user_id")

# Now all tables have the same partitioning → joins without shuffle
result = (
    events_partitioned
    .join(users_partitioned,      "user_id")   # no shuffle (same partitioning)
    .join(segments_partitioned,   "user_id")   # no shuffle
    .join(attributes_partitioned, "user_id")   # no shuffle
)`,
            },
          ],
        },
        {
          id: 'semi-anti-joins',
          title: 'Semi Joins, Anti Joins, and Non-Equi Joins',
          estimatedMinutes: 4,
          blocks: [
            {
              type: 'code',
              language: 'python',
              label: 'Lesser-known join types with practical examples',
              content: `# ── Left Semi Join ──────────────────────────────────────────────────
# Returns rows from LEFT where the key EXISTS in RIGHT
# Like an INNER JOIN but only returns LEFT columns
# More efficient than INNER JOIN when you only need left columns

# Use case: "Which orders have been refunded?"
refunded_orders = orders.join(
    refunds.select("order_id").distinct(),
    "order_id",
    "left_semi"
)
# Equivalent SQL: SELECT * FROM orders WHERE order_id IN (SELECT order_id FROM refunds)

# ── Left Anti Join ───────────────────────────────────────────────────
# Returns rows from LEFT where the key does NOT exist in RIGHT
# Perfectly efficient for "missing data" patterns

# Use case: "Which orders have NOT been shipped?"
unshipped = orders.join(
    shipments.select("order_id").distinct(),
    "order_id",
    "left_anti"
)
# SQL: SELECT * FROM orders WHERE order_id NOT IN (SELECT order_id FROM shipments)

# ── Non-Equi Join (range join) ────────────────────────────────────────
# Join on an inequality condition — use with Column expression, not string
# WARNING: No hash/sort-merge optimization. Falls back to BroadcastNestedLoopJoin.
# Keep at least one side small (< 100MB) or it will be extremely slow.

# Use case: "Which events fall within each campaign's time window?"
events_in_campaigns = events.join(
    broadcast(campaigns),   # MUST broadcast one side for performance
    (events.event_ts >= campaigns.start_ts) &
    (events.event_ts <= campaigns.end_ts),
    "inner"
)`,
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 7 — DATA SKEW
    // ═══════════════════════════════════════════════
    {
      id: 'data-skew',
      number: 7,
      title: 'Data Skew — The Silent Killer',
      description: 'Detecting, understanding, and fixing data skew — the #1 cause of Spark job timeouts.',
      totalMinutes: 16,
      sections: [
        {
          id: 'what-is-skew',
          title: 'Understanding Data Skew',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Data skew occurs when one partition contains dramatically more data than others. Since Spark must wait for ALL tasks in a stage to complete before moving to the next stage, one oversized "straggler" partition makes every other executor sit idle while it processes. This is the single most common cause of Spark job timeouts.',
            },
            {
              type: 'diagram',
              title: 'Skewed join — the straggler problem',
              content: `
Scenario: Join 1B events to 10K users
Problem: user_id="bot_user" appears 800M times (80% of all events)

Post-shuffle partition distribution:
  Partition 1: user_id="bot_user"  → 800,000,000 rows ← STRAGGLER
  Partition 2: user_id="Alice"     → 100,000 rows
  Partition 3: user_id="Bob"       → 95,000 rows
  ...
  Partition 400: user_id="Carol"   → 50,000 rows

Task completion times:
  Tasks 2-400:   finish in 30 seconds
  Task 1:        still running after 45 MINUTES

Stage cannot complete until Task 1 finishes.
Your 30-second job takes 45 minutes because of ONE partition.

Spark UI shows:
  Min task duration:    28s
  Median task duration: 31s
  Max task duration:    2,700s  ← 90x longer than median`,
              caption: 'One hot key ruins the entire stage duration.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Detecting data skew',
              content: `# ── Method 1: Find hot keys ──────────────────────────────────────────
df.groupBy("join_key") \
  .count() \
  .orderBy(col("count").desc()) \
  .show(20)
# If the top 5 keys hold >50% of rows, you have skew.

# ── Method 2: Inspect partition sizes ────────────────────────────────
from pyspark.sql.functions import spark_partition_id, count as cnt

df.withColumn("pid", spark_partition_id()) \
  .groupBy("pid") \
  .agg(cnt("*").alias("rows")) \
  .orderBy(col("rows").desc()) \
  .show(10)
# If max rows >> median rows, the data is skewed.

# ── Method 3: Check Spark UI ──────────────────────────────────────────
# Stages tab → Task Duration column
# Huge difference between median task time and max task time → skew
# Example: median=30s, max=3600s → severe skew

# ── Method 4: Check row count distribution after repartition ─────────
df.repartition(400, "join_key") \
  .withColumn("pid", spark_partition_id()) \
  .groupBy("pid") \
  .count() \
  .describe() \
  .show()
# High stddev relative to mean → skew`,
            },
          ],
        },
        {
          id: 'fixing-skew',
          title: 'Fixing Skew — Every Technique',
          estimatedMinutes: 11,
          blocks: [
            {
              type: 'paragraph',
              content: 'There are five techniques to fix data skew, ordered from easiest to most complex:',
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Try AQE First (Spark 3.x)',
              content:
                'In Spark 3.0+, enable spark.sql.adaptive.skewJoin.enabled=true. AQE automatically detects skewed partitions at runtime and splits them into sub-partitions. This fixes most skew with zero code changes. Only reach for manual techniques if AQE is not enough.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Technique 1: AQE automatic skew handling',
              content: `# Enable AQE skew join handling (Spark 3.0+)
spark.conf.set("spark.sql.adaptive.enabled",                      "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled",             "true")

# Tune sensitivity: partition is "skewed" if it's X times median size
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")

# Partition is skewed if it's larger than this threshold (default 256MB)
spark.conf.set(
    "spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes",
    str(128 * 1024 * 1024)   # 128MB
)

# Now just run your join normally — AQE handles the rest
result = large_df.join(other_df, "skewed_key")`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Technique 2: Filter and handle hot keys separately',
              content: `# When you have a few KNOWN hot keys (e.g., "bot_user", "unknown")
# Separate them and join with different strategies

HOT_KEYS = ["bot_user", "anonymous", "test_account"]

# ── Path A: Hot key rows → handle without join ────────────────────────
hot_events = large_df.filter(col("user_id").isin(HOT_KEYS))
# These rows probably don't need user enrichment (bots don't have profiles)
hot_result = hot_events.withColumn("user_name", lit("bot")).withColumn("country", lit("N/A"))

# ── Path B: Normal rows → efficient join ──────────────────────────────
normal_events = large_df.filter(~col("user_id").isin(HOT_KEYS))
normal_result = normal_events.join(broadcast(users), "user_id")

# ── Combine results ────────────────────────────────────────────────────
result = hot_result.unionByName(normal_result)`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Technique 3: Salting — distributing hot keys across partitions',
              content: `from pyspark.sql.functions import col, lit, rand, floor, concat_ws, explode, array

SALT_BUCKETS = 50  # number of sub-partitions for hot keys

# ── Step 1: Add random salt to the LARGE table ───────────────────────
large_salted = large_df.withColumn(
    "salted_key",
    concat_ws(
        "_",
        col("join_key"),
        floor(rand() * SALT_BUCKETS).cast("string")
    )
)
# "hot_key" → "hot_key_0", "hot_key_1", ..., "hot_key_49"
# "normal_key" → "normal_key_0", "normal_key_1", ..., "normal_key_49"
# Now "hot_key_0" has 1/50th of hot key rows → balanced!

# ── Step 2: Explode the SMALL table to match all salt values ─────────
small_exploded = small_df.withColumn(
    "salt_range",
    array([lit(str(i)) for i in range(SALT_BUCKETS)])
).withColumn(
    "salt_val", explode(col("salt_range"))
).withColumn(
    "salted_key",
    concat_ws("_", col("join_key"), col("salt_val"))
).drop("salt_range", "salt_val")
# Each row in small table now has 50 copies: one per salt bucket

# ── Step 3: Join on the salted key ────────────────────────────────────
result = large_salted.join(
    broadcast(small_exploded),  # small table is now 50x larger but still small
    "salted_key",
    "inner"
).drop("salted_key")

# The hot key is now spread across 50 partitions instead of 1
# Each partition has 1/50th of the hot key data → balanced!`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Technique 4: Pre-aggregation to eliminate skew at the source',
              content: `# If you need to aggregate a skewed column, aggregate BEFORE joining

# ❌ SKEWED: Join first, then aggregate
# The join shuffle moves 800M "bot_user" rows to one partition
result = (
    events_1B                    # skewed: "bot_user" has 800M rows
    .join(users_10K, "user_id")  # massive shuffle imbalance
    .groupBy("country")
    .agg(sum("amount"))
)

# ✅ BETTER: Aggregate first to eliminate the skew
user_totals = (
    events_1B
    .groupBy("user_id")          # aggregate skewed data → even shuffle
    .agg(sum("amount").alias("user_total"))
    # "bot_user" is now ONE row with its total → skew is gone
)

result = (
    user_totals                  # balanced, one row per user
    .join(broadcast(users_10K.select("user_id", "country")), "user_id")
    .groupBy("country")
    .agg(sum("user_total").alias("country_total"))
)`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Technique 5: Partial pre-aggregation (combiner pattern)',
              content: `# Like MapReduce combiners: aggregate within partitions BEFORE shuffle
# Dramatically reduces data moved across network

from pyspark.sql.functions import col, sum, count

# ❌ SLOW: Full shuffle of 1B rows, then aggregate
result = (
    events_1B
    .groupBy("country", "product")
    .agg(sum("revenue").alias("total_revenue"), count("*").alias("total_events"))
)

# ✅ FASTER: Partial aggregate per partition first, then final aggregate
# Step 1: Aggregate within each partition (no shuffle)
partial = (
    events_1B
    .groupBy(spark_partition_id().alias("_pid"), "country", "product")
    .agg(sum("revenue").alias("partial_rev"), count("*").alias("partial_cnt"))
    .drop("_pid")
)
# partial: reduced from 1B rows to ~(partitions × unique country/product combos)

# Step 2: Final aggregation (much smaller shuffle)
result = (
    partial
    .groupBy("country", "product")
    .agg(sum("partial_rev").alias("total_revenue"), sum("partial_cnt").alias("total_events"))
)`,
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 8 — AQE: ADAPTIVE QUERY EXECUTION
    // ═══════════════════════════════════════════════
    {
      id: 'aqe',
      number: 8,
      title: 'Adaptive Query Execution (AQE)',
      description: 'The single most impactful Spark 3.x feature — automatic runtime optimization.',
      totalMinutes: 12,
      sections: [
        {
          id: 'aqe-overview',
          title: 'What AQE Does and Why It Matters',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Traditional Spark optimization (Catalyst) happens BEFORE execution using statistics that may be stale or unavailable. AQE re-optimizes the query plan DURING execution, after each shuffle, using the actual runtime statistics it just observed.',
            },
            {
              type: 'diagram',
              title: 'Traditional vs AQE optimization',
              content: `
Traditional (Spark 2.x):
  Your code → Catalyst optimize (guesses) → Execute plan → done
  Problem: Catalyst estimates "this table has 1B rows" but it actually has 10M rows
           → Wrong join strategy chosen → slow execution

AQE (Spark 3.x):
  Your code → Initial plan → Execute Stage 1 → COLLECT STATS
            ↓
  Re-optimize based on ACTUAL data:
  - "Partition 42 is 50GB (skewed) → split it into 10 sub-partitions"
  - "Post-shuffle data is only 8MB → convert SortMerge to Broadcast join"
  - "Shuffle produced 10,000 tiny partitions → collapse into 200 larger ones"
            ↓
  Execute Stage 2 with corrected plan → collect stats again
            ↓
  Continue adapting throughout execution`,
              caption: 'AQE sees the actual data. Traditional planning guesses.',
            },
            {
              type: 'callout',
              variant: 'insight',
              title: 'AQE: The Highest ROI Spark Configuration',
              content:
                'A single configuration change — enabling AQE — can reduce runtime by 30-70% for typical ETL jobs. It is the most impactful optimization available in Spark 3.x and has essentially zero downside. Enable it before spending time on manual optimizations.',
            },
          ],
        },
        {
          id: 'aqe-features',
          title: 'AQE\'s Three Automatic Optimizations',
          estimatedMinutes: 7,
          blocks: [
            {
              type: 'code',
              language: 'python',
              label: 'Feature 1: Partition Coalescing',
              content: `# Problem: After a shuffle, Spark creates N shuffle partitions (default 200).
# If each is small (1KB), you have 200 tasks doing essentially nothing.
# AQE: collapses small partitions into fewer, larger ones automatically.

spark.conf.set("spark.sql.adaptive.enabled",                    "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")

# Target partition size after coalescing (default 64MB)
spark.conf.set("spark.sql.adaptive.advisoryPartitionSizeInBytes", str(128 * 1024 * 1024))

# Minimum partitions after coalescing (don't collapse too aggressively)
spark.conf.set("spark.sql.adaptive.coalescePartitions.minPartitionSize",
               str(1 * 1024 * 1024))   # 1MB minimum

# Example: without AQE:
#   shuffle.partitions=2000 → 2000 tasks, each 50KB → scheduler overhead
# With AQE:
#   At runtime: "these 2000 partitions average 50KB each, target is 128MB"
#   AQE collapses 2000 partitions → 16 partitions of 6MB each
#   → 16 tasks instead of 2000 → much faster`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Feature 2: Dynamic Join Strategy Switching',
              content: `# Problem: Catalyst plans a SortMergeJoin because it estimates
# a table has 500M rows. At runtime, after filtering, it has 500K rows.
# AQE: detects the small actual size → switches to BroadcastHashJoin.

spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.localShuffleReader.enabled", "true")

# Example: Catalyst plan (at query start):
#   SortMergeJoin (expects large right side)
#
# At runtime, after Stage 1 completes:
#   AQE observes: right side only 5MB after filter
#   AQE rewrites: → BroadcastHashJoin (replanning happens here!)
#   Improvement: eliminates the right side shuffle entirely

# To see this in Spark UI:
# SQL tab → find query → look for "AdaptiveBroadcastJoinThreshold" annotation
# It will show the original plan vs the AQE-rewritten plan`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Feature 3: Automatic Skew Join Handling',
              content: `# Problem: One partition is 10GB, others are 100MB.
# The 10GB partition runs for 20 minutes while 399 others finish in 2 minutes.
# AQE: detects skewed partitions and splits them automatically.

spark.conf.set("spark.sql.adaptive.enabled",          "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# A partition is "skewed" if it's skewedPartitionFactor times the median AND
# larger than skewedPartitionThresholdInBytes
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor",           "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", str(256 * 1024 * 1024))

# Example: 400 partitions
# Median partition size = 100MB
# Partition 42 = 2GB (20x median, above 256MB threshold → skewed)
#
# AQE splits Partition 42 into 20 sub-partitions of 100MB each
# Matches with 20 replicated partitions from the other join side
# → 20 tasks of 100MB instead of 1 task of 2GB
# → 20x faster for the straggler

# Full configuration for production (Spark 3.2+):
spark = (SparkSession.builder
    .config("spark.sql.adaptive.enabled",                                    "true")
    .config("spark.sql.adaptive.coalescePartitions.enabled",                 "true")
    .config("spark.sql.adaptive.advisoryPartitionSizeInBytes",               "134217728")
    .config("spark.sql.adaptive.skewJoin.enabled",                           "true")
    .config("spark.sql.adaptive.skewJoin.skewedPartitionFactor",             "5")
    .config("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes",   "268435456")
    .getOrCreate()
)`,
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 9 — DATA FORMATS & PARTITIONING
    // ═══════════════════════════════════════════════
    {
      id: 'data-formats',
      number: 9,
      title: 'Data Formats & Storage Optimization',
      description: 'Why format choice is a 10-100x performance decision, and how to partition data correctly.',
      totalMinutes: 16,
      sections: [
        {
          id: 'columnar-row',
          title: 'Columnar vs Row Storage — Why It Changes Everything',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Analytics queries read a few columns across many rows. Row formats store entire rows together on disk. Columnar formats store each column separately. For analytical workloads, this difference produces 5-50x faster reads.',
            },
            {
              type: 'diagram',
              title: 'The same data stored in row vs columnar format',
              content: `
DATASET: 1 million orders
Columns: order_id, customer_id, date, product, quantity, amount, country, status

── ROW FORMAT (CSV) ──────────────────────────────────────────────────
Disk layout (each row is contiguous):
  [1001, C001, 2024-01-01, Widget, 2, 29.99, US, completed]
  [1002, C002, 2024-01-02, Gadget, 1, 99.99, EU, pending]
  [1003, C003, 2024-01-03, Widget, 5, 74.95, US, completed]
  ... 1 million rows ...

Query: SELECT sum(amount) FROM orders WHERE country = 'US'
→ Must read ALL 8 columns for ALL 1M rows to get just "amount" and "country"
→ 100% of data read, 25% used (2 of 8 columns)
→ 75% WASTED I/O

── COLUMNAR FORMAT (Parquet) ─────────────────────────────────────────
Disk layout (each column is contiguous):
  [order_id block: 1001, 1002, 1003, ...]     ← SKIPPED
  [customer_id block: C001, C002, C003, ...]  ← SKIPPED
  [date block: 2024-01-01, 2024-01-02, ...]   ← SKIPPED
  [product block: Widget, Gadget, Widget, ...]← SKIPPED
  [quantity block: 2, 1, 5, ...]              ← SKIPPED
  [amount block: 29.99, 99.99, 74.95, ...]    ← READ ✅
  [country block: US, EU, US, ...]            ← READ ✅ (predicate pushdown)
  [status block: completed, pending, ...]     ← SKIPPED

→ Only 2 of 8 columns read from disk
→ 25% of data I/O
→ 4x less data read → 4x faster just from column pruning alone

BONUS: Column compression
  "country" block: US, EU, US, US, US, EU, US...
  Dictionary encoded: US=0, EU=1 → [0,1,0,0,0,1,0...]
  Run-length encoded: 5×US, 2×EU, 3×US...
  → column compresses to 10% of raw size → another 10x less I/O`,
              caption: 'Parquet can be 10-100x more efficient than CSV for analytics.',
            },
          ],
        },
        {
          id: 'parquet-optimization',
          title: 'Parquet Internals and Optimization',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Parquet files have two levels of structure: Row Groups (large chunks of rows, default 128MB) and Column Chunks (one per column within a Row Group). Each Row Group stores min/max statistics for every column. Spark uses these statistics for predicate pushdown — skipping entire Row Groups without decompressing them.',
            },
            {
              type: 'diagram',
              title: 'Parquet file internal structure',
              content: `
Parquet file (1GB):
  ├── Row Group 0 (128MB rows: 1-100K)
  │   ├── Column "date": [stats: min=2024-01-01, max=2024-01-31]
  │   ├── Column "amount": [stats: min=0.01, max=9,999.99]
  │   ├── Column "country": [stats: min=AU, max=ZA]
  │   └── Column "status": [page0, page1, page2...]
  ├── Row Group 1 (128MB rows: 100K-200K)
  │   ├── Column "date": [stats: min=2024-02-01, max=2024-02-28]
  │   ...
  └── Row Group 7 (rows: 700K-800K)
      ├── Column "date": [stats: min=2024-08-01, max=2024-08-31]

Query: filter(date > "2024-07-01")
  Row Groups 0-6: max date < 2024-07-01 → SKIP (no decompression!) ✅
  Row Group 7: min date >= 2024-07-01 → READ ✅
  → 1 of 8 row groups read = 87.5% less I/O`,
              caption: 'Row Group statistics enable skipping entire blocks without reading them.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Writing Parquet for maximum read performance',
              content: `# ── Choose compression wisely ────────────────────────────────────────
# snappy:   fast read/write, moderate compression, splittable ← default, good choice
# zstd:     better compression than snappy, comparable speed ← best for cold storage
# gzip:     best compression, slow, NOT splittable           ← avoid for big data
# none:     fastest read, largest files                       ← use for hot frequently read data

df.write.option("compression", "zstd").parquet("s3://bucket/output/")

# ── Control Row Group size ────────────────────────────────────────────
# Larger row groups = better compression, better predicate pushdown
# But: need enough memory to write a full row group
spark.conf.set("spark.sql.parquet.blockSize", str(256 * 1024 * 1024))  # 256MB row groups

# ── Enable bloom filters for high-cardinality equality filters ─────────
# Bloom filters quickly say "this value is definitely NOT in this row group"
spark.conf.set("spark.sql.parquet.bloom.filter.enabled", "true")
df.write \
    .option("parquet.bloom.filter.enabled", "true") \
    .option("parquet.bloom.filter.enabled#user_id", "true") \
    .parquet("s3://bucket/output/")

# ── Enable statistics for pushdown ────────────────────────────────────
spark.conf.set("spark.sql.parquet.filterPushdown", "true")   # default true
spark.conf.set("spark.sql.parquet.recordLevelFilter.enabled", "true")

# ── Merge schemas when reading multiple Parquet files ─────────────────
# (handles schema evolution when different files have different columns)
df = spark.read.option("mergeSchema", "true").parquet("s3://bucket/data/")`,
            },
          ],
        },
        {
          id: 'partitioning-strategy',
          title: 'Disk Partitioning — The Most Important Write Decision',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'paragraph',
              content:
                'On-disk partitioning creates a directory hierarchy (e.g., year=2024/month=3/) that Spark uses for partition pruning at read time. Choosing the right partition column is one of the highest-impact decisions in your data architecture.',
            },
            {
              type: 'table',
              headers: ['Partition Column Choice', 'Result', 'Verdict'],
              rows: [
                ['date (year+month)', 'Low cardinality, queries filter by date range', '✅ Excellent — standard for event/transaction data'],
                ['region or country', 'Low cardinality, queries often filter by geo', '✅ Good'],
                ['status (active/inactive)', 'Very low cardinality (2-5 values)', '✅ Good for datasets heavily filtered by status'],
                ['user_id', 'Millions of unique values → millions of directories', '❌ Never — creates small file problem'],
                ['event_type (if >50 types)', 'High cardinality → many small directories', '❌ Bad'],
                ['timestamp', 'Infinite cardinality', '❌ Never ever'],
              ],
            },
            {
              type: 'code',
              language: 'python',
              label: 'Writing and reading partitioned Parquet',
              content: `from pyspark.sql.functions import year, month, col

# ── Add partition columns before writing ──────────────────────────────
df_with_parts = df.withColumns({
    "year":  year(col("event_date")),
    "month": month(col("event_date")),
})

# ── Write partitioned Parquet ─────────────────────────────────────────
df_with_parts.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("s3://bucket/events/")
# Creates: s3://bucket/events/year=2024/month=3/part-0001.parquet

# ── Enable dynamic partition overwrite ────────────────────────────────
# Without this: overwrite replaces ALL partitions (dangerous for incremental loads!)
# With this: overwrite replaces ONLY partitions present in the new DataFrame
spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")

# Now run the monthly refresh without touching other months:
march_data.write \
    .mode("overwrite") \          # only replaces year=2024/month=3/ partition
    .partitionBy("year", "month") \
    .parquet("s3://bucket/events/")

# ── Partition pruning at read time ────────────────────────────────────
# Spark skips directories that don't match the filter
df = spark.read.parquet("s3://bucket/events/") \
    .filter((col("year") == 2024) & (col("month") == 3))
# Only reads: s3://bucket/events/year=2024/month=3/
# Skips 2 years × 11 other months = 35 directories → reads 1/36th of data

# ── Verify partition pruning is active ────────────────────────────────
df.explain("formatted")
# Look for: "PartitionFilters: [isnotnull(year), (year = 2024), (month = 3)]"
# This means partition pruning IS happening  ✅`,
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'The Small File Problem',
              content:
                'Writing a DataFrame with 5,000 partitions creates 5,000 Parquet files. Reading 5,000 files next time requires 5,000 S3 LIST/HEAD operations. At scale this is slow. Always use coalesce() or repartition() before writing to produce 1-4 files per partition directory. Target file size: 128MB to 1GB.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Fixing the small file problem',
              content: `# ── Bad: Write 5,000 tiny files ─────────────────────────────────────
df.write.partitionBy("date").parquet("s3://bucket/events/")
# Produces: events/date=2024-03-01/part-0001.parquet (50KB)
#           events/date=2024-03-01/part-0002.parquet (50KB)  ← too small!
#           ... 5,000 files total ...

# ── Good: Repartition per partition key to get fewer, larger files ────
from pyspark.sql.functions import col

# Option A: repartition by the partition column (each date gets even files)
df.repartition("date").write \
    .partitionBy("date") \
    .parquet("s3://bucket/events/")
# Each date directory gets exactly 1 file

# Option B: control total file count per date directory
df.repartition(200, "date").write \
    .partitionBy("date") \
    .parquet("s3://bucket/events/")
# 200 partitions distributed across dates → 200 total files

# Option C: coalesce AFTER grouping (no shuffle if already co-partitioned)
df.sortWithinPartitions("date") \
  .coalesce(100) \
  .write.partitionBy("date").parquet("s3://bucket/events/")

# ── Delta OPTIMIZE: compact small files retroactively ─────────────────
from delta.tables import DeltaTable
DeltaTable.forPath(spark, "s3://bucket/delta/events").optimize().execute()
# Delta merges all small files into target size (default 1GB)`,
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 10 — DELTA LAKE
    // ═══════════════════════════════════════════════
    {
      id: 'delta-lake',
      number: 10,
      title: 'Delta Lake — ACID Transactions at Scale',
      description: 'What Delta Lake adds to Parquet, and how to use it correctly in production.',
      totalMinutes: 14,
      sections: [
        {
          id: 'delta-overview',
          title: 'What Delta Lake Adds to Parquet',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Delta Lake is an open-source storage layer that sits on top of Parquet files and adds a transaction log. This single addition enables a set of capabilities that plain Parquet fundamentally cannot support.',
            },
            {
              type: 'table',
              headers: ['Capability', 'Plain Parquet', 'Delta Lake'],
              rows: [
                ['ACID transactions', '❌ No — two concurrent writers corrupt data', '✅ Full ACID with optimistic concurrency'],
                ['Update / Delete rows', '❌ Impossible without rewriting the file', '✅ Efficient UPDATE, DELETE, MERGE'],
                ['Schema enforcement', '❌ New columns silently added or ignored', '✅ Schema is enforced; rejects bad writes'],
                ['Schema evolution', '❌ Manual, error-prone', '✅ Controlled ALTER TABLE support'],
                ['Time travel', '❌ Previous versions gone forever', '✅ Query any previous version by time or version number'],
                ['Audit history', '❌ No record of changes', '✅ Full transaction log with who changed what'],
                ['Data quality', '❌ Constraints must be enforced in application code', '✅ Table-level constraints and expectations'],
                ['Streaming + batch', '❌ Complex to combine safely', '✅ Unified batch and streaming source/sink'],
              ],
            },
            {
              type: 'key-concept',
              term: 'Delta Transaction Log (_delta_log)',
              definition:
                'A directory of JSON files that record every operation on the Delta table. Each commit adds one JSON file describing what was added, removed, or changed. Spark reads the log to reconstruct the current table state. This log is what enables all of Delta\'s superpowers.',
              analogy:
                'The transaction log is like a bank account statement. The current balance (table state) is determined by replaying all transactions (log entries). You can see the balance at any point in time by replaying up to that date.',
            },
          ],
        },
        {
          id: 'delta-operations',
          title: 'Delta Operations with Examples',
          estimatedMinutes: 9,
          blocks: [
            {
              type: 'code',
              language: 'python',
              label: 'Writing and reading Delta tables',
              content: `# ── Write a Delta table ──────────────────────────────────────────────
df.write \
    .format("delta") \
    .mode("overwrite") \
    .partitionBy("date") \
    .save("s3://bucket/delta/orders")

# Register in Hive metastore (enables SQL access)
spark.sql("""
    CREATE TABLE orders
    USING DELTA
    LOCATION 's3://bucket/delta/orders'
""")

# ── Read Delta table ──────────────────────────────────────────────────
df = spark.read.format("delta").load("s3://bucket/delta/orders")
# Or via catalog:
df = spark.table("orders")

# ── Time travel — query historical versions ───────────────────────────
# By version number:
df_v5 = spark.read.format("delta").option("versionAsOf", 5).load(path)

# By timestamp (before a specific time):
df_yesterday = spark.read.format("delta") \
    .option("timestampAsOf", "2024-03-14 00:00:00") \
    .load(path)

# ── View history ──────────────────────────────────────────────────────
from delta.tables import DeltaTable
dt = DeltaTable.forPath(spark, path)
dt.history().select("version", "timestamp", "operation", "operationMetrics").show(10)
# version | timestamp           | operation | operationMetrics
# 5       | 2024-03-15 09:00:00| MERGE     | {numTargetRowsInserted: 15000, ...}
# 4       | 2024-03-14 23:00:00| WRITE     | {numAddedFiles: 12, ...}`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'MERGE INTO — the most important Delta operation',
              content: `from delta.tables import DeltaTable
from pyspark.sql.functions import col

dt = DeltaTable.forPath(spark, "s3://bucket/delta/customers")

# ── Basic MERGE (upsert) ──────────────────────────────────────────────
# "new_customers" contains new and updated records
# Match on customer_id → update if exists, insert if new
dt.alias("target").merge(
    new_customers.alias("source"),
    "target.customer_id = source.customer_id"
) \
.whenMatchedUpdateAll() \        # update all columns when matched
.whenNotMatchedInsertAll() \     # insert when not found
.execute()

# ── Selective MERGE with conditions ──────────────────────────────────
dt.alias("target").merge(
    updates.alias("source"),
    "target.order_id = source.order_id"
) \
.whenMatchedUpdate(
    condition = col("source.updated_at") > col("target.updated_at"),
    set = {
        "status":     col("source.status"),
        "amount":     col("source.amount"),
        "updated_at": col("source.updated_at"),
    }
) \
.whenNotMatchedInsert(
    condition = col("source.status") != "test",
    values = {
        "order_id":   col("source.order_id"),
        "status":     col("source.status"),
        "amount":     col("source.amount"),
        "created_at": col("source.created_at"),
        "updated_at": col("source.updated_at"),
    }
) \
.whenMatchedDelete(
    condition = col("source.status") == "cancelled"
) \
.execute()`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Delta OPTIMIZE and Z-ordering — critical for query performance',
              content: `from delta.tables import DeltaTable

dt = DeltaTable.forPath(spark, "s3://bucket/delta/events")

# ── OPTIMIZE: compact small files ────────────────────────────────────
# After many small writes (streaming, frequent merges), files get fragmented
# OPTIMIZE merges them into target size (default 1GB)
dt.optimize().execute()

# ── ZORDER: cluster related data together ────────────────────────────
# Z-ordering physically co-locates rows with similar key values in the same files
# Future queries that filter on that column skip most files entirely

dt.optimize().executeZOrderBy("customer_id")
# After ZORDER, a query for customer_id=12345 reads 1 file instead of 1000

# Multi-column ZORDER (diminishing returns beyond 2-3 columns)
dt.optimize().executeZOrderBy("customer_id", "event_date")

# ── VACUUM: clean up old data files ──────────────────────────────────
# By default, Delta keeps 7 days of history
# VACUUM removes files older than the retention period
dt.vacuum(168)   # retain 7 days (168 hours) — DO NOT go below 168 hours
# Without vacuum: old parquet files accumulate forever

# ── Verify data skipping is working ──────────────────────────────────
spark.sql("""
    DESCRIBE DETAIL 's3://bucket/delta/events'
""").select("numFiles", "sizeInBytes").show()

# Run a query and check metrics:
spark.sql("SET spark.databricks.delta.stats.skipping = true")
result = spark.read.format("delta").load(path).filter("customer_id = 12345")
result.explain("formatted")
# Look for: "numFilesAfterSkipping: 2 (out of 1000)" ← data skipping working!`,
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Delta Maintenance Schedule',
              content:
                'Run OPTIMIZE after every large batch write. Run OPTIMIZE + ZORDER weekly on frequently queried tables. Run VACUUM weekly to prevent unbounded storage growth. In Databricks, use Auto Optimize and Auto Compaction to do this automatically.',
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 11 — UDFs AND PANDAS UDFS
    // ═══════════════════════════════════════════════
    {
      id: 'udfs',
      number: 11,
      title: 'UDFs and Pandas UDFs',
      description: 'When to use custom functions, why they are slow, and how to make them fast.',
      totalMinutes: 14,
      sections: [
        {
          id: 'udf-cost',
          title: 'The Real Cost of Python UDFs',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Python UDFs are a trap. They look convenient, but they completely bypass Spark\'s performance engine (Tungsten, whole-stage codegen, vectorization). Always try to accomplish the task with native Spark functions first. If you cannot, use a Pandas UDF (vectorized). Only use a row-level Python UDF as a last resort.',
            },
            {
              type: 'diagram',
              title: 'What happens when a Python UDF runs',
              content: `
Native Spark Function (e.g., upper()):
  JVM: [row1] → Tungsten vectorized → [RESULT1]   (batch of 1024 rows at once)
       [row2]                         [RESULT2]    no serialization, CPU cache-friendly
       ...
  Speed: ~500 million rows/second on 50 executors

Python UDF (e.g., @udf def my_upper(s): return s.upper()):
  For EACH ROW:
  1. JVM Tungsten binary → serialize to pickle → cross socket to Python
  2. Python: unpickle → call function → re-pickle result
  3. Python pickle → cross socket back to JVM → deserialize from pickle
  4. JVM: continue

  Each row crosses the JVM-Python boundary TWICE.
  On 1 billion rows: 2 billion serialize/deserialize operations.
  Speed: ~2 million rows/second — 250x slower than native

Pandas UDF (@pandas_udf):
  JVM: [batch of 1024 rows] → Apache Arrow format → Python
  Python: receives entire Pandas Series → vectorized pandas ops → return Series
  Python Series → Apache Arrow → JVM
  Speed: ~50 million rows/second — 25x faster than row UDF`,
              caption: 'Row UDFs: 250x slower. Pandas UDFs: 5x slower. Native: baseline.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'Always try native functions first',
              content: `# ── Example: Custom string cleaning ─────────────────────────────────

# ❌ NEVER do this with a UDF:
@udf(returnType=StringType())
def clean_phone(phone):
    if phone is None:
        return None
    return re.sub(r'[^0-9]', '', phone).strip()

# ✅ Do this with native functions (10-100x faster):
from pyspark.sql.functions import regexp_replace, trim, col

df = df.withColumn("clean_phone",
    trim(regexp_replace(col("phone"), r"[^0-9]", "")))

# ── Example: Conditional logic ────────────────────────────────────────
# ❌ UDF for simple conditions:
@udf(returnType=StringType())
def tier(amount):
    if amount > 10000:   return "platinum"
    elif amount > 1000:  return "gold"
    else:                return "bronze"

# ✅ Native when() chains:
from pyspark.sql.functions import when
df = df.withColumn("tier",
    when(col("amount") > 10000, "platinum")
    .when(col("amount") > 1000,  "gold")
    .otherwise("bronze"))

# ── When you genuinely need a UDF ────────────────────────────────────
# Valid use cases:
# - Complex business logic with branching that cannot be expressed as SQL
# - Calling external libraries (e.g., specialized NLP, cryptography)
# - Parsing complex custom formats (e.g., proprietary binary encoding)
# - Anything requiring stateful object reuse within a partition`,
            },
          ],
        },
        {
          id: 'pandas-udf-patterns',
          title: 'Pandas UDFs — The Right Way',
          estimatedMinutes: 9,
          blocks: [
            {
              type: 'code',
              language: 'python',
              label: 'Scalar Pandas UDF — element-wise operations',
              content: `import pandas as pd
import numpy as np
from pyspark.sql.functions import pandas_udf, col
from pyspark.sql.types import DoubleType, StringType

# ── Scalar Pandas UDF: one Series in → one Series out ─────────────────
@pandas_udf(DoubleType())
def normalize_zscore(series: pd.Series) -> pd.Series:
    """Z-score normalize. Native Spark has no zscore function."""
    mean = series.mean()
    std  = series.std()
    return (series - mean) / std if std != 0 else pd.Series([0.0] * len(series))

df = df.withColumn("score_normalized", normalize_zscore(col("raw_score")))


@pandas_udf(StringType())
def extract_email_domain(emails: pd.Series) -> pd.Series:
    """Vectorized regex extraction — faster than row-level UDF."""
    return emails.str.extract(r'@(.+)$', expand=False).fillna("unknown")

df = df.withColumn("domain", extract_email_domain(col("email")))


# ── Multiple input columns ─────────────────────────────────────────────
@pandas_udf(DoubleType())
def haversine_distance(lat1: pd.Series, lon1: pd.Series,
                        lat2: pd.Series, lon2: pd.Series) -> pd.Series:
    """Vectorized haversine distance calculation."""
    R = 6371  # Earth radius km
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    return 2 * R * np.arcsin(np.sqrt(a))

df = df.withColumn("distance_km",
    haversine_distance(col("lat1"), col("lon1"), col("lat2"), col("lon2")))`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'mapInPandas — ML inference at scale',
              content: `import pandas as pd
import pickle
from pyspark.sql.types import StructType, StructField, LongType, DoubleType, StringType

# ── Pattern: Distributed ML inference ────────────────────────────────
# Load model ONCE per partition (not per row!)
# Use mapInPandas for maximum flexibility

# Step 1: Load model and broadcast to executors
with open("model.pkl", "rb") as f:
    model_bytes = f.read()
model_bc = spark.sparkContext.broadcast(model_bytes)

# Step 2: Define inference function
def run_inference(iterator):
    """Called once per partition. iterator yields Pandas DataFrames."""
    import pickle
    model = pickle.loads(model_bc.value)   # deserialize once per partition
    
    for pdf in iterator:
        features = pdf[["feature_1", "feature_2", "feature_3"]].values
        predictions         = model.predict(features)
        probabilities       = model.predict_proba(features)[:, 1]
        
        pdf["prediction"]   = predictions
        pdf["probability"]  = probabilities
        yield pdf

# Step 3: Define output schema
output_schema = StructType([
    StructField("user_id",     LongType(),   True),
    StructField("feature_1",   DoubleType(), True),
    StructField("feature_2",   DoubleType(), True),
    StructField("feature_3",   DoubleType(), True),
    StructField("prediction",  StringType(), True),
    StructField("probability", DoubleType(), True),
])

# Step 4: Run inference distributed across all executors
predictions_df = features_df.mapInPandas(run_inference, schema=output_schema)
predictions_df.write.parquet("s3://bucket/predictions/")`,
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'The Broadcast Model Pattern',
              content:
                'Never load a model from disk inside your UDF (it reads from storage on every partition execution). Always load once, broadcast to all executors, then deserialize inside the UDF. For scikit-learn models: pickle.dumps → broadcast → pickle.loads inside mapInPandas. For deep learning: save to S3, load path via broadcast, load lazily with caching.',
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 12 — STRUCTURED STREAMING
    // ═══════════════════════════════════════════════
    {
      id: 'streaming',
      number: 12,
      title: 'Structured Streaming',
      description: 'Real-time data processing with the same DataFrame API as batch.',
      totalMinutes: 14,
      sections: [
        {
          id: 'streaming-model',
          title: 'The Streaming Execution Model',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Structured Streaming treats a live data stream as an unbounded table that grows continuously. You write the same DataFrame transformations as in batch, and Spark continuously processes new data in micro-batches (or in continuous mode). The key difference: streaming results are written continuously, not once.',
            },
            {
              type: 'diagram',
              title: 'Structured Streaming mental model',
              content: `
BATCH PROCESSING:
  Fixed input → Transform → Fixed output → Done

STRUCTURED STREAMING:
  Kafka/Delta/files → (new data arrives every second) → Transform → Sink

Time →  t0    t1    t2    t3    t4    t5
        │     │     │     │     │     │
Input:  [d1]  [d2]  [d3]  []    [d4]  [d5, d6]
        │     │     │     │     │     │
Micro-  [---trigger interval---]      [---trigger---]
batch:  Process d1, d2, d3             Process d4, d5, d6
        → write to sink                → write to sink

Trigger modes:
  processingTime="1 minute"  → micro-batch every 1 minute
  processingTime="0"          → as fast as possible (continuous micro-batch)
  once=True                  → process all available data, stop (useful for testing)
  availableNow=True           → process all available, stop (Spark 3.3+)`,
            },
            {
              type: 'key-concept',
              term: 'Checkpoint Location',
              definition:
                'A directory on durable storage (S3, HDFS) where Spark records: (1) the current offset/position in the source (Kafka offset, file watermark), and (2) the state of stateful operations (windowed aggregations, deduplication state). Without a checkpoint, restarting a streaming job means reprocessing from the beginning.',
              analogy:
                'Checkpoint is like a bookmark in a book. When you restart reading, you open to your bookmark instead of page 1.',
            },
          ],
        },
        {
          id: 'streaming-patterns',
          title: 'Production Streaming Patterns',
          estimatedMinutes: 9,
          blocks: [
            {
              type: 'code',
              language: 'python',
              label: 'Kafka → Delta streaming pipeline',
              content: `from pyspark.sql.functions import from_json, col, current_timestamp
from pyspark.sql.types import StructType, StructField, StringType, LongType, DoubleType

# ── Define schema for Kafka JSON payload ─────────────────────────────
event_schema = StructType([
    StructField("event_id",    LongType(),   True),
    StructField("user_id",     LongType(),   True),
    StructField("event_type",  StringType(), True),
    StructField("amount",      DoubleType(), True),
    StructField("event_ts",    StringType(), True),
])

# ── Read from Kafka ───────────────────────────────────────────────────
raw_stream = (spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "kafka-broker:9092")
    .option("subscribe", "user-events")
    .option("startingOffsets", "latest")     # or "earliest" to reprocess
    .option("maxOffsetsPerTrigger", 100_000) # rate limit: 100K msgs/trigger
    .option("failOnDataLoss", "false")       # don't fail if Kafka deletes old msgs
    .load()
)

# ── Parse and transform ───────────────────────────────────────────────
events = (raw_stream
    .select(
        from_json(col("value").cast("string"), event_schema).alias("data"),
        col("timestamp").alias("kafka_ts"),    # Kafka ingestion timestamp
        col("partition"),                      # Kafka partition
        col("offset"),                         # Kafka offset
    )
    .select("data.*", "kafka_ts")
    .withColumn("processed_at", current_timestamp())
    .withColumn("event_ts", col("event_ts").cast("timestamp"))
    .filter(col("event_id").isNotNull())       # basic data quality filter
)

# ── Write to Delta (append mode) ──────────────────────────────────────
query = (events.writeStream
    .format("delta")
    .outputMode("append")
    .option("checkpointLocation", "s3://bucket/checkpoints/user-events/")
    .option("mergeSchema",         "true")     # allow schema evolution
    .partitionBy("event_type")
    .trigger(processingTime="1 minute")        # micro-batch every minute
    .start("s3://bucket/delta/user-events/")
)

query.awaitTermination()`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Streaming with watermark and window aggregations',
              content: `from pyspark.sql.functions import window, col, sum, count, avg

# ── Streaming aggregation with late data handling ─────────────────────

# Watermark: accept data up to 10 minutes late
# Events older than (max event time - 10 minutes) are dropped
events_with_watermark = events.withWatermark("event_ts", "10 minutes")

# 5-minute tumbling windows
window_agg = (events_with_watermark
    .groupBy(
        window(col("event_ts"), "5 minutes"),   # 5-min window
        col("event_type")
    )
    .agg(
        count("*").alias("event_count"),
        sum("amount").alias("total_amount"),
        avg("amount").alias("avg_amount"),
    )
    .select(
        col("window.start").alias("window_start"),
        col("window.end").alias("window_end"),
        col("event_type"),
        col("event_count"),
        col("total_amount"),
        col("avg_amount"),
    )
)

# "append" mode: emit window result only after watermark passes it (final results only)
query = (window_agg.writeStream
    .format("delta")
    .outputMode("append")     # only emit when window is finalized
    .option("checkpointLocation", "s3://bucket/checkpoints/window-agg/")
    .trigger(processingTime="1 minute")
    .start("s3://bucket/delta/window-metrics/")
)`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'foreachBatch — the most flexible streaming sink',
              content: `from delta.tables import DeltaTable

# ── foreachBatch: apply any batch logic to each micro-batch ───────────
# Use when you need: MERGE (upsert), multiple sinks, complex transforms,
# or operations not supported in streaming mode

def upsert_to_delta(batch_df, batch_id):
    """
    batch_df: a regular batch DataFrame (not streaming)
    batch_id: monotonically increasing integer per micro-batch
    """
    # ── Idempotency: skip if already processed ────────────────────────
    # Delta transaction log ensures each batch_id commits atomically
    # Re-running the same batch_id is safe if using MERGE

    target = DeltaTable.forPath(spark, "s3://bucket/delta/customers")

    # ── Deduplicate within the micro-batch first ──────────────────────
    # A single micro-batch may contain multiple updates for the same key
    from pyspark.sql.window import Window
    from pyspark.sql.functions import row_number, col

    window = Window.partitionBy("customer_id").orderBy(col("updated_at").desc())
    deduped = (batch_df
        .withColumn("rn", row_number().over(window))
        .filter(col("rn") == 1)
        .drop("rn")
    )

    # ── MERGE: upsert into Delta ───────────────────────────────────────
    target.alias("t").merge(
        deduped.alias("s"),
        "t.customer_id = s.customer_id"
    ) \
    .whenMatchedUpdate(
        condition = col("s.updated_at") > col("t.updated_at"),
        set = {"name": col("s.name"), "email": col("s.email"),
               "updated_at": col("s.updated_at")}
    ) \
    .whenNotMatchedInsertAll() \
    .execute()

query = (stream_df.writeStream
    .foreachBatch(upsert_to_delta)
    .option("checkpointLocation", "s3://bucket/checkpoints/customers/")
    .trigger(processingTime="5 minutes")
    .start()
)

query.awaitTermination()`,
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Streaming Pitfalls to Avoid',
              content:
                'Never use df.show(), df.count(), or df.collect() inside a streaming query — they are batch actions. Never forget checkpointLocation — without it, job restart means reprocessing from offset 0. Never use output mode "complete" for append-only sources without aggregation — it will hold all data in state memory forever.',
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // CHAPTER 13 — OPTIMIZATION PLAYBOOK
    // ═══════════════════════════════════════════════
    {
      id: 'optimization-playbook',
      number: 13,
      title: 'The Complete Optimization Playbook',
      description: 'Step-by-step: diagnosing slow jobs and applying the right fix.',
      totalMinutes: 20,
      sections: [
        {
          id: 'diagnosis',
          title: 'Diagnosing a Slow Job',
          estimatedMinutes: 7,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Before optimizing, diagnose the actual bottleneck. Guessing without data is how you spend 3 hours on Kryo serialization when the problem is data skew. Follow this diagnostic flow:',
            },
            {
              type: 'numbered-list',
              items: [
                'Open Spark UI (localhost:4040 or cluster URL). Go to SQL tab. Find the slow query.',
                'Click the query. Look at the visual DAG. Find the widest bar — that is the slowest stage.',
                'Click the slow stage. Check: Is there one task much slower than others (skew)? Is shuffle read/write large (expensive shuffle)? Is spill > 0 (partition too large for memory)?',
                'Check Executors tab: Is GC time > 10% of task time? (Memory pressure). Are some executors idle while others are busy? (Skew).',
                'Run df.explain("formatted"). Look for: SortMergeJoin on large tables (should be Broadcast?), missing predicate pushdown, full table scan instead of partition scan.',
                'Check partition sizes: df.rdd.mapPartitions(lambda it: [sum(1 for _ in it)]).collect() — high variance means skew.',
                'Now apply the right fix based on what you found.',
              ],
            },
            {
              type: 'table',
              headers: ['Symptom in Spark UI', 'Root Cause', 'Fix'],
              rows: [
                ['One task 10x slower than others', 'Data skew', 'Enable AQE skewJoin or use salting'],
                ['Shuffle Spill (Disk) > 0', 'Partition too large for memory', 'Increase shuffle.partitions or executor memory'],
                ['SortMergeJoin on known-small table', 'Catalyst chose wrong join type', 'Add broadcast() hint or raise autoBroadcastJoinThreshold'],
                ['GC time > 10%', 'Memory pressure on executor', 'Increase executor memory or reduce partition count'],
                ['Stage takes minutes with no input data', 'Missing partition pruning', 'Add filter on partition column before action'],
                ['Exchange (shuffle) before every join', 'Tables not bucketed; too many joins', 'Use bucketing or pre-partition before multiple joins'],
                ['All tasks finish, then 5 min pause', 'Driver collection bottleneck', 'Stop collecting large DataFrames; write to storage instead'],
              ],
            },
          ],
        },
        {
          id: 'optimization-order',
          title: 'Optimization in Priority Order',
          estimatedMinutes: 8,
          blocks: [
            {
              type: 'callout',
              variant: 'insight',
              title: 'The 80/20 Rule: These 5 things give 80% of gains',
              content:
                '1. Enable AQE. 2. Use Parquet/Delta instead of CSV. 3. Filter early. 4. Broadcast small join tables. 5. Fix data skew. Do these before anything else.',
            },
            {
              type: 'code',
              language: 'python',
              label: 'The complete optimization starter template',
              content: `from pyspark.sql import SparkSession
from pyspark.sql.functions import broadcast, col

# ═══════════════════════════════════════════════════════════════════
# STEP 1: Configure Spark correctly (do this ONCE at session start)
# ═══════════════════════════════════════════════════════════════════
spark = (SparkSession.builder
    .appName("OptimizedJob")
    # AQE — the single most impactful optimization
    .config("spark.sql.adaptive.enabled",                             "true")
    .config("spark.sql.adaptive.coalescePartitions.enabled",          "true")
    .config("spark.sql.adaptive.skewJoin.enabled",                    "true")
    .config("spark.sql.adaptive.advisoryPartitionSizeInBytes",        str(128 * 1024 * 1024))
    # Shuffle tuning
    .config("spark.sql.shuffle.partitions",                           "400")  # tune for cluster
    # Auto-broadcast threshold (raise from default 10MB)
    .config("spark.sql.autoBroadcastJoinThreshold",                   str(50 * 1024 * 1024))
    # Serialization
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
    .getOrCreate()
)

# ═══════════════════════════════════════════════════════════════════
# STEP 2: Read in the most efficient format
# ═══════════════════════════════════════════════════════════════════
# ✅ Parquet with predicate pushdown
events = spark.read.parquet("s3://bucket/events/")  # columnar, compressed

# ❌ NEVER start a pipeline with CSV on large data
# events = spark.read.csv("s3://bucket/events.csv")  # 100x slower than parquet

# ═══════════════════════════════════════════════════════════════════
# STEP 3: Filter as early as possible
# ═══════════════════════════════════════════════════════════════════
# Filter BEFORE any joins, aggregations, or other expensive operations
events_filtered = events.filter(
    (col("year") == 2024) &            # ← partition pruning: skips 2 years of data
    (col("event_type") == "purchase") &  # ← row filter: 90% of rows removed
    (col("amount") > 0)                  # ← data quality: removes garbage rows
)

# ═══════════════════════════════════════════════════════════════════
# STEP 4: Broadcast all small tables in joins
# ═══════════════════════════════════════════════════════════════════
# Load dimension tables
products  = spark.read.parquet("s3://bucket/dim/products/")   # 2MB
countries = spark.read.parquet("s3://bucket/dim/countries/")  # 500KB

# Always broadcast small tables (eliminates shuffle on that side)
enriched = (events_filtered
    .join(broadcast(products),  "product_id", "left")
    .join(broadcast(countries), "country_code", "left")
)

# ═══════════════════════════════════════════════════════════════════
# STEP 5: Cache intermediate results used multiple times
# ═══════════════════════════════════════════════════════════════════
enriched.cache()
enriched.count()   # materialize the cache

# Use 3 times → cache pays off
by_region  = enriched.groupBy("region").agg({"amount": "sum"})
by_product = enriched.groupBy("product_name").agg({"amount": "sum"})
by_day     = enriched.groupBy("day").agg({"amount": "sum", "*": "count"})

enriched.unpersist()   # free memory

# ═══════════════════════════════════════════════════════════════════
# STEP 6: Write efficiently
# ═══════════════════════════════════════════════════════════════════
spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")

enriched.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .option("compression", "zstd") \
    .parquet("s3://bucket/output/enriched-events/")`,
            },
            {
              type: 'code',
              language: 'python',
              label: 'Advanced: repartition strategy for complex pipelines',
              content: `# Pipeline that joins the same large table multiple times
# Each join would trigger a shuffle without pre-partitioning

# ❌ NAIVE: 3 independent shuffles
result = (
    events
    .join(orders,    "user_id")    # shuffle #1: hash by user_id
    .join(profiles,  "user_id")    # shuffle #2: hash by user_id AGAIN
    .join(segments,  "user_id")    # shuffle #3: hash by user_id AGAIN
)

# ✅ OPTIMIZED: 1 upfront shuffle, 3 map-side joins
# Repartition ALL tables by user_id the SAME way
N = 400

events_p   = events.repartition(N, "user_id")
orders_p   = orders.repartition(N, "user_id")
profiles_p = profiles.repartition(N, "user_id")
segments_p = segments.repartition(N, "user_id")

# Each join: same partition layout → no shuffle needed
result = (
    events_p
    .join(orders_p,   "user_id")   # no shuffle (same partitioning)
    .join(profiles_p, "user_id")   # no shuffle
    .join(segments_p, "user_id")   # no shuffle
)

# If some tables are small enough: broadcast those, repartition only large ones
result = (
    events_p
    .join(broadcast(small_segments), "user_id")  # broadcast small (no shuffle)
    .join(orders_p, "user_id")                    # same partition (no shuffle)
)`,
            },
          ],
        },
        {
          id: 'production-checklist',
          title: 'Production Readiness Checklist',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'table',
              headers: ['Category', 'Check', 'Why it matters'],
              rows: [
                ['Config', 'AQE enabled', 'Free 30-70% speedup'],
                ['Config', 'shuffle.partitions tuned for cluster size', 'Wrong value → OOM or slow'],
                ['Config', 'autoBroadcastJoinThreshold raised to 50MB', 'Catch more broadcast-eligible tables'],
                ['Config', 'Kryo serializer enabled', '2-10x less shuffle data'],
                ['Reads', 'Using Parquet or Delta (never CSV in production)', '10-100x faster reads'],
                ['Reads', 'Partition pruning verified (explain shows PartitionFilters)', 'Skips irrelevant data at storage level'],
                ['Reads', 'Schema defined explicitly (no inferSchema)', 'Avoids extra scan; more reliable'],
                ['Joins', 'All small tables broadcast', 'Eliminates shuffle on that side'],
                ['Joins', 'No join on nullable columns without null handling', 'Silent data loss'],
                ['Joins', 'Skew verified (check top-20 key counts)', 'One hot key kills the job'],
                ['Writes', 'Mode is "overwrite" or "append" (never default "error" in production)', 'Production jobs must be restartable'],
                ['Writes', 'Dynamic partition overwrite enabled for incremental loads', 'Prevent full table replacement'],
                ['Writes', 'coalesce() applied before write (avoid small files)', 'Small files slow future reads'],
                ['Memory', 'executor.memoryOverhead set to 1-2g for PySpark', 'Prevents container kill by YARN/K8s'],
                ['Memory', 'Caches always unpersist() at end of usage', 'Memory leak across pipeline steps'],
                ['Idempotency', 'Pipeline can be rerun without duplicate data', 'Cloud infra is unreliable; retries happen'],
                ['Testing', 'Unit tests with local[2] SparkSession', 'Catch regressions before production'],
              ],
            },
          ],
        },
      ],
    },

  ], // end chapters
} // end pysparkTheory
