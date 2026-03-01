#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const XP_BY_DIFFICULTY = {
  easy: 40,
  medium: 80,
  hard: 120
};

const question = (
  moduleNumber,
  questionNumber,
  difficulty,
  prompt,
  options,
  correctAnswer,
  explanation,
  tags
) => ({
  id: `pyspark-m${String(moduleNumber).padStart(2, '0')}-${String(questionNumber).padStart(3, '0')}`,
  topic: 'pyspark',
  difficulty,
  type: 'multiple-choice',
  question: prompt,
  options,
  correctAnswer,
  explanation,
  xpReward: XP_BY_DIFFICULTY[difficulty],
  tags: [`module-${String(moduleNumber).padStart(2, '0')}`, ...tags]
});

const pysparkQuestions = [
  question(
    1,
    1,
    'easy',
    'Why did vertical scaling stop being a reliable answer for big-data workloads?',
    [
      'It eventually hit physical and financial limits',
      'It only worked for Python jobs',
      'It prevented SQL joins',
      'It required streaming-only architectures'
    ],
    'It eventually hit physical and financial limits',
    'Single-machine upgrades became too expensive and still could not keep up with exponential data growth.',
    ['history', 'scaling', 'fundamentals']
  ),
  question(
    1,
    2,
    'medium',
    'Why is veracity especially important in a smart-grid data platform?',
    [
      'Bad readings can trigger wrong operational decisions at scale',
      'It removes the need for schema design',
      'It guarantees every dataset fits in memory',
      'It eliminates the need for feature engineering'
    ],
    'Bad readings can trigger wrong operational decisions at scale',
    'At utility scale, missing or corrupted readings can lead to false alerts, bad forecasts, or even harmful automated actions.',
    ['veracity', 'smart-grid', 'data-quality']
  ),
  question(
    1,
    3,
    'hard',
    'What made Spark fundamentally faster than classic MapReduce for iterative analytics?',
    [
      'It could keep working data in memory and avoid repeated disk writes',
      'It automatically removed all shuffle operations',
      'It always executed on GPUs',
      'It stored every dataset as a single partition'
    ],
    'It could keep working data in memory and avoid repeated disk writes',
    'Spark’s in-memory execution model reduces repeated disk I/O, which is the main reason it outperformed MapReduce on iterative workloads.',
    ['spark', 'mapreduce', 'performance']
  ),
  question(
    2,
    1,
    'easy',
    'What is the main role of `SparkSession` in a PySpark application?',
    [
      'It is the driver-side entry point that builds and coordinates plans',
      'It stores all partitions directly on executors',
      'It replaces the need for DataFrames',
      'It writes output files automatically after every transformation'
    ],
    'It is the driver-side entry point that builds and coordinates plans',
    'SparkSession lives on the driver and serves as the entry point for creating DataFrames and submitting work.',
    ['sparksession', 'driver', 'dataframes']
  ),
  question(
    2,
    2,
    'medium',
    'What is the biggest risk of calling `collect()` on a very large dataset?',
    [
      'It can overwhelm driver memory',
      'It disables the Catalyst optimizer',
      'It forces Spark to write CSV output',
      'It prevents lazy evaluation from working'
    ],
    'It can overwhelm driver memory',
    'collect() moves data to the driver process, so it becomes dangerous when the result is too large to fit comfortably in driver memory.',
    ['actions', 'driver', 'collect']
  ),
  question(
    2,
    3,
    'hard',
    'When reducing the number of output partitions before a write, which operation is usually cheaper?',
    [
      'coalesce()',
      'repartition()',
      'collect()',
      'cache()'
    ],
    'coalesce()',
    'coalesce() can often reduce partitions without paying for a full shuffle, making it the cheaper option in common write-down scenarios.',
    ['partitioning', 'coalesce', 'performance']
  ),
  question(
    3,
    1,
    'easy',
    'In which Catalyst phase are rules like predicate pushdown and projection pruning applied?',
    [
      'Optimized logical plan',
      'Unresolved logical plan',
      'Python parsing stage',
      'Shuffle write stage'
    ],
    'Optimized logical plan',
    'Catalyst applies optimization rules after analysis, producing the optimized logical plan.',
    ['catalyst', 'optimizer', 'execution-plan']
  ),
  question(
    3,
    2,
    'medium',
    'What usually creates a new stage in Spark execution?',
    [
      'A shuffle boundary caused by a wide dependency',
      'Every single transformation',
      'Every executor heartbeat',
      'Any call to printSchema()'
    ],
    'A shuffle boundary caused by a wide dependency',
    'Spark splits stages where data must be redistributed across partitions, which is the hallmark of a wide dependency.',
    ['stages', 'shuffle', 'dag']
  ),
  question(
    3,
    3,
    'hard',
    'If a stage has 500 partitions, how many tasks will Spark generally create for that stage?',
    [
      '500',
      '50',
      '5',
      'It depends only on driver memory'
    ],
    '500',
    'Spark commonly schedules one task per partition for a given stage.',
    ['tasks', 'partitions', 'parallelism']
  ),
  question(
    4,
    1,
    'easy',
    'Which Spark UI metrics most directly reveal spill pressure?',
    [
      'Memory Bytes Spilled and Disk Bytes Spilled',
      'Application name and Spark version',
      'Executor CPU model and hostname',
      'Rows Written and SQL text only'
    ],
    'Memory Bytes Spilled and Disk Bytes Spilled',
    'Those metrics show that Spark had to spill intermediate data because memory pressure was too high.',
    ['spark-ui', 'spill', 'monitoring']
  ),
  question(
    4,
    2,
    'medium',
    'For a 1 TB fact table joined to a 5 MB dimension table, what is usually the best first optimization to try?',
    [
      'Broadcast the small dimension table',
      'Force both tables into one partition',
      'Disable adaptive execution',
      'Call collect() on the dimension first'
    ],
    'Broadcast the small dimension table',
    'Broadcasting the tiny side avoids shuffling the massive fact table and is often the highest-leverage first move.',
    ['broadcast', 'joins', 'fact-dimension']
  ),
  question(
    4,
    3,
    'hard',
    'What is the goal of salting a skewed join key?',
    [
      'Split a hot key into multiple pseudo-keys so the workload spreads across partitions',
      'Encrypt the join column before shuffling',
      'Reduce every partition to one row',
      'Guarantee that Spark chooses a broadcast join'
    ],
    'Split a hot key into multiple pseudo-keys so the workload spreads across partitions',
    'Salting breaks up dominant keys so they no longer concentrate almost all work in a single partition.',
    ['salting', 'skew', 'performance']
  ),
  question(
    5,
    1,
    'easy',
    'Which join type should you use to find rows from the left dataset that have no match on the right?',
    [
      'LEFT ANTI JOIN',
      'INNER JOIN',
      'CROSS JOIN',
      'LEFT SEMI JOIN'
    ],
    'LEFT ANTI JOIN',
    'A left anti join returns only the unmatched rows from the left side, which makes it useful for orphan detection and data quality checks.',
    ['joins', 'anti-join', 'data-quality']
  ),
  question(
    5,
    2,
    'medium',
    'Why are window functions often preferable to self-joins for tasks like ranking and lagging within groups?',
    [
      'They often avoid the extra shuffle and duplication costs of self-joins',
      'They force all rows into a single executor',
      'They work only in local mode',
      'They automatically cache every intermediate result'
    ],
    'They often avoid the extra shuffle and duplication costs of self-joins',
    'Window functions can express per-group calculations directly, often with less data movement than a separate self-join pattern.',
    ['window-functions', 'joins', 'shuffle']
  ),
  question(
    5,
    3,
    'hard',
    'When is a broadcast hash join a strong candidate?',
    [
      'When one side is small enough to fit in executor memory and broadcasting avoids shuffling the large side',
      'When both sides are far too large to move over the network',
      'Only when the join key is always unique',
      'Only when using Python UDFs on the join condition'
    ],
    'When one side is small enough to fit in executor memory and broadcasting avoids shuffling the large side',
    'Broadcast joins shine when one table is genuinely small, because Spark can send it to executors and keep the large table in place.',
    ['broadcast-hash-join', 'executor-memory', 'optimization']
  ),
  question(
    6,
    1,
    'easy',
    'What is the scope of `createOrReplaceTempView()`?',
    [
      'The current SparkSession',
      'Every Spark cluster in the company',
      'Only the current executor',
      'Only notebook cells that run after a cache() call'
    ],
    'The current SparkSession',
    'A temporary view created this way is visible inside the current SparkSession and disappears when that session ends.',
    ['spark-sql', 'temp-view', 'catalog']
  ),
  question(
    6,
    2,
    'medium',
    'What does `spark.sql(...)` return?',
    [
      'A DataFrame',
      'A Python list of rows',
      'A JDBC connection',
      'A permanent table definition'
    ],
    'A DataFrame',
    'Spark SQL queries return DataFrames, so you can continue chaining DataFrame operations after a SQL statement.',
    ['spark-sql', 'dataframe', 'api']
  ),
  question(
    6,
    3,
    'hard',
    'What is the key architectural relationship between Spark SQL and the DataFrame API?',
    [
      'They are two interfaces to the same engine and optimizer',
      'SQL always bypasses Catalyst while DataFrames use it',
      'DataFrames can run on executors but SQL can only run on the driver',
      'SQL is faster only because it disables Tungsten'
    ],
    'They are two interfaces to the same engine and optimizer',
    'Both Spark SQL and DataFrames converge on Catalyst and the same physical execution machinery.',
    ['catalyst', 'spark-sql', 'dataframes']
  ),
  question(
    7,
    1,
    'easy',
    'In the medallion architecture, which layer should contain cleaned, standardized, analytics-ready base records?',
    [
      'Silver',
      'Bronze',
      'Gold',
      'Archive'
    ],
    'Silver',
    'Silver is where raw data is cleaned, typed, deduplicated, and standardized before business-ready modeling happens in gold.',
    ['medallion', 'silver', 'data-cleaning']
  ),
  question(
    7,
    2,
    'medium',
    'What is a common distributed pattern for deterministic deduplication when you want to keep the latest record per business key?',
    [
      'Use `row_number()` over a partitioned window ordered by recency, then keep rank 1',
      'Use `collect()` and deduplicate locally on the driver',
      'Sort the whole dataset into one partition and overwrite it',
      'Replace every duplicate with NULL values'
    ],
    'Use `row_number()` over a partitioned window ordered by recency, then keep rank 1',
    'A windowed row_number pattern is a standard, scalable way to keep the latest or best row per key.',
    ['deduplication', 'window-functions', 'silver']
  ),
  question(
    7,
    3,
    'hard',
    'What should a quality gate do when a transformed dataset fails critical validation rules?',
    [
      'Block promotion to the next layer and surface the failure clearly',
      'Silently write the bad data to gold anyway',
      'Retry forever until the rules pass automatically',
      'Delete the raw data that caused the failure'
    ],
    'Block promotion to the next layer and surface the failure clearly',
    'A quality gate exists to stop bad data from contaminating downstream layers while making the failure visible for investigation.',
    ['quality-gates', 'validation', 'medallion']
  ),
  question(
    8,
    1,
    'easy',
    'What does `explode()` do to an array column?',
    [
      'Turns each element into its own row',
      'Converts the array into a map',
      'Drops the array column entirely',
      'Sends the array back to the driver'
    ],
    'Turns each element into its own row',
    'explode() expands one array-valued row into many rows, one per element.',
    ['arrays', 'explode', 'nested-data']
  ),
  question(
    8,
    2,
    'medium',
    'What is a Spark `struct` best understood as?',
    [
      'A single column that groups named nested fields together',
      'A storage format that replaces Parquet',
      'A table-level partitioning strategy',
      'A command that caches every row in memory'
    ],
    'A single column that groups named nested fields together',
    'Structs model nested records, letting one column contain multiple named fields such as address.city and address.zip.',
    ['structs', 'nested-data', 'schema']
  ),
  question(
    8,
    3,
    'hard',
    'What is a major risk when exploding nested collections too early in a pipeline?',
    [
      'You can multiply row counts dramatically and create unnecessary shuffle cost',
      'Spark stops supporting schema evolution',
      'Executors can no longer read JSON',
      'The DataFrame API becomes SQL-only'
    ],
    'You can multiply row counts dramatically and create unnecessary shuffle cost',
    'Exploding arrays or maps too early can blow up the dataset size, which then makes every downstream operation more expensive.',
    ['explode', 'performance', 'nested-json']
  ),
  question(
    9,
    1,
    'easy',
    'Why should you prefer built-in Spark functions over Python UDFs when possible?',
    [
      'Built-ins stay inside Spark’s optimized engine and avoid Python serialization overhead',
      'Python UDFs can only run on the driver',
      'Built-ins are the only functions allowed in notebooks',
      'Python UDFs always disable partitioning'
    ],
    'Built-ins stay inside Spark’s optimized engine and avoid Python serialization overhead',
    'Built-in expressions remain visible to Catalyst and avoid the Python/JVM crossing costs that make UDFs slower.',
    ['udf', 'performance', 'built-ins']
  ),
  question(
    9,
    2,
    'medium',
    'What is the main benefit of a pandas UDF compared with a row-at-a-time Python UDF?',
    [
      'It processes data in vectorized Arrow-backed batches',
      'It removes the need for executors',
      'It guarantees zero serialization cost',
      'It only works on a single partition at a time'
    ],
    'It processes data in vectorized Arrow-backed batches',
    'pandas UDFs use vectorized batches and Arrow, which makes them much more efficient than one-row-at-a-time Python UDFs.',
    ['pandas-udf', 'arrow', 'vectorization']
  ),
  question(
    9,
    3,
    'hard',
    'When is a grouped map UDF justified?',
    [
      'When you need custom per-group logic that built-in functions cannot express cleanly',
      'Whenever a simple `groupBy().agg()` is available',
      'Only when the dataset fits on the driver',
      'Only for joins with broadcast hints'
    ],
    'When you need custom per-group logic that built-in functions cannot express cleanly',
    'Grouped map UDFs are a more expensive escape hatch, so they are best reserved for genuinely custom per-group logic.',
    ['grouped-map-udf', 'custom-logic', 'tradeoffs']
  ),
  question(
    10,
    1,
    'easy',
    'What makes a dataset “unbounded” in Structured Streaming?',
    [
      'New records keep arriving continuously over time',
      'It has more than one partition',
      'It cannot be written to Parquet',
      'It uses SQL instead of DataFrames'
    ],
    'New records keep arriving continuously over time',
    'An unbounded dataset has no fixed final size because events continue to arrive.',
    ['streaming', 'unbounded-data', 'structured-streaming']
  ),
  question(
    10,
    2,
    'medium',
    'Why is a checkpoint location essential in Structured Streaming?',
    [
      'It stores offsets and state so the stream can recover correctly after failures',
      'It converts the stream into a batch job',
      'It permanently disables watermarking',
      'It avoids the need for output sinks'
    ],
    'It stores offsets and state so the stream can recover correctly after failures',
    'Checkpoints preserve the stream’s progress and state so restarts can resume safely instead of duplicating or losing work.',
    ['checkpointing', 'fault-tolerance', 'streaming']
  ),
  question(
    10,
    3,
    'hard',
    'When is append mode a good fit for a streaming sink?',
    [
      'When emitted rows will not need to be revised later',
      'When every aggregation must update historical output rows repeatedly',
      'When the sink cannot accept any new data after startup',
      'When you want to materialize a global sort every micro-batch'
    ],
    'When emitted rows will not need to be revised later',
    'Append mode works best when records can be written once and left alone, rather than updated after more late data arrives.',
    ['append-mode', 'output-modes', 'watermarking']
  ),
  question(
    11,
    1,
    'easy',
    'What does Delta Lake add on top of a regular data lake?',
    [
      'ACID transactions and reliable table semantics',
      'A requirement to store everything as CSV',
      'Automatic GPU acceleration',
      'A ban on schema evolution'
    ],
    'ACID transactions and reliable table semantics',
    'Delta Lake brings transactionality, consistency, and other database-like guarantees to lake storage.',
    ['delta-lake', 'acid', 'lakehouse']
  ),
  question(
    11,
    2,
    'medium',
    'Which Delta Lake command pattern is commonly used for upserts?',
    [
      'MERGE',
      'collect()',
      'cache()',
      'describe()'
    ],
    'MERGE',
    'MERGE lets you match existing rows and then update or insert as needed, which is the core upsert pattern in Delta Lake.',
    ['merge', 'upsert', 'delta-lake']
  ),
  question(
    11,
    3,
    'hard',
    'What does Delta Lake time travel allow you to do?',
    [
      'Query an earlier version of the table',
      'Recover deleted driver logs only',
      'Broadcast a table automatically to every executor',
      'Convert all historical files into a single partition'
    ],
    'Query an earlier version of the table',
    'Time travel lets you inspect or restore earlier table states, which is useful for debugging, audits, and rollback workflows.',
    ['time-travel', 'versioning', 'delta']
  ),
  question(
    12,
    1,
    'easy',
    'What is the purpose of a unit test in a data pipeline codebase?',
    [
      'Validate a small transformation or helper in isolation',
      'Benchmark an entire production cluster',
      'Replace observability and alerting',
      'Guarantee that source data is always clean'
    ],
    'Validate a small transformation or helper in isolation',
    'Unit tests target focused logic so bugs can be caught quickly without needing the whole pipeline to run.',
    ['testing', 'unit-tests', 'quality']
  ),
  question(
    12,
    2,
    'medium',
    'What does an integration test usually add beyond unit tests in a Spark project?',
    [
      'It exercises multiple pipeline pieces together against realistic data slices',
      'It proves that no schema will ever change',
      'It removes the need for production monitoring',
      'It guarantees zero runtime cost'
    ],
    'It exercises multiple pipeline pieces together against realistic data slices',
    'Integration tests verify that several components work together, often in a local Spark runtime with representative inputs.',
    ['integration-tests', 'spark-local', 'pipeline']
  ),
  question(
    12,
    3,
    'hard',
    'What does observability give you that a one-time test suite cannot?',
    [
      'Continuous visibility into freshness, volume, failures, and anomalies in production',
      'A guarantee that every future schema change is harmless',
      'Automatic elimination of all bad source data',
      'A way to avoid writing alerts entirely'
    ],
    'Continuous visibility into freshness, volume, failures, and anomalies in production',
    'Tests validate expected behavior ahead of time; observability tells you what is happening in the live system right now.',
    ['observability', 'freshness', 'monitoring']
  ),
  question(
    13,
    1,
    'easy',
    'In `spark-submit --deploy-mode cluster`, where does the driver run?',
    [
      'Inside the cluster',
      'Only on your laptop',
      'Inside every executor at once',
      'In the metadata catalog'
    ],
    'Inside the cluster',
    'Cluster mode moves the driver off the submitting machine and into the cluster environment.',
    ['spark-submit', 'cluster-mode', 'driver']
  ),
  question(
    13,
    2,
    'medium',
    'What is an Airflow DAG primarily used to model?',
    [
      'Task dependencies, scheduling, and retries across a workflow',
      'The physical layout of parquet files on disk',
      'Python virtual environment resolution only',
      'Spark executor JVM memory pages'
    ],
    'Task dependencies, scheduling, and retries across a workflow',
    'An Airflow DAG describes what tasks exist, how they depend on each other, and how they should be scheduled and retried.',
    ['airflow', 'orchestration', 'dag']
  ),
  question(
    13,
    3,
    'hard',
    'Why package a PySpark project as a wheel or zip for `--py-files`?',
    [
      'To ship versioned application code and dependencies to the cluster consistently',
      'To force Spark to use only local mode',
      'To disable retries after task failure',
      'To remove the need for configuration files'
    ],
    'To ship versioned application code and dependencies to the cluster consistently',
    'Packaging makes deployments repeatable and avoids the fragile “copy files around manually” pattern.',
    ['packaging', 'py-files', 'deployment']
  ),
  question(
    14,
    1,
    'easy',
    'What does the principle of least privilege mean in a data platform?',
    [
      'Give each user or service only the access it genuinely needs',
      'Grant admin rights to everyone for simplicity',
      'Store all data in one unrestricted bucket',
      'Disable audit logging to improve performance'
    ],
    'Give each user or service only the access it genuinely needs',
    'Least privilege reduces blast radius by ensuring identities have only the permissions required for their role.',
    ['security', 'least-privilege', 'governance']
  ),
  question(
    14,
    2,
    'medium',
    'Which control is most appropriate when analysts need a dataset but should not see raw PII values?',
    [
      'Column masking or tokenization',
      'Broadcast joins',
      'coalesce(1)',
      'Disabling the metastore'
    ],
    'Column masking or tokenization',
    'Masking or tokenization preserves utility while reducing exposure of sensitive information.',
    ['pii', 'masking', 'access-control']
  ),
  question(
    14,
    3,
    'hard',
    'Why is lineage especially valuable before making a breaking schema change?',
    [
      'It reveals which downstream jobs, dashboards, and consumers will be affected',
      'It automatically fixes incompatible data types',
      'It eliminates the need for access reviews',
      'It guarantees that no pipeline will fail'
    ],
    'It reveals which downstream jobs, dashboards, and consumers will be affected',
    'Lineage gives you impact awareness, which is essential before changing schemas, contracts, or access patterns.',
    ['lineage', 'schema-change', 'impact-analysis']
  ),
  question(
    15,
    1,
    'easy',
    'What does `partitionBy(...)` do in a window specification?',
    [
      'Defines the logical groups over which the window calculation resets',
      'Physically repartitions the entire table on disk',
      'Broadcasts each group to every executor',
      'Caches the window output automatically'
    ],
    'Defines the logical groups over which the window calculation resets',
    'partitionBy groups rows for the window function so calculations restart within each partition key.',
    ['window-functions', 'partitionBy', 'analytics']
  ),
  question(
    15,
    2,
    'medium',
    'How does `dense_rank()` differ from `rank()` when there are ties?',
    [
      'dense_rank() does not leave gaps after ties',
      'dense_rank() ignores ordering completely',
      'rank() can only be used with strings',
      'rank() always runs faster because it skips sorting'
    ],
    'dense_rank() does not leave gaps after ties',
    'rank() can leave gaps after ties, while dense_rank() keeps the numbering compact.',
    ['dense-rank', 'rank', 'window-functions']
  ),
  question(
    15,
    3,
    'hard',
    'Which window function is the most direct way to compare a row with the previous row in the same ordered group?',
    [
      'lag()',
      'explode()',
      'collect_list()',
      'broadcast()'
    ],
    'lag()',
    'lag() lets you access prior rows without needing a separate self-join, which makes it a core building block for sequential analysis.',
    ['lag', 'time-series', 'window-functions']
  ),
  question(
    16,
    1,
    'easy',
    'What is one of Adaptive Query Execution’s main benefits?',
    [
      'It can adjust strategies like shuffle partition counts or join choices at runtime',
      'It permanently removes all shuffles from a query',
      'It moves every job into streaming mode',
      'It stores every DataFrame in memory automatically'
    ],
    'It can adjust strategies like shuffle partition counts or join choices at runtime',
    'AQE uses runtime information to improve the plan instead of relying only on static estimates.',
    ['aqe', 'runtime-optimization', 'spark']
  ),
  question(
    16,
    2,
    'medium',
    'What does a long tail of one or two very slow tasks usually suggest?',
    [
      'Skew or straggler behavior',
      'Perfectly balanced partitions',
      'A successful broadcast of every table',
      'That the driver has already cached the result'
    ],
    'Skew or straggler behavior',
    'A long tail in task duration is a classic signal that one partition or one node is doing disproportionately more work.',
    ['skew', 'stragglers', 'spark-ui']
  ),
  question(
    16,
    3,
    'hard',
    'When is caching a DataFrame most justified?',
    [
      'When the same expensive dataset will be reused multiple times',
      'When the dataset is used once and immediately discarded',
      'Whenever a DataFrame contains fewer than ten columns',
      'Only after collecting the DataFrame to the driver'
    ],
    'When the same expensive dataset will be reused multiple times',
    'Caching is a tradeoff, so it pays off when recomputation would otherwise be repeated and expensive.',
    ['cache', 'reuse', 'performance']
  ),
  question(
    17,
    1,
    'easy',
    'In dimensional modeling, what does a fact table primarily store?',
    [
      'Measurable business events at a defined grain',
      'Only free-form text fields',
      'Security roles and permissions',
      'One row per ETL job'
    ],
    'Measurable business events at a defined grain',
    'Fact tables store the measurable events or transactions, while dimensions provide descriptive context.',
    ['fact-table', 'dimensional-modeling', 'lakehouse']
  ),
  question(
    17,
    2,
    'medium',
    'What is the defining property of an SCD Type 2 dimension?',
    [
      'It preserves full history by adding new rows for changes',
      'It overwrites history in place and keeps only the latest value',
      'It stores every field as a nested array',
      'It can only be used in streaming pipelines'
    ],
    'It preserves full history by adding new rows for changes',
    'SCD Type 2 tracks historical changes with new records, often using effective dates and a current-row indicator.',
    ['scd-type-2', 'dimensions', 'history']
  ),
  question(
    17,
    3,
    'hard',
    'Where do dimensional models most naturally belong in a medallion-style lakehouse?',
    [
      'Gold, because they are curated for business-facing analytics',
      'Bronze, because they should remain raw and unmodeled',
      'Checkpoint storage, because they are part of streaming state',
      'Executor local disks, because they are temporary only'
    ],
    'Gold, because they are curated for business-facing analytics',
    'Dimensional models are usually a gold-layer concern because they reflect curated, stable analytics structures rather than raw ingestion.',
    ['gold-layer', 'star-schema', 'medallion']
  ),
  question(
    18,
    1,
    'easy',
    'What is the pandas API on Spark designed to provide?',
    [
      'Pandas-like syntax backed by Spark’s distributed engine',
      'A replacement for all SQL capabilities',
      'A way to run every job on the driver only',
      'A storage format that replaces Delta Lake'
    ],
    'Pandas-like syntax backed by Spark’s distributed engine',
    'The pandas API on Spark aims to make distributed work more approachable for teams familiar with pandas syntax.',
    ['pandas-api-on-spark', 'migration', 'spark']
  ),
  question(
    18,
    2,
    'medium',
    'What is the main danger of calling `to_pandas()` on a large distributed DataFrame?',
    [
      'It collects the data to driver memory',
      'It permanently disables Arrow',
      'It turns the dataset into streaming state',
      'It forces Spark to drop nested columns'
    ],
    'It collects the data to driver memory',
    'to_pandas() materializes the data locally, so it is only safe when the result is genuinely small enough for the driver.',
    ['to-pandas', 'driver-memory', 'pandas']
  ),
  question(
    18,
    3,
    'hard',
    'When is the pandas API on Spark a particularly good fit?',
    [
      'When a pandas-heavy workflow has outgrown one machine but the team wants a familiar API surface',
      'When you need the absolute minimum abstraction over JVM internals',
      'Only when the dataset already fits easily in local RAM',
      'Only when every transformation must be expressed in SQL'
    ],
    'When a pandas-heavy workflow has outgrown one machine but the team wants a familiar API surface',
    'It is especially useful as a migration bridge for pandas users who need scale without abandoning familiar idioms immediately.',
    ['migration', 'pandas', 'distributed-compute']
  ),
  question(
    19,
    1,
    'easy',
    'What is the standard medallion flow for moving data toward business use?',
    [
      'Bronze → Silver → Gold',
      'Gold → Bronze → Silver',
      'Silver → Bronze → Archive',
      'Gold → Checkpoint → Bronze'
    ],
    'Bronze → Silver → Gold',
    'Bronze captures raw inputs, silver cleans and standardizes them, and gold serves curated business-ready outputs.',
    ['medallion', 'bronze', 'silver', 'gold']
  ),
  question(
    19,
    2,
    'medium',
    'Which Spark capability is the natural fit for near-real-time anomaly detection in a capstone data platform?',
    [
      'Structured Streaming',
      'collect()',
      'coalesce(1)',
      'Static repartition hints only'
    ],
    'Structured Streaming',
    'Structured Streaming is designed for continuously arriving event data and near-real-time reactions like alerting.',
    ['structured-streaming', 'anomaly-detection', 'capstone']
  ),
  question(
    19,
    3,
    'hard',
    'Which capstone design best signals senior data-engineering judgment?',
    [
      'An end-to-end architecture with layered data, quality gates, observability, and clear operational tradeoffs',
      'A notebook that prints sample rows and nothing else',
      'A single script that rewrites every table in one partition nightly',
      'A dashboard mockup without ingestion or validation logic'
    ],
    'An end-to-end architecture with layered data, quality gates, observability, and clear operational tradeoffs',
    'Senior-level work is visible in system boundaries, quality controls, operations, and explicit tradeoffs, not just in a working notebook demo.',
    ['capstone', 'architecture', 'senior-engineering']
  ),
  question(
    20,
    1,
    'easy',
    'What makes a performance-improvement story stronger in an interview?',
    [
      'Specific before-and-after metrics tied to the diagnosed root cause',
      'Saying the pipeline became “much faster” without numbers',
      'Avoiding any mention of tradeoffs or measurement',
      'Focusing only on the UI theme of the dashboard'
    ],
    'Specific before-and-after metrics tied to the diagnosed root cause',
    'Interviewers look for measurement discipline: what was slow, how you proved it, what changed, and what the new result was.',
    ['interviews', 'performance-story', 'career']
  ),
  question(
    20,
    2,
    'medium',
    'What should a strong data-platform system-design answer usually cover?',
    [
      'Scale, SLAs, failure handling, data quality, and operational tradeoffs',
      'Only syntax details from one API',
      'Only the color palette of the UI',
      'Only the exact Spark version number'
    ],
    'Scale, SLAs, failure handling, data quality, and operational tradeoffs',
    'Good system-design answers show that you can think about reliability, scale, contracts, and operations together.',
    ['system-design', 'interviews', 'architecture']
  ),
  question(
    20,
    3,
    'hard',
    'Which portfolio project is most likely to convince a hiring manager that you understand distributed data engineering?',
    [
      'A project that explains data volume, architecture, testing, observability, and business impact with evidence',
      'A repository with screenshots but no code or design notes',
      'A local notebook that never touches realistic scale or failure cases',
      'A slide deck with no runnable assets or metrics'
    ],
    'A project that explains data volume, architecture, testing, observability, and business impact with evidence',
    'The strongest portfolio work demonstrates how you reasoned about distributed constraints and operational quality, not just that you produced outputs.',
    ['portfolio', 'career', 'distributed-systems']
  )
];

const validateQuestions = (questions) => {
  const ids = new Set();

  questions.forEach((entry) => {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate question id: ${entry.id}`);
    }
    ids.add(entry.id);

    if (!Array.isArray(entry.options) || entry.options.length !== 4) {
      throw new Error(`Question ${entry.id} must contain exactly 4 options.`);
    }

    if (!entry.options.includes(entry.correctAnswer)) {
      throw new Error(`Question ${entry.id} correct answer must appear in options.`);
    }
  });
};

const updateQuestionsIndex = (repoRoot, questions) => {
  const indexPath = path.join(repoRoot, 'data', 'questions', 'index.json');
  const indexPayload = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  indexPayload.topics = indexPayload.topics ?? {};
  indexPayload.questions = indexPayload.questions ?? {};
  indexPayload.topics.pyspark = {
    name: 'PySpark Modules',
    icon: '🔥',
    description: 'Twenty-module practice bank for distributed PySpark engineering',
    totalQuestions: questions.length
  };
  indexPayload.questions.pyspark = questions;
  fs.writeFileSync(indexPath, `${JSON.stringify(indexPayload, null, 2)}\n`, 'utf8');
};

const main = () => {
  validateQuestions(pysparkQuestions);

  const repoRoot = path.resolve(__dirname, '..');
  const bankPath = path.join(repoRoot, 'data', 'questions', 'pyspark.json');

  fs.writeFileSync(
    bankPath,
    `${JSON.stringify({ questions: pysparkQuestions }, null, 2)}\n`,
    'utf8'
  );
  updateQuestionsIndex(repoRoot, pysparkQuestions);

  process.stdout.write(
    `Generated ${pysparkQuestions.length} PySpark questions -> ${bankPath}\n`
  );
};

if (require.main === module) {
  main();
}
