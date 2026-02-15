// data/learn/pyspark.ts
// Exhaustive PySpark Reference - optimized for large-scale data (billions of rows)

import { CheatSheet } from '@/types/learn'

export const pysparkData: CheatSheet = {
  topic: 'pyspark',
  title: 'PySpark Reference',
  description: 'Complete PySpark DataFrame API — every major function, with optimization notes for billion-row datasets.',
  version: 'Spark 3.4+',

  categories: [
    { id: 'session',        label: 'SparkSession',       description: 'Initialize and configure Spark', count: 6 },
    { id: 'reading',        label: 'Reading Data',        description: 'Load data into DataFrames',      count: 8 },
    { id: 'writing',        label: 'Writing Data',        description: 'Save DataFrames to storage',     count: 6 },
    { id: 'schema',         label: 'Schema & Types',      description: 'Inspect and define schemas',     count: 7 },
    { id: 'select',         label: 'Select & Rename',     description: 'Choose and rename columns',      count: 6 },
    { id: 'filtering',      label: 'Filtering',           description: 'Filter rows by condition',       count: 7 },
    { id: 'transformations',label: 'Transformations',     description: 'Add and modify columns',         count: 10 },
    { id: 'strings',        label: 'String Functions',    description: 'Manipulate string columns',      count: 12 },
    { id: 'dates',          label: 'Date & Time',         description: 'Work with dates and timestamps', count: 10 },
    { id: 'math',           label: 'Math Functions',      description: 'Numeric operations',             count: 8 },
    { id: 'nulls',          label: 'Nulls & Defaults',    description: 'Handle missing values',          count: 6 },
    { id: 'aggregations',   label: 'Aggregations',        description: 'Group and aggregate data',       count: 12 },
    { id: 'joins',          label: 'Joins',               description: 'Combine multiple DataFrames',    count: 8 },
    { id: 'window',         label: 'Window Functions',    description: 'Row-level windowed calculations',count: 10 },
    { id: 'arrays',         label: 'Arrays & Maps',       description: 'Complex type operations',        count: 10 },
    { id: 'sorting',        label: 'Sorting & Ranking',   description: 'Order and rank rows',            count: 5 },
    { id: 'dedup',          label: 'Dedup & Sampling',    description: 'Remove duplicates, sample rows', count: 5 },
    { id: 'actions',        label: 'Actions',             description: 'Trigger computation',            count: 8 },
    { id: 'performance',    label: 'Performance',         description: 'Optimize for scale',             count: 14 },
    { id: 'udf',            label: 'UDFs & Pandas UDFs',  description: 'Custom functions at scale',      count: 5 },
    { id: 'streaming',      label: 'Structured Streaming',description: 'Real-time data processing',      count: 6 },
  ],

  functions: [

    // ─────────────────────────────────────────────
    // SPARKSESSION
    // ─────────────────────────────────────────────
    {
      id: 'sparksession-builder',
      name: 'SparkSession.builder',
      category: 'session',
      syntax: 'SparkSession.builder.appName("name").config("key", "value").getOrCreate()',
      shortDescription: 'Create or retrieve the Spark entry point',
      longDescription: `SparkSession is the single entry point to all PySpark functionality. Use .builder to configure it. getOrCreate() reuses an existing session if one is running (useful in notebooks). In production, configure memory, cores, and serializer here rather than after the fact.`,
      parameters: [
        { name: 'appName', type: 'str', required: true, description: 'Application name shown in Spark UI' },
        { name: 'config', type: 'str, str', required: false, description: 'Set Spark configuration key-value pairs' },
        { name: 'master', type: 'str', required: false, default: 'local[*]', description: 'Cluster URL or local[N] for local mode' },
      ],
      returns: 'SparkSession',
      examples: [
        {
          label: 'Production-grade session',
          code: `from pyspark.sql import SparkSession

spark = (SparkSession.builder
    .appName("MyETLJob")
    .master("yarn")
    .config("spark.executor.memory", "8g")
    .config("spark.executor.cores", "4")
    .config("spark.sql.shuffle.partitions", "800")
    .config("spark.sql.adaptive.enabled", "true")
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
    .getOrCreate()
)`,
        },
        {
          label: 'Local development session',
          code: `spark = (SparkSession.builder
    .appName("Dev")
    .master("local[*]")
    .config("spark.sql.shuffle.partitions", "8")  # low for local
    .getOrCreate()
)`,
        },
      ],
      notes: [
        'Always set spark.sql.shuffle.partitions — default 200 is too low for big data, too high for local dev',
        'Enable Adaptive Query Execution (AQE) in Spark 3.x for automatic optimization',
        'KryoSerializer is 10x faster than default Java serializer',
      ],
      performance: 'Set shuffle partitions = 2-4x number of executor cores for balanced parallelism.',
      tags: ['session', 'init', 'config', 'setup', 'sparksession'],
      difficulty: 'beginner',
    },

    {
      id: 'spark-conf',
      name: 'spark.conf.set()',
      category: 'session',
      syntax: 'spark.conf.set("spark.config.key", "value")',
      shortDescription: 'Set or change Spark config at runtime',
      longDescription: `spark.conf.set() lets you change Spark SQL configuration after the session is started. This is useful in interactive sessions to tune shuffle partitions, enable features, or toggle optimizations without restarting Spark.`,
      examples: [
        {
          label: 'Common runtime configs',
          code: `# Tune shuffle partitions dynamically
spark.conf.set("spark.sql.shuffle.partitions", "400")

# Enable Adaptive Query Execution (Spark 3.x)
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# Enable broadcast join threshold (bytes)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", str(50 * 1024 * 1024))  # 50MB

# Disable broadcast (force sort-merge join)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "-1")`,
        },
      ],
      notes: [
        'AQE (Adaptive Query Execution) is the single biggest free optimization in Spark 3.x',
        'autoBroadcastJoinThreshold default is 10MB — raise it if small tables fit in memory',
      ],
      tags: ['config', 'conf', 'settings', 'aqe', 'adaptive'],
      difficulty: 'intermediate',
    },

    {
      id: 'spark-catalog',
      name: 'spark.catalog',
      category: 'session',
      syntax: 'spark.catalog.listTables() / .cacheTable() / .clearCache()',
      shortDescription: 'Manage tables, databases, and cache via catalog API',
      longDescription: `The catalog API lets you list, inspect, cache, and drop tables in the Spark metastore. It's essential for managing Hive tables, temporary views, and cached datasets in long-running sessions.`,
      examples: [
        {
          label: 'Catalog operations',
          code: `# List all databases
spark.catalog.listDatabases()

# List tables in a database
spark.catalog.listTables("analytics")

# Cache a table in memory
spark.catalog.cacheTable("my_large_table")

# Clear all cached tables
spark.catalog.clearCache()

# Check if table is cached
spark.catalog.isCached("my_large_table")

# Drop a temp view
spark.catalog.dropTempView("my_temp_view")`,
        },
      ],
      tags: ['catalog', 'tables', 'cache', 'hive', 'metastore'],
      difficulty: 'intermediate',
    },

    // ─────────────────────────────────────────────
    // READING DATA
    // ─────────────────────────────────────────────
    {
      id: 'read-csv',
      name: 'spark.read.csv()',
      category: 'reading',
      syntax: 'spark.read.csv(path, header=True, inferSchema=True, sep=",")',
      shortDescription: 'Read CSV files into a DataFrame',
      longDescription: `Reads one or many CSV files from any supported path (local, HDFS, S3, GCS, ADLS). inferSchema adds a full scan pass — for large files always define the schema explicitly. Supports glob patterns for reading many files at once.`,
      parameters: [
        { name: 'path', type: 'str | list', required: true, description: 'File path or list of paths' },
        { name: 'header', type: 'bool', required: false, default: 'False', description: 'First row as column names' },
        { name: 'inferSchema', type: 'bool', required: false, default: 'False', description: 'Auto-detect types (extra scan)' },
        { name: 'sep', type: 'str', required: false, default: '","', description: 'Column delimiter' },
        { name: 'nullValue', type: 'str', required: false, default: '""', description: 'String to interpret as null' },
        { name: 'encoding', type: 'str', required: false, default: 'UTF-8', description: 'File encoding' },
        { name: 'schema', type: 'StructType', required: false, description: 'Explicit schema (avoids inferSchema scan)' },
      ],
      returns: 'DataFrame',
      examples: [
        {
          label: 'With explicit schema (production)',
          code: `from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType, DateType

schema = StructType([
    StructField("order_id",   StringType(),  True),
    StructField("order_date", DateType(),    True),
    StructField("customer",   StringType(),  True),
    StructField("amount",     DoubleType(),  True),
    StructField("quantity",   IntegerType(), True),
])

df = spark.read.csv(
    "s3://my-bucket/orders/2024/*.csv",
    header=True,
    schema=schema,
    nullValue="NULL",
)`,
        },
        {
          label: 'Read entire directory',
          code: `# All CSVs in a folder
df = spark.read.csv("s3://bucket/data/", header=True, inferSchema=True)

# Glob pattern
df = spark.read.csv("s3://bucket/data/year=2024/month=*/", header=True)`,
        },
      ],
      notes: [
        'Never use inferSchema in production — it doubles read time',
        'Prefer Parquet for large datasets: 10-100x faster than CSV',
        'Use nullValue="NULL" or nullValue="N/A" to handle null representations',
      ],
      performance: 'CSVs are splittable only when uncompressed or .bz2. Use snappy-compressed Parquet instead for large files.',
      tags: ['read', 'csv', 'load', 'input'],
      difficulty: 'beginner',
    },

    {
      id: 'read-parquet',
      name: 'spark.read.parquet()',
      category: 'reading',
      syntax: 'spark.read.parquet(path)',
      shortDescription: 'Read Parquet files — the preferred format for big data',
      longDescription: `Parquet is a columnar format optimized for analytics. Spark reads only the columns needed (column pruning) and skips irrelevant row groups (predicate pushdown), making it dramatically faster than CSV for large datasets. Always use Parquet for datasets over a few GB.`,
      examples: [
        {
          label: 'Basic Parquet read',
          code: `df = spark.read.parquet("s3://bucket/events/")
df.printSchema()
df.show(5)`,
        },
        {
          label: 'Partitioned Parquet (partition pruning)',
          code: `# Spark automatically prunes partitions when you filter on the partition column
df = spark.read.parquet("s3://bucket/events/year=2024/")

# Or read root and filter — Spark pushes filter down to skip folders
df = spark.read.parquet("s3://bucket/events/") \
    .filter("year = 2024 AND month = 3")`,
        },
        {
          label: 'Read with schema enforcement',
          code: `from pyspark.sql.types import StructType, StructField, LongType, StringType

schema = StructType([
    StructField("event_id",   LongType(),   True),
    StructField("event_type", StringType(), True),
])

df = spark.read.schema(schema).parquet("s3://bucket/events/")`,
        },
      ],
      notes: [
        'Parquet supports predicate pushdown — filters at read time, not after loading',
        'Column pruning: only selected columns are read from disk',
        'Partition by high-cardinality columns (date, region) for query efficiency',
      ],
      performance: 'Parquet reads are 10-100x faster than CSV for analytical queries. Use snappy compression for best balance of speed and size.',
      tags: ['read', 'parquet', 'columnar', 'performance'],
      difficulty: 'beginner',
    },

    {
      id: 'read-delta',
      name: 'spark.read.format("delta")',
      category: 'reading',
      syntax: 'spark.read.format("delta").load(path)',
      shortDescription: 'Read Delta Lake tables with ACID transactions',
      longDescription: `Delta Lake extends Parquet with ACID transactions, schema enforcement, time travel, and Z-ordering. It is the gold standard for data lakehouse architectures. Supports reading a specific version or timestamp for reproducibility and debugging.`,
      examples: [
        {
          label: 'Read Delta table',
          code: `df = spark.read.format("delta").load("s3://bucket/delta/orders")`,
        },
        {
          label: 'Time travel — read historical version',
          code: `# Read by version number
df = spark.read.format("delta") \
    .option("versionAsOf", 5) \
    .load("s3://bucket/delta/orders")

# Read by timestamp
df = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-15 00:00:00") \
    .load("s3://bucket/delta/orders")`,
        },
        {
          label: 'Read from Hive metastore',
          code: `df = spark.table("analytics.orders")  # registered Delta table`,
        },
      ],
      notes: [
        'Delta Lake enables UPDATE, DELETE, MERGE — impossible with raw Parquet',
        'Time travel lets you roll back mistakes or reproduce historical results',
        'Z-ordering dramatically speeds up queries on high-cardinality columns',
      ],
      performance: 'Delta OPTIMIZE + ZORDER BY query_column reduces data scanned by 10-100x for selective queries.',
      tags: ['delta', 'delta-lake', 'acid', 'time-travel', 'lakehouse'],
      difficulty: 'intermediate',
    },

    {
      id: 'read-json',
      name: 'spark.read.json()',
      category: 'reading',
      syntax: 'spark.read.json(path)',
      shortDescription: 'Read JSON files or JSON-per-line (JSONL)',
      longDescription: `PySpark reads newline-delimited JSON (one JSON object per line). It automatically infers the schema by sampling the data. For deeply nested JSON, use multiLine=True. For production, provide a schema to avoid the inference scan.`,
      examples: [
        {
          label: 'Read JSONL (one record per line)',
          code: `df = spark.read.json("s3://bucket/events/*.jsonl")
df.printSchema()`,
        },
        {
          label: 'Multi-line JSON files',
          code: `df = spark.read.option("multiLine", True).json("s3://bucket/api_response.json")`,
        },
        {
          label: 'With explicit schema',
          code: `from pyspark.sql.types import StructType, StructField, StringType, LongType, ArrayType

schema = StructType([
    StructField("user_id",  LongType(),              True),
    StructField("action",   StringType(),             True),
    StructField("tags",     ArrayType(StringType()),  True),
])

df = spark.read.schema(schema).json("s3://bucket/events/")`,
        },
      ],
      notes: [
        'JSON is the slowest format — convert to Parquet as the first step in your pipeline',
        'schema inference scans all files; always define schema for large datasets',
      ],
      tags: ['read', 'json', 'jsonl', 'nested'],
      difficulty: 'beginner',
    },

    {
      id: 'read-jdbc',
      name: 'spark.read.jdbc()',
      category: 'reading',
      syntax: 'spark.read.jdbc(url, table, properties)',
      shortDescription: 'Read from a JDBC database (Postgres, MySQL, etc.)',
      longDescription: `JDBC allows Spark to read directly from relational databases. Without partitioning, this creates a single-partition (single connection) read that is very slow for large tables. Always use numPartitions + partitionColumn for parallel reads.`,
      parameters: [
        { name: 'url', type: 'str', required: true, description: 'JDBC connection URL' },
        { name: 'table', type: 'str', required: true, description: 'Table name or SQL subquery' },
        { name: 'numPartitions', type: 'int', required: false, description: 'Parallel read partitions' },
        { name: 'partitionColumn', type: 'str', required: false, description: 'Column to partition reads on (numeric)' },
        { name: 'lowerBound', type: 'int', required: false, description: 'Min value of partitionColumn' },
        { name: 'upperBound', type: 'int', required: false, description: 'Max value of partitionColumn' },
        { name: 'fetchsize', type: 'int', required: false, default: '10', description: 'Rows per JDBC fetch call (increase for speed)' },
      ],
      returns: 'DataFrame',
      examples: [
        {
          label: 'Parallel read from PostgreSQL',
          code: `jdbc_url = "jdbc:postgresql://host:5432/mydb"
properties = {
    "user": "username",
    "password": "password",
    "driver": "org.postgresql.Driver",
    "fetchsize": "10000",   # batch size per round-trip
}

df = spark.read.jdbc(
    url=jdbc_url,
    table="orders",
    numPartitions=20,          # 20 parallel DB connections
    partitionColumn="order_id",
    lowerBound=1,
    upperBound=10_000_000,
    properties=properties,
)`,
        },
        {
          label: 'Read a SQL query',
          code: `query = "(SELECT order_id, customer_id, amount FROM orders WHERE status = 'completed') AS t"

df = spark.read.jdbc(url=jdbc_url, table=query, properties=properties)`,
        },
      ],
      notes: [
        'numPartitions creates N simultaneous DB connections — check your DB max connections',
        'partitionColumn must be numeric (integer or timestamp) for even distribution',
        'Use a WHERE pushdown query as the table argument to limit rows before transfer',
      ],
      performance: 'Default fetchsize=10 creates thousands of round trips. Set fetchsize=10000 for 100x faster reads.',
      tags: ['read', 'jdbc', 'database', 'postgres', 'mysql', 'sql', 'rdbms'],
      difficulty: 'intermediate',
    },

    {
      id: 'create-dataframe',
      name: 'spark.createDataFrame()',
      category: 'reading',
      syntax: 'spark.createDataFrame(data, schema)',
      shortDescription: 'Create a DataFrame from Python list, Pandas DataFrame, or RDD',
      longDescription: `createDataFrame() converts local Python data (lists, Pandas DataFrames, RDDs) into a distributed Spark DataFrame. For large data, avoid this — it brings all data to the driver first. Use it for small reference/lookup tables or unit tests.`,
      examples: [
        {
          label: 'From list of tuples',
          code: `from pyspark.sql.types import StructType, StructField, StringType, IntegerType

schema = StructType([
    StructField("name", StringType(),  True),
    StructField("age",  IntegerType(), True),
])

data = [("Alice", 30), ("Bob", 25), ("Carol", 35)]
df = spark.createDataFrame(data, schema=schema)
df.show()`,
        },
        {
          label: 'From Pandas DataFrame',
          code: `import pandas as pd

pdf = pd.DataFrame({"id": [1, 2, 3], "value": [10.5, 20.1, 30.9]})
df = spark.createDataFrame(pdf)`,
        },
      ],
      notes: [
        'All data passes through the driver — only use for small datasets',
        'Use spark.read for any data stored on disk or distributed storage',
      ],
      tags: ['create', 'dataframe', 'from-pandas', 'local', 'testing'],
      difficulty: 'beginner',
    },

    // ─────────────────────────────────────────────
    // WRITING DATA
    // ─────────────────────────────────────────────
    {
      id: 'write-parquet',
      name: 'df.write.parquet()',
      category: 'writing',
      syntax: 'df.write.mode("overwrite").parquet(path)',
      shortDescription: 'Write DataFrame to Parquet files',
      longDescription: `Writing to Parquet is the most important output operation in PySpark. Use partitionBy() to organize data on disk, coalesce/repartition to control file sizes, and compression to reduce storage costs. File count = number of partitions at write time.`,
      parameters: [
        { name: 'path', type: 'str', required: true, description: 'Output path' },
        { name: 'mode', type: 'str', required: false, default: 'error', description: 'overwrite / append / ignore / error' },
        { name: 'compression', type: 'str', required: false, default: 'snappy', description: 'snappy / gzip / zstd / none' },
        { name: 'partitionBy', type: 'str | list', required: false, description: 'Partition output by column(s)' },
      ],
      returns: 'void',
      examples: [
        {
          label: 'Write partitioned Parquet',
          code: `df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("s3://bucket/output/orders/")`,
        },
        {
          label: 'Control output file count',
          code: `# Write to exactly 100 files (for downstream readers)
df.coalesce(100) \
  .write \
  .mode("overwrite") \
  .parquet("s3://bucket/output/")`,
        },
        {
          label: 'Append to existing dataset',
          code: `new_data.write \
    .mode("append") \
    .partitionBy("year", "month") \
    .parquet("s3://bucket/output/orders/")`,
        },
      ],
      notes: [
        'snappy is default — good balance of speed and compression',
        'zstd gives better compression ratio than snappy with similar speed',
        'Avoid gzip: it is not splittable, blocking parallel reads',
        'Avoid too many small files (< 128MB) — use coalesce() before writing',
      ],
      performance: 'Target file sizes of 128MB–1GB. Too many small files = "small file problem" which kills read performance.',
      tags: ['write', 'parquet', 'output', 'save', 'partition'],
      difficulty: 'beginner',
    },

    {
      id: 'write-delta',
      name: 'df.write.format("delta")',
      category: 'writing',
      syntax: 'df.write.format("delta").mode("overwrite").save(path)',
      shortDescription: 'Write to Delta Lake with ACID guarantees',
      longDescription: `Delta Lake writes create transaction logs alongside the data files, enabling ACID transactions, schema enforcement, time travel, and incremental updates. MERGE INTO (upsert) is the most powerful Delta operation for CDC (change data capture) pipelines.`,
      examples: [
        {
          label: 'Write Delta table',
          code: `df.write \
    .format("delta") \
    .mode("overwrite") \
    .partitionBy("date") \
    .save("s3://bucket/delta/orders")`,
        },
        {
          label: 'Merge/Upsert (CDC pattern)',
          code: `from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "s3://bucket/delta/orders")

# MERGE: update existing rows, insert new ones
delta_table.alias("target").merge(
    new_data.alias("source"),
    "target.order_id = source.order_id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()`,
        },
        {
          label: 'Optimize and Z-order',
          code: `from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "s3://bucket/delta/orders")

# Compact small files and Z-order by query column
delta_table.optimize().executeZOrderBy("customer_id")`,
        },
      ],
      notes: [
        'OPTIMIZE compacts small files — run periodically (daily/weekly)',
        'ZORDER BY puts co-located data in the same files — dramatically reduces scanned bytes',
        'VACUUM removes old snapshots — do not run before 7 days (breaks time travel)',
      ],
      performance: 'Delta MERGE is the most efficient upsert pattern for large tables. Avoids full rewrite of the table.',
      tags: ['write', 'delta', 'upsert', 'merge', 'acid', 'cdc'],
      difficulty: 'intermediate',
    },

    {
      id: 'write-mode',
      name: 'df.write.mode()',
      category: 'writing',
      syntax: 'df.write.mode("overwrite" | "append" | "ignore" | "error")',
      shortDescription: 'Control behavior when output path already exists',
      longDescription: `The write mode determines what happens when the output path already contains data. overwrite deletes existing data first. append adds new files. ignore skips the write silently. error (default) throws an exception.`,
      examples: [
        {
          label: 'All modes',
          code: `# Overwrite all existing data
df.write.mode("overwrite").parquet("s3://bucket/output/")

# Append without touching existing files
df.write.mode("append").parquet("s3://bucket/output/")

# Skip if already exists (idempotent)
df.write.mode("ignore").parquet("s3://bucket/output/")

# Fail if output exists (default — safe default)
df.write.mode("error").parquet("s3://bucket/output/")`,
        },
      ],
      notes: [
        '"overwrite" deletes ALL existing partitions — use Delta MERGE for partial updates',
        'For partitioned tables use dynamic partition overwrite to only overwrite touched partitions',
      ],
      tags: ['write', 'mode', 'overwrite', 'append'],
      difficulty: 'beginner',
    },

    {
      id: 'write-partitionBy',
      name: 'df.write.partitionBy()',
      category: 'writing',
      syntax: 'df.write.partitionBy("col1", "col2").parquet(path)',
      shortDescription: 'Partition output data by column values for faster future reads',
      longDescription: `partitionBy() creates a directory hierarchy on disk based on column values (e.g., year=2024/month=3/). Future reads that filter on those columns will skip irrelevant partitions entirely (partition pruning), dramatically reducing I/O. This is one of the most impactful optimizations for large datasets.`,
      examples: [
        {
          label: 'Partition by date columns',
          code: `from pyspark.sql.functions import year, month, dayofmonth

df_with_parts = df.withColumn("year",  year("event_date")) \
                  .withColumn("month", month("event_date"))

df_with_parts.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("s3://bucket/events/")
# Creates: s3://bucket/events/year=2024/month=1/part-*.parquet`,
        },
        {
          label: 'Enable dynamic partition overwrite',
          code: `spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")

# Now "overwrite" only replaces partitions present in the DataFrame
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("s3://bucket/events/")`,
        },
      ],
      notes: [
        'Never partitionBy a high-cardinality column (e.g., user_id) — creates millions of tiny files',
        'Good partition columns: date, region, country, status (low-to-medium cardinality)',
        'Each unique partition value becomes a directory — keep partition count reasonable',
      ],
      performance: 'Partition pruning skips entire directories at read time. A query for one month avoids reading 11 other months.',
      tags: ['write', 'partition', 'partitionby', 'pruning', 'performance'],
      difficulty: 'intermediate',
    },

    // ─────────────────────────────────────────────
    // SCHEMA & TYPES
    // ─────────────────────────────────────────────
    {
      id: 'printSchema',
      name: 'df.printSchema()',
      category: 'schema',
      syntax: 'df.printSchema()',
      shortDescription: 'Print the DataFrame schema as a tree',
      longDescription: `printSchema() displays the column names, data types, and nullability in a readable tree format. It is the first thing to call after reading data to verify the schema was interpreted correctly. For nested schemas (JSON, Parquet with structs), it shows the full nesting hierarchy.`,
      examples: [
        {
          label: 'Inspect schema',
          code: `df.printSchema()
# root
#  |-- order_id: string (nullable = true)
#  |-- order_date: date (nullable = true)
#  |-- customer: struct (nullable = true)
#  |    |-- id: long (nullable = true)
#  |    |-- name: string (nullable = true)
#  |-- items: array (nullable = true)
#  |    |-- element: struct (containsNull = true)
#  |    |    |-- product: string (nullable = true)
#  |    |    |-- qty: integer (nullable = true)`,
        },
      ],
      tags: ['schema', 'inspect', 'types', 'printschema'],
      difficulty: 'beginner',
    },

    {
      id: 'cast',
      name: 'col.cast()',
      category: 'schema',
      syntax: 'df.withColumn("col", col("col").cast(DataType()))',
      shortDescription: 'Convert a column to a different data type',
      longDescription: `cast() converts a column from one type to another. Mismatched types are one of the most common sources of bugs — always cast explicitly rather than relying on implicit coercion. Returns null for values that cannot be converted rather than throwing an error.`,
      examples: [
        {
          label: 'Common type casts',
          code: `from pyspark.sql.functions import col
from pyspark.sql.types import IntegerType, DoubleType, DateType, LongType, StringType

df = df \
    .withColumn("age",        col("age").cast(IntegerType())) \
    .withColumn("revenue",    col("revenue").cast(DoubleType())) \
    .withColumn("event_date", col("event_date").cast(DateType())) \
    .withColumn("user_id",    col("user_id").cast(LongType())) \
    .withColumn("status",     col("status").cast(StringType()))`,
        },
        {
          label: 'Cast using string shorthand',
          code: `df = df \
    .withColumn("amount", col("amount").cast("double")) \
    .withColumn("count",  col("count").cast("int")) \
    .withColumn("ts",     col("ts").cast("timestamp"))`,
        },
      ],
      notes: [
        'Failed casts produce nulls, not errors — check for new nulls after casting',
        'Use LongType for IDs — IntegerType overflows above ~2 billion',
      ],
      tags: ['cast', 'types', 'convert', 'schema'],
      difficulty: 'beginner',
    },

    {
      id: 'df-schema',
      name: 'df.schema / df.dtypes',
      category: 'schema',
      syntax: 'df.schema  |  df.dtypes  |  df.columns',
      shortDescription: 'Programmatically access schema information',
      longDescription: `df.schema returns the StructType object (useful for passing to createDataFrame or comparing schemas). df.dtypes returns a list of (name, type_string) tuples. df.columns returns just the column names as a list — useful for programmatic column selection.`,
      examples: [
        {
          label: 'Access schema programmatically',
          code: `# Full StructType object
schema = df.schema
print(schema)

# List of (name, type) tuples
for name, dtype in df.dtypes:
    print(f"{name}: {dtype}")

# Just column names
print(df.columns)  # ['order_id', 'date', 'amount', ...]

# Number of columns
print(len(df.columns))

# Check if a column exists
if "revenue" in df.columns:
    df = df.drop("revenue")`,
        },
      ],
      tags: ['schema', 'dtypes', 'columns', 'inspect'],
      difficulty: 'beginner',
    },

    // ─────────────────────────────────────────────
    // SELECT & RENAME
    // ─────────────────────────────────────────────
    {
      id: 'select',
      name: 'df.select()',
      category: 'select',
      syntax: 'df.select(*cols)',
      shortDescription: 'Select specific columns from a DataFrame',
      longDescription: `select() returns a new DataFrame with only the specified columns. It is a lazy transformation — no computation until an action is called. You can use string names, col() expressions, or any Column expression. select() is more efficient than withColumn() when you are reducing many columns down to a few.`,
      examples: [
        {
          label: 'Select by name',
          code: `df.select("order_id", "customer", "amount").show()`,
        },
        {
          label: 'Select with expressions',
          code: `from pyspark.sql.functions import col, upper, round

df.select(
    col("order_id"),
    upper(col("customer")).alias("customer_upper"),
    round(col("amount"), 2).alias("amount_rounded"),
    (col("amount") * 1.1).alias("amount_with_tax"),
).show()`,
        },
        {
          label: 'Select all + extra columns',
          code: `from pyspark.sql.functions import current_timestamp

df.select("*", current_timestamp().alias("processed_at")).show()`,
        },
        {
          label: 'Programmatic column selection',
          code: `# Select all columns except certain ones
exclude = {"internal_id", "raw_payload"}
cols = [c for c in df.columns if c not in exclude]
df.select(cols).show()`,
        },
      ],
      tags: ['select', 'projection', 'columns', 'transformation'],
      difficulty: 'beginner',
    },

    {
      id: 'withColumn',
      name: 'df.withColumn()',
      category: 'select',
      syntax: 'df.withColumn("new_col", expression)',
      shortDescription: 'Add or replace a column with a computed expression',
      longDescription: `withColumn() adds a new column or replaces an existing one by the same name. It is lazy and chainable. For adding many columns at once, select() is more efficient because withColumn() creates a new query plan node for each call. When adding 10+ columns, use select() instead.`,
      examples: [
        {
          label: 'Add computed columns',
          code: `from pyspark.sql.functions import col, upper, to_date, datediff, current_date

df = df \
    .withColumn("name_upper",  upper(col("name"))) \
    .withColumn("age_in_days", datediff(current_date(), col("birth_date"))) \
    .withColumn("tax_amount",  col("amount") * 0.2) \
    .withColumn("total",       col("amount") + col("tax_amount"))`,
        },
        {
          label: 'Replace existing column',
          code: `# Overwrite "status" with uppercase version
df = df.withColumn("status", upper(col("status")))`,
        },
        {
          label: 'Conditional column',
          code: `from pyspark.sql.functions import when

df = df.withColumn(
    "tier",
    when(col("revenue") >= 100_000, "platinum")
    .when(col("revenue") >= 10_000,  "gold")
    .when(col("revenue") >= 1_000,   "silver")
    .otherwise("bronze")
)`,
        },
      ],
      notes: [
        'Adding 10+ columns with chained withColumn() degrades query planning — use select() instead',
        'withColumn can reference any previously defined column in the same DataFrame',
      ],
      tags: ['withcolumn', 'add', 'column', 'compute', 'transform'],
      difficulty: 'beginner',
    },

    {
      id: 'withColumnRenamed',
      name: 'df.withColumnRenamed()',
      category: 'select',
      syntax: 'df.withColumnRenamed("old_name", "new_name")',
      shortDescription: 'Rename a single column',
      longDescription: `withColumnRenamed() returns a new DataFrame with one column renamed. To rename multiple columns, chain calls or use select() with .alias(). Does not change the underlying data.`,
      examples: [
        {
          label: 'Rename columns',
          code: `# Single rename
df = df.withColumnRenamed("cust_id", "customer_id")

# Multiple renames — more efficient with select
rename_map = {"cust_id": "customer_id", "rev": "revenue", "dt": "date"}
df = df.select([col(c).alias(rename_map.get(c, c)) for c in df.columns])`,
        },
      ],
      tags: ['rename', 'alias', 'columns'],
      difficulty: 'beginner',
    },

    {
      id: 'drop',
      name: 'df.drop()',
      category: 'select',
      syntax: 'df.drop("col1", "col2")',
      shortDescription: 'Remove one or more columns from a DataFrame',
      longDescription: `drop() returns a new DataFrame with the specified columns removed. No error is thrown if the column does not exist. Useful for removing intermediate or sensitive columns before writing output.`,
      examples: [
        {
          label: 'Drop columns',
          code: `# Drop single column
df = df.drop("internal_id")

# Drop multiple columns
df = df.drop("raw_json", "debug_flag", "temp_col")

# Drop using a list
cols_to_drop = ["col_a", "col_b", "col_c"]
df = df.drop(*cols_to_drop)`,
        },
      ],
      tags: ['drop', 'remove', 'columns'],
      difficulty: 'beginner',
    },

    {
      id: 'selectExpr',
      name: 'df.selectExpr()',
      category: 'select',
      syntax: 'df.selectExpr("expr1", "expr2")',
      shortDescription: 'Select columns using SQL expression strings',
      longDescription: `selectExpr() allows you to write SQL expression strings instead of Column objects. It is useful when migrating SQL to PySpark or when the expression is complex and easier to write as a string.`,
      examples: [
        {
          label: 'SQL-style expressions',
          code: `df.selectExpr(
    "order_id",
    "upper(customer_name) as customer",
    "amount * 1.2 as amount_with_tax",
    "CASE WHEN amount > 1000 THEN 'high' ELSE 'low' END as tier",
    "year(order_date) as order_year",
).show()`,
        },
      ],
      tags: ['select', 'expr', 'sql', 'expression'],
      difficulty: 'beginner',
    },

    // ─────────────────────────────────────────────
    // FILTERING
    // ─────────────────────────────────────────────
    {
      id: 'filter',
      name: 'df.filter() / df.where()',
      category: 'filtering',
      syntax: 'df.filter(condition)  |  df.where(condition)',
      shortDescription: 'Filter rows by a boolean condition',
      longDescription: `filter() and where() are aliases — they do the same thing. They return a new DataFrame with only the rows where the condition evaluates to true. Null rows are excluded. When reading Parquet/Delta, filters are pushed down to the file reader (predicate pushdown), skipping irrelevant data before it enters the cluster.`,
      examples: [
        {
          label: 'Column expression filter',
          code: `from pyspark.sql.functions import col

# Single condition
df.filter(col("status") == "active").show()

# Multiple conditions (AND)
df.filter((col("status") == "active") & (col("amount") > 1000)).show()

# OR condition
df.filter((col("region") == "US") | (col("region") == "EU")).show()

# NOT condition
df.filter(~col("is_deleted")).show()`,
        },
        {
          label: 'SQL string filter',
          code: `df.filter("status = 'active' AND amount > 1000").show()
df.where("year(order_date) = 2024").show()`,
        },
        {
          label: 'isin filter',
          code: `# Filter rows where column is in a list
active_regions = ["US", "EU", "APAC"]
df.filter(col("region").isin(active_regions)).show()

# NOT in
df.filter(~col("status").isin(["deleted", "archived"])).show()`,
        },
        {
          label: 'Between filter',
          code: `df.filter(col("amount").between(100, 10000)).show()
df.filter(col("event_date").between("2024-01-01", "2024-03-31")).show()`,
        },
      ],
      notes: [
        'filter() on partition columns triggers partition pruning — reads only matching directories',
        'Chain multiple filter() calls — Spark merges them into a single predicate',
        'Use col() expressions rather than strings for type safety and IDE support',
      ],
      performance: 'Filter early and aggressively. Reducing row count before joins and aggregations is the highest-impact optimization.',
      tags: ['filter', 'where', 'condition', 'predicate', 'pushdown'],
      difficulty: 'beginner',
    },

    {
      id: 'isnull',
      name: 'col.isNull() / col.isNotNull()',
      category: 'filtering',
      syntax: 'df.filter(col("col").isNull())',
      shortDescription: 'Filter rows where a column is null or not null',
      longDescription: `isNull() and isNotNull() are the correct way to check for null values in PySpark. Do NOT use == None or != None — these do not work correctly with Spark's null semantics.`,
      examples: [
        {
          label: 'Null filtering',
          code: `from pyspark.sql.functions import col

# Rows where email is null
df.filter(col("email").isNull()).count()

# Rows where email is NOT null
df.filter(col("email").isNotNull()).show()

# Combined condition
df.filter(col("status").isNotNull() & col("amount").isNotNull()).show()`,
        },
      ],
      tags: ['null', 'isnull', 'isnotnull', 'missing', 'filter'],
      difficulty: 'beginner',
    },

    {
      id: 'like-rlike',
      name: 'col.like() / col.rlike()',
      category: 'filtering',
      syntax: 'col("col").like("pattern")  |  col("col").rlike("regex")',
      shortDescription: 'Filter rows using SQL LIKE or regex patterns',
      longDescription: `like() uses SQL LIKE wildcards (% for any sequence, _ for one character). rlike() uses full Java regex patterns for more powerful matching.`,
      examples: [
        {
          label: 'Pattern matching',
          code: `from pyspark.sql.functions import col

# LIKE: names starting with "A"
df.filter(col("name").like("A%")).show()

# LIKE: 5-character product codes
df.filter(col("sku").like("_____")).show()

# Regex: emails from gmail
df.filter(col("email").rlike(r".*@gmail\\.com$")).show()

# Regex: strings containing digits
df.filter(col("code").rlike(r"\\d+")).show()`,
        },
      ],
      tags: ['like', 'rlike', 'regex', 'pattern', 'filter', 'string'],
      difficulty: 'intermediate',
    },

    // ─────────────────────────────────────────────
    // TRANSFORMATIONS
    // ─────────────────────────────────────────────
    {
      id: 'when-otherwise',
      name: 'when() / otherwise()',
      category: 'transformations',
      syntax: 'when(condition, value).when(...).otherwise(default)',
      shortDescription: 'SQL CASE WHEN equivalent — conditional column values',
      longDescription: `when().otherwise() is the PySpark equivalent of SQL's CASE WHEN. It evaluates conditions in order, returning the first matching value. Always end with .otherwise() to handle unmatched rows; without it, unmatched rows return null.`,
      examples: [
        {
          label: 'Multi-tier classification',
          code: `from pyspark.sql.functions import when, col

df = df.withColumn(
    "customer_tier",
    when(col("lifetime_value") >= 100_000, "platinum")
    .when(col("lifetime_value") >= 50_000,  "gold")
    .when(col("lifetime_value") >= 10_000,  "silver")
    .otherwise("bronze")
)`,
        },
        {
          label: 'Conditional on multiple columns',
          code: `df = df.withColumn(
    "risk_flag",
    when(
        (col("country") == "XX") & (col("amount") > 10_000),
        "high_risk"
    ).when(
        col("failed_attempts") > 3,
        "suspicious"
    ).otherwise("normal")
)`,
        },
      ],
      tags: ['when', 'otherwise', 'case', 'conditional', 'if-else'],
      difficulty: 'beginner',
    },

    {
      id: 'withColumns',
      name: 'df.withColumns()',
      category: 'transformations',
      syntax: 'df.withColumns({"col1": expr1, "col2": expr2})',
      shortDescription: 'Add or replace multiple columns in one operation (Spark 3.3+)',
      longDescription: `withColumns() (Spark 3.3+) adds or replaces multiple columns in a single call. It is more efficient than chaining many withColumn() calls because it generates a single query plan node instead of one per column. Use this instead of chained withColumn() for 3+ columns.`,
      examples: [
        {
          label: 'Add multiple columns at once',
          code: `from pyspark.sql.functions import col, year, month, upper

df = df.withColumns({
    "order_year":      year(col("order_date")),
    "order_month":     month(col("order_date")),
    "customer_upper":  upper(col("customer_name")),
    "amount_with_tax": col("amount") * 1.2,
})`,
        },
      ],
      notes: [
        'Spark 3.3+ only. Use select() for older Spark versions.',
        'Much faster than 10+ chained withColumn() calls',
      ],
      performance: 'Generates one plan node vs N nodes for N chained withColumn() calls. Significant for 10+ columns.',
      tags: ['withcolumns', 'add', 'columns', 'performance', 'spark3.3'],
      difficulty: 'intermediate',
    },

    {
      id: 'explode',
      name: 'explode()',
      category: 'transformations',
      syntax: 'df.select("id", explode("array_col").alias("item"))',
      shortDescription: 'Flatten an array/map column into multiple rows',
      longDescription: `explode() converts each element of an array into a separate row, duplicating all other columns. For maps, it produces (key, value) rows. Use explode_outer() to keep rows where the array is null or empty (explode() drops them). This is essential for working with nested/JSON data.`,
      examples: [
        {
          label: 'Explode array column',
          code: `from pyspark.sql.functions import explode, col

# Input: {order_id: 1, items: ["apple", "banana", "cherry"]}
# Output: one row per item

df_exploded = df.select(
    col("order_id"),
    explode(col("items")).alias("item")
)
df_exploded.show()
# +--------+-------+
# |order_id|   item|
# +--------+-------+
# |       1|  apple|
# |       1| banana|
# |       1| cherry|`,
        },
        {
          label: 'explode_outer (keep nulls/empty)',
          code: `from pyspark.sql.functions import explode_outer

# Keeps rows even if the array is null or empty
df.select("id", explode_outer("tags").alias("tag")).show()`,
        },
        {
          label: 'posexplode (with index)',
          code: `from pyspark.sql.functions import posexplode

# Get position (index) alongside the value
df.select("id", posexplode("items").alias("position", "item")).show()`,
        },
      ],
      notes: [
        'explode() drops rows where the array is null — use explode_outer() to preserve them',
        'Exploding large arrays multiplies row count — cache before explode if reusing',
      ],
      tags: ['explode', 'array', 'flatten', 'unnest', 'nested'],
      difficulty: 'intermediate',
    },

    {
      id: 'pivot',
      name: 'df.groupBy().pivot()',
      category: 'transformations',
      syntax: 'df.groupBy("row_key").pivot("pivot_col", values).agg(func("val"))',
      shortDescription: 'Rotate rows into columns (crosstab / pivot table)',
      longDescription: `pivot() rotates unique values of a column into individual columns. Providing the list of pivot values explicitly avoids an extra scan to discover them, which is critical for large datasets. The result has one row per group and one column per pivot value.`,
      examples: [
        {
          label: 'Pivot product sales by region',
          code: `from pyspark.sql.functions import sum

pivot_df = df.groupBy("product") \
    .pivot("region", ["US", "EU", "APAC"]) \
    .agg(sum("sales").alias("total_sales"))

pivot_df.show()
# +----------+-----+------+------+
# |   product|   US|    EU|  APAC|
# +----------+-----+------+------+
# |  Widget A| 1500|  2300|  4500|`,
        },
        {
          label: 'Without specifying values (slower)',
          code: `# Spark auto-discovers values — requires an extra scan
pivot_df = df.groupBy("product").pivot("region").agg(sum("sales"))`,
        },
      ],
      notes: [
        'Always specify pivot values explicitly to avoid extra scan',
        'For wide pivots (100+ unique values), pivot is expensive — consider alternative approaches',
      ],
      tags: ['pivot', 'crosstab', 'rotate', 'columns', 'aggregation'],
      difficulty: 'intermediate',
    },

    // ─────────────────────────────────────────────
    // STRING FUNCTIONS
    // ─────────────────────────────────────────────
    {
      id: 'str-concat',
      name: 'concat() / concat_ws()',
      category: 'strings',
      syntax: 'concat(col1, col2, ...)  |  concat_ws(sep, col1, col2, ...)',
      shortDescription: 'Concatenate multiple string columns',
      longDescription: `concat() joins strings without a separator. concat_ws() (concat with separator) joins with a delimiter and automatically skips null values. concat() returns null if any input is null.`,
      examples: [
        {
          label: 'String concatenation',
          code: `from pyspark.sql.functions import concat, concat_ws, col, lit

# concat: nulls propagate
df.withColumn("full_name", concat(col("first_name"), lit(" "), col("last_name"))).show()

# concat_ws: skips nulls
df.withColumn("address", concat_ws(", ", col("street"), col("city"), col("country"))).show()

# Build a composite key
df.withColumn("key", concat_ws("_", col("region"), col("year"), col("month"))).show()`,
        },
      ],
      tags: ['concat', 'concat_ws', 'string', 'join', 'combine'],
      difficulty: 'beginner',
    },

    {
      id: 'str-split',
      name: 'split()',
      category: 'strings',
      syntax: 'split(col("col"), pattern, limit=-1)',
      shortDescription: 'Split a string column into an array using a delimiter',
      longDescription: `split() splits a string by a regex pattern and returns an ArrayType column. Use .getItem(n) to extract a specific element. Combine with explode() to produce one row per element.`,
      examples: [
        {
          label: 'Split and access elements',
          code: `from pyspark.sql.functions import split, col

# Split by comma
df = df.withColumn("tags_array", split(col("tags"), ","))

# Get first element
df = df.withColumn("primary_tag", split(col("tags"), ",").getItem(0))

# Split email into parts
df = df.withColumn("domain", split(col("email"), "@").getItem(1))`,
        },
      ],
      tags: ['split', 'string', 'array', 'parse'],
      difficulty: 'beginner',
    },

    {
      id: 'str-trim',
      name: 'trim() / ltrim() / rtrim()',
      category: 'strings',
      syntax: 'trim(col("col"))  |  ltrim(col)  |  rtrim(col)',
      shortDescription: 'Remove leading and trailing whitespace from strings',
      longDescription: `trim() removes whitespace from both ends of a string. ltrim() removes leading whitespace. rtrim() removes trailing whitespace. Essential for cleaning raw text data where spaces cause join mismatches.`,
      examples: [
        {
          label: 'Trim whitespace',
          code: `from pyspark.sql.functions import trim, ltrim, rtrim, col

df = df \
    .withColumn("name",   trim(col("name"))) \
    .withColumn("prefix", ltrim(col("prefix"))) \
    .withColumn("suffix", rtrim(col("suffix")))`,
        },
      ],
      tags: ['trim', 'whitespace', 'clean', 'string'],
      difficulty: 'beginner',
    },

    {
      id: 'str-upper-lower',
      name: 'upper() / lower()',
      category: 'strings',
      syntax: 'upper(col("col"))  |  lower(col("col"))',
      shortDescription: 'Convert string column to uppercase or lowercase',
      longDescription: `upper() and lower() normalize string case. Always normalize before joins or comparisons on string columns to avoid case-sensitivity bugs.`,
      examples: [
        {
          label: 'Normalize case for joins',
          code: `from pyspark.sql.functions import lower, col

# Normalize before join
df1 = df1.withColumn("email", lower(col("email")))
df2 = df2.withColumn("email", lower(col("email")))
df1.join(df2, "email").show()`,
        },
      ],
      tags: ['upper', 'lower', 'case', 'normalize', 'string'],
      difficulty: 'beginner',
    },

    {
      id: 'str-replace',
      name: 'regexp_replace()',
      category: 'strings',
      syntax: 'regexp_replace(col("col"), pattern, replacement)',
      shortDescription: 'Replace substrings matching a regex pattern',
      longDescription: `regexp_replace() substitutes all occurrences of a regex pattern with a replacement string. Essential for data cleaning — removing special characters, stripping HTML, normalizing phone numbers, etc.`,
      examples: [
        {
          label: 'Clean string data',
          code: `from pyspark.sql.functions import regexp_replace, col

# Remove special characters from phone numbers
df = df.withColumn("phone", regexp_replace(col("phone"), r"[^0-9]", ""))

# Remove HTML tags
df = df.withColumn("clean_text", regexp_replace(col("html"), r"<[^>]+>", ""))

# Replace multiple spaces with single space
df = df.withColumn("text", regexp_replace(col("text"), r" +", " "))

# Mask PII — replace part of email
df = df.withColumn("masked_email",
    regexp_replace(col("email"), r"^(.{2}).*(@)", "$1***$2"))`,
        },
      ],
      tags: ['regexp_replace', 'regex', 'replace', 'clean', 'string'],
      difficulty: 'intermediate',
    },

    {
      id: 'str-extract',
      name: 'regexp_extract()',
      category: 'strings',
      syntax: 'regexp_extract(col("col"), pattern, groupIdx)',
      shortDescription: 'Extract a regex capture group from a string column',
      longDescription: `regexp_extract() returns the matched group from a regex. Group 0 is the full match, group 1+ are capture groups. Returns an empty string (not null) when there is no match.`,
      examples: [
        {
          label: 'Extract structured data from strings',
          code: `from pyspark.sql.functions import regexp_extract, col

# Extract year from a date string "order_2024_01_15"
df = df.withColumn("year", regexp_extract(col("filename"), r"(\\d{4})", 1))

# Extract domain from URL
df = df.withColumn("domain",
    regexp_extract(col("url"), r"https?://([^/]+)", 1))

# Extract amount from text like "$1,234.56"
df = df.withColumn("amount_str",
    regexp_extract(col("description"), r"\\$([\d,]+\\.?\\d*)", 1))`,
        },
      ],
      tags: ['regexp_extract', 'regex', 'extract', 'parse', 'string'],
      difficulty: 'intermediate',
    },

    {
      id: 'str-substring',
      name: 'substring() / left() / right()',
      category: 'strings',
      syntax: 'substring(col("col"), pos, len)',
      shortDescription: 'Extract a portion of a string by position',
      longDescription: `substring() extracts a fixed-length substring starting at a position (1-indexed). Useful for parsing fixed-width fields, extracting date components from strings, or working with coded identifiers.`,
      examples: [
        {
          label: 'Substring operations',
          code: `from pyspark.sql.functions import substring, col

# Characters 1-4 (year from "2024-01-15")
df = df.withColumn("year", substring(col("date_str"), 1, 4))

# Characters 6-7 (month)
df = df.withColumn("month", substring(col("date_str"), 6, 2))

# Using expr for left/right
from pyspark.sql.functions import expr
df = df.withColumn("country_code", expr("left(phone, 2)"))
df = df.withColumn("last_4_digits", expr("right(card_number, 4)"))`,
        },
      ],
      tags: ['substring', 'left', 'right', 'string', 'extract'],
      difficulty: 'beginner',
    },

    {
      id: 'str-length',
      name: 'length() / char_length()',
      category: 'strings',
      syntax: 'length(col("col"))',
      shortDescription: 'Return the length (number of characters) of a string',
      longDescription: `length() returns the number of characters in a string. Returns null for null inputs. Useful for data validation, filtering short/long values, or parsing fixed-width fields.`,
      examples: [
        {
          label: 'String length usage',
          code: `from pyspark.sql.functions import length, col

# Filter by length
df.filter(length(col("sku")) == 10).show()

# Add length as a feature
df = df.withColumn("description_len", length(col("description")))

# Find suspiciously short strings
df.filter(length(col("name")) < 2).show()`,
        },
      ],
      tags: ['length', 'size', 'string'],
      difficulty: 'beginner',
    },

    {
      id: 'str-contains',
      name: 'col.contains() / col.startswith() / col.endswith()',
      category: 'strings',
      syntax: 'col("col").contains("str")  |  .startswith("str")  |  .endswith("str")',
      shortDescription: 'Check if a string contains, starts with, or ends with a value',
      longDescription: `These Column methods provide readable string-matching filters. They are equivalent to LIKE '%val%', LIKE 'val%', and LIKE '%val' in SQL.`,
      examples: [
        {
          label: 'String matching',
          code: `from pyspark.sql.functions import col

# Contains
df.filter(col("description").contains("premium")).show()

# Starts with
df.filter(col("sku").startswith("PRD-")).show()

# Ends with
df.filter(col("filename").endswith(".csv")).show()`,
        },
      ],
      tags: ['contains', 'startswith', 'endswith', 'string', 'filter'],
      difficulty: 'beginner',
    },

    {
      id: 'str-lpad-rpad',
      name: 'lpad() / rpad()',
      category: 'strings',
      syntax: 'lpad(col("col"), length, pad_string)',
      shortDescription: 'Pad a string to a fixed length',
      longDescription: `lpad() pads a string on the left, rpad() on the right. Essential for creating fixed-width fields, formatting codes, or ensuring consistent key widths before joins.`,
      examples: [
        {
          label: 'Pad strings for consistent formatting',
          code: `from pyspark.sql.functions import lpad, rpad, col

# Zero-pad an ID to 8 digits: "42" → "00000042"
df = df.withColumn("order_id_padded", lpad(col("order_id").cast("string"), 8, "0"))

# Right-pad a label to 20 chars
df = df.withColumn("label_padded", rpad(col("label"), 20, " "))`,
        },
      ],
      tags: ['lpad', 'rpad', 'pad', 'format', 'string'],
      difficulty: 'beginner',
    },

    // ─────────────────────────────────────────────
    // DATE & TIME FUNCTIONS
    // ─────────────────────────────────────────────
    {
      id: 'to-date',
      name: 'to_date() / to_timestamp()',
      category: 'dates',
      syntax: 'to_date(col("col"), "format")  |  to_timestamp(col("col"), "format")',
      shortDescription: 'Parse a string column into DateType or TimestampType',
      longDescription: `to_date() and to_timestamp() convert string columns to date/timestamp types. Always specify the format explicitly to avoid locale-dependent parsing. Returns null for strings that do not match the format (no exception).`,
      examples: [
        {
          label: 'Parse date strings',
          code: `from pyspark.sql.functions import to_date, to_timestamp, col

# ISO date string
df = df.withColumn("event_date", to_date(col("date_str"), "yyyy-MM-dd"))

# US format
df = df.withColumn("event_date", to_date(col("date_str"), "MM/dd/yyyy"))

# Timestamp with time
df = df.withColumn("created_at", to_timestamp(col("ts_str"), "yyyy-MM-dd HH:mm:ss"))

# Unix epoch milliseconds to timestamp
df = df.withColumn("ts", (col("epoch_ms") / 1000).cast("timestamp"))`,
        },
      ],
      notes: [
        'Unmatched formats return null silently — check null count after parsing',
        'Use yyyy for 4-digit year, MM for 2-digit month, dd for 2-digit day',
      ],
      tags: ['to_date', 'to_timestamp', 'date', 'parse', 'format'],
      difficulty: 'beginner',
    },

    {
      id: 'date-trunc',
      name: 'date_trunc() / trunc()',
      category: 'dates',
      syntax: 'date_trunc("month", col("ts"))  |  trunc(col("date"), "month")',
      shortDescription: 'Truncate a date/timestamp to a specified granularity',
      longDescription: `date_trunc() truncates a timestamp to a time unit (year, quarter, month, week, day, hour, minute, second). trunc() works on DateType columns. Essential for time-based aggregations like monthly rollups.`,
      examples: [
        {
          label: 'Truncate to different granularities',
          code: `from pyspark.sql.functions import date_trunc, trunc, col

# Truncate timestamp to month start: 2024-03-15 → 2024-03-01 00:00:00
df = df.withColumn("month_start", date_trunc("month", col("created_at")))

# Truncate to week start (Monday)
df = df.withColumn("week_start", date_trunc("week", col("event_ts")))

# Truncate to hour
df = df.withColumn("hour_bucket", date_trunc("hour", col("event_ts")))

# Truncate DateType to year
df = df.withColumn("year_start", trunc(col("order_date"), "year"))`,
        },
      ],
      tags: ['date_trunc', 'trunc', 'date', 'aggregate', 'bucket', 'month'],
      difficulty: 'intermediate',
    },

    {
      id: 'datediff',
      name: 'datediff() / months_between()',
      category: 'dates',
      syntax: 'datediff(end_date, start_date)  |  months_between(end, start)',
      shortDescription: 'Calculate the difference between two dates',
      longDescription: `datediff() returns the number of days between two dates. months_between() returns the number of months (as a double). Both are essential for calculating tenure, age, time-to-event, or any date arithmetic.`,
      examples: [
        {
          label: 'Date arithmetic',
          code: `from pyspark.sql.functions import datediff, months_between, col, current_date

# Days since an event
df = df.withColumn("days_since_signup", datediff(current_date(), col("signup_date")))

# Customer age in months
df = df.withColumn("tenure_months",
    months_between(current_date(), col("signup_date")).cast("int"))

# Days between order and shipment
df = df.withColumn("fulfillment_days",
    datediff(col("shipment_date"), col("order_date")))`,
        },
      ],
      tags: ['datediff', 'months_between', 'date', 'difference', 'tenure'],
      difficulty: 'beginner',
    },

    {
      id: 'date-add',
      name: 'date_add() / date_sub()',
      category: 'dates',
      syntax: 'date_add(col("date"), num_days)  |  date_sub(col("date"), num_days)',
      shortDescription: 'Add or subtract days from a date column',
      longDescription: `date_add() and date_sub() add/subtract a fixed number of days from a date column. For months or years, use add_months(). For arbitrary interval arithmetic, use expr() with interval syntax.`,
      examples: [
        {
          label: 'Date arithmetic',
          code: `from pyspark.sql.functions import date_add, date_sub, add_months, col

# 7-day lookahead window
df = df.withColumn("expires_on", date_add(col("created_date"), 7))

# 30 days ago
df = df.withColumn("lookback_start", date_sub(col("today"), 30))

# Add 3 months (handles month-end correctly)
df = df.withColumn("next_quarter", add_months(col("start_date"), 3))

# Using expr for more complex intervals
from pyspark.sql.functions import expr
df = df.withColumn("same_time_last_week",
    expr("date_sub(event_date, 7)"))`,
        },
      ],
      tags: ['date_add', 'date_sub', 'add_months', 'date', 'interval'],
      difficulty: 'beginner',
    },

    {
      id: 'year-month-day',
      name: 'year() / month() / dayofmonth() / hour()',
      category: 'dates',
      syntax: 'year(col("date"))  |  month(col)  |  dayofmonth(col)  |  hour(col)',
      shortDescription: 'Extract date/time components from a date or timestamp column',
      longDescription: `These functions extract specific components from date and timestamp columns. They are essential for creating partition keys, building time-based features for ML, and grouping by time periods.`,
      examples: [
        {
          label: 'Extract all date parts',
          code: `from pyspark.sql.functions import (
    year, month, dayofmonth, dayofweek, dayofyear,
    weekofyear, quarter, hour, minute, second, col
)

df = df.withColumns({
    "year":       year(col("event_ts")),
    "month":      month(col("event_ts")),
    "day":        dayofmonth(col("event_ts")),
    "hour":       hour(col("event_ts")),
    "dow":        dayofweek(col("event_ts")),  # 1=Sunday, 7=Saturday
    "week":       weekofyear(col("event_ts")),
    "quarter":    quarter(col("event_ts")),
})`,
        },
      ],
      tags: ['year', 'month', 'day', 'hour', 'date', 'extract'],
      difficulty: 'beginner',
    },

    {
      id: 'date-format',
      name: 'date_format()',
      category: 'dates',
      syntax: 'date_format(col("date"), "format_string")',
      shortDescription: 'Format a date/timestamp as a string',
      longDescription: `date_format() converts a date or timestamp to a string using Java SimpleDateFormat patterns. Use this for output formatting, creating string-based partition keys, or displaying dates in a specific format.`,
      examples: [
        {
          label: 'Format dates',
          code: `from pyspark.sql.functions import date_format, col

# ISO format
df = df.withColumn("date_str", date_format(col("event_ts"), "yyyy-MM-dd"))

# Month-Year label
df = df.withColumn("month_label", date_format(col("event_ts"), "MMM-yyyy"))  # "Jan-2024"

# Full date-time
df = df.withColumn("readable_ts", date_format(col("event_ts"), "dd/MM/yyyy HH:mm:ss"))

# Create partition key
df = df.withColumn("partition_key", date_format(col("event_ts"), "yyyyMM"))`,
        },
      ],
      tags: ['date_format', 'format', 'string', 'date'],
      difficulty: 'beginner',
    },

    // ─────────────────────────────────────────────
    // MATH FUNCTIONS
    // ─────────────────────────────────────────────
    {
      id: 'math-round',
      name: 'round() / ceil() / floor() / bround()',
      category: 'math',
      syntax: 'round(col("col"), scale)  |  ceil(col)  |  floor(col)',
      shortDescription: 'Round numeric values to a specified number of decimal places',
      longDescription: `round() uses "round half up" rounding. bround() uses "round half to even" (banker's rounding) which is more statistically accurate. ceil() rounds up, floor() rounds down.`,
      examples: [
        {
          label: 'Rounding operations',
          code: `from pyspark.sql.functions import round, ceil, floor, bround, col

df = df.withColumns({
    "amount_2dp":  round(col("amount"), 2),      # 1.235 → 1.24
    "amount_up":   ceil(col("amount")),            # 1.2 → 2
    "amount_down": floor(col("amount")),           # 1.9 → 1
    "banker_rnd":  bround(col("amount"), 2),      # Banker's rounding
})`,
        },
      ],
      tags: ['round', 'ceil', 'floor', 'math', 'numeric'],
      difficulty: 'beginner',
    },

    {
      id: 'math-abs',
      name: 'abs() / sqrt() / pow() / log()',
      category: 'math',
      syntax: 'abs(col("col"))  |  sqrt(col)  |  pow(col, exp)  |  log(col)',
      shortDescription: 'Standard mathematical operations on numeric columns',
      longDescription: `PySpark provides a full suite of mathematical functions. log() computes natural log. log2() and log10() are also available. Use these for feature engineering in ML pipelines.`,
      examples: [
        {
          label: 'Math operations',
          code: `from pyspark.sql.functions import abs, sqrt, pow, log, log10, exp, col

df = df.withColumns({
    "abs_value":   abs(col("delta")),
    "square_root": sqrt(col("variance")),
    "squared":     pow(col("value"), 2),
    "log_value":   log(col("revenue")),         # natural log
    "log10_value": log10(col("revenue")),
    "exp_value":   exp(col("log_return")),
})`,
        },
      ],
      tags: ['abs', 'sqrt', 'pow', 'log', 'math'],
      difficulty: 'beginner',
    },

    {
      id: 'math-modulo',
      name: 'col % n  /  pmod()',
      category: 'math',
      syntax: 'col("col") % n  |  pmod(col("col"), n)',
      shortDescription: 'Modulo operation — useful for bucketing and hashing',
      longDescription: `The % operator computes the remainder after division. pmod() always returns a non-negative result (Python-style modulo). Use modulo for consistent bucketing, sampling, or distributing rows across partitions.`,
      examples: [
        {
          label: 'Bucketing with modulo',
          code: `from pyspark.sql.functions import col, pmod, hash

# Assign rows to 100 buckets based on ID
df = df.withColumn("bucket", col("user_id") % 100)

# Sample ~10% of data consistently
df_sample = df.filter(pmod(abs(hash(col("user_id"))), 10) == 0)`,
        },
      ],
      tags: ['modulo', 'pmod', 'bucket', 'hash', 'sample'],
      difficulty: 'intermediate',
    },

    // ─────────────────────────────────────────────
    // NULLS & DEFAULTS
    // ─────────────────────────────────────────────
    {
      id: 'coalesce',
      name: 'coalesce()',
      category: 'nulls',
      syntax: 'coalesce(col1, col2, fallback)',
      shortDescription: 'Return the first non-null value from a list of columns',
      longDescription: `coalesce() returns the first non-null value in its argument list. It is essential for null handling — use it to provide fallback values, merge two source columns, or fill in defaults. Short-circuits: stops evaluating once a non-null value is found.`,
      examples: [
        {
          label: 'Null fallback pattern',
          code: `from pyspark.sql.functions import coalesce, col, lit

# Use first available phone number
df = df.withColumn("contact_phone",
    coalesce(col("mobile"), col("home"), col("work"), lit("N/A")))

# Merge two source columns (e.g., from two tables)
df = df.withColumn("revenue",
    coalesce(col("revenue_system_a"), col("revenue_system_b"), lit(0.0)))`,
        },
      ],
      tags: ['coalesce', 'null', 'fallback', 'default', 'missing'],
      difficulty: 'beginner',
    },

    {
      id: 'fillna',
      name: 'df.fillna()',
      category: 'nulls',
      syntax: 'df.fillna(value)  |  df.fillna({"col1": val1, "col2": val2})',
      shortDescription: 'Replace null values with a specified default',
      longDescription: `fillna() replaces null values across the DataFrame or in specific columns. You can pass a scalar (applies to all matching-type columns) or a dictionary mapping column names to fill values.`,
      examples: [
        {
          label: 'Fill nulls',
          code: `# Fill all string nulls
df = df.fillna("Unknown")

# Fill all numeric nulls
df = df.fillna(0)

# Fill specific columns with specific values
df = df.fillna({
    "country":   "Unknown",
    "age":       0,
    "revenue":   0.0,
    "is_active": False,
})`,
        },
        {
          label: 'Fill with column statistics',
          code: `# Fill with mean
mean_val = df.select(mean("age")).first()[0]
df = df.fillna({"age": mean_val})`,
        },
      ],
      tags: ['fillna', 'fill', 'null', 'default', 'missing'],
      difficulty: 'beginner',
    },

    {
      id: 'dropna',
      name: 'df.dropna()',
      category: 'nulls',
      syntax: 'df.dropna(how="any", subset=["col1", "col2"])',
      shortDescription: 'Drop rows containing null values',
      longDescription: `dropna() removes rows with null values. how="any" drops a row if ANY specified column is null. how="all" drops only rows where ALL columns are null. subset limits the check to specified columns.`,
      examples: [
        {
          label: 'Drop null rows',
          code: `# Drop rows where any column is null
df = df.dropna()

# Drop rows where specific critical columns are null
df = df.dropna(subset=["order_id", "customer_id", "amount"])

# Drop only rows where ALL columns are null
df = df.dropna(how="all")`,
        },
      ],
      tags: ['dropna', 'drop', 'null', 'missing', 'clean'],
      difficulty: 'beginner',
    },

    {
      id: 'nanvl',
      name: 'nanvl() / isnan()',
      category: 'nulls',
      syntax: 'nanvl(col("col"), replacement)  |  isnan(col("col"))',
      shortDescription: 'Handle NaN (Not a Number) values in float columns',
      longDescription: `NaN is different from null in PySpark. Float columns can contain NaN values which behave differently from null in aggregations. nanvl() replaces NaN with a fallback value. isnan() filters NaN rows. Always handle NaN separately from null in numeric columns.`,
      examples: [
        {
          label: 'Handle NaN in float columns',
          code: `from pyspark.sql.functions import nanvl, isnan, col, lit

# Replace NaN with 0.0
df = df.withColumn("score", nanvl(col("score"), lit(0.0)))

# Find rows with NaN
df.filter(isnan(col("ratio"))).count()

# Replace both NaN and null
from pyspark.sql.functions import coalesce, when
df = df.withColumn("value",
    coalesce(
        when(~isnan(col("value")), col("value")),
        lit(0.0)
    )
)`,
        },
      ],
      notes: [
        'NaN is NOT the same as null — sum(NaN) = NaN, sum(null) ignores nulls',
        'JSON parsing often creates NaN for invalid numerics',
      ],
      tags: ['nan', 'nanvl', 'isnan', 'float', 'numeric', 'missing'],
      difficulty: 'intermediate',
    },

    // ─────────────────────────────────────────────
    // AGGREGATIONS
    // ─────────────────────────────────────────────
    {
      id: 'groupby-agg',
      name: 'df.groupBy().agg()',
      category: 'aggregations',
      syntax: 'df.groupBy("col").agg(count("*"), sum("val"), avg("val"))',
      shortDescription: 'Group rows and apply one or many aggregate functions',
      longDescription: `groupBy().agg() is the primary aggregation pattern. Pass multiple expressions to .agg() to compute all aggregations in a single pass — far more efficient than multiple separate groupBy calls. You can alias each result within agg().`,
      examples: [
        {
          label: 'Multi-aggregation in one pass',
          code: `from pyspark.sql.functions import (
    col, count, countDistinct, sum, avg, mean,
    max, min, stddev, variance, first, last,
    collect_list, collect_set
)

df.groupBy("department", "region").agg(
    count("*").alias("total_rows"),
    countDistinct("customer_id").alias("unique_customers"),
    sum("revenue").alias("total_revenue"),
    avg("revenue").alias("avg_revenue"),
    max("revenue").alias("max_revenue"),
    min("revenue").alias("min_revenue"),
    stddev("revenue").alias("stddev_revenue"),
    first("category").alias("sample_category"),
    collect_set("product").alias("unique_products"),
).show()`,
        },
      ],
      performance: 'All aggregations in one .agg() call = one data shuffle. Multiple separate groupBy calls = multiple shuffles.',
      tags: ['groupby', 'agg', 'aggregate', 'group', 'sum', 'count', 'avg'],
      difficulty: 'beginner',
    },

    {
      id: 'count-distinct',
      name: 'countDistinct() / approx_count_distinct()',
      category: 'aggregations',
      syntax: 'countDistinct("col")  |  approx_count_distinct("col", rsd)',
      shortDescription: 'Count unique values — exact or approximate',
      longDescription: `countDistinct() computes the exact count of unique values. For large datasets, approx_count_distinct() uses HyperLogLog++ algorithm to give an approximate count in a fraction of the time and memory. The rsd parameter controls accuracy (default 0.05 = 5% error, lower = more accurate but slower).`,
      examples: [
        {
          label: 'Exact vs approximate distinct count',
          code: `from pyspark.sql.functions import countDistinct, approx_count_distinct, col

# Exact — expensive on large datasets
df.agg(countDistinct("user_id").alias("exact_users")).show()

# Approximate — 5% error, 100x faster on billions of rows
df.agg(
    approx_count_distinct("user_id", rsd=0.05).alias("approx_users")
).show()

# In groupBy
df.groupBy("product").agg(
    approx_count_distinct("user_id", 0.02).alias("approx_buyers")
).show()`,
        },
      ],
      notes: [
        'approx_count_distinct with rsd=0.05 is ~5% error but uses O(1) memory vs O(n) for exact',
        'For reporting dashboards, approximate counts are usually fine',
        'For billing or compliance, use exact countDistinct',
      ],
      performance: 'approx_count_distinct is 10-100x faster than countDistinct on datasets with millions of distinct values.',
      tags: ['countdistinct', 'approx_count_distinct', 'cardinality', 'hll', 'performance'],
      difficulty: 'intermediate',
    },

    {
      id: 'percentile',
      name: 'percentile_approx() / median()',
      category: 'aggregations',
      syntax: 'percentile_approx("col", 0.5, accuracy=10000)',
      shortDescription: 'Compute approximate percentiles at massive scale',
      longDescription: `percentile_approx() computes approximate quantiles using the Greenwald-Khanna algorithm. It is far more scalable than exact percentiles. Pass a list of percentiles to compute multiple in one pass. accuracy controls error vs memory trade-off.`,
      examples: [
        {
          label: 'Compute percentiles at scale',
          code: `from pyspark.sql.functions import percentile_approx, col

# Median (p50)
df.agg(percentile_approx("revenue", 0.5).alias("median_revenue")).show()

# Multiple percentiles in one pass
df.agg(
    percentile_approx("latency", [0.50, 0.75, 0.90, 0.95, 0.99]).alias("percentiles")
).show()

# By group
df.groupBy("product").agg(
    percentile_approx("price", [0.25, 0.5, 0.75]).alias("quartiles")
).show()`,
        },
      ],
      performance: 'Exact percentiles require sorting all data — O(n log n). percentile_approx uses O(1/accuracy) memory.',
      tags: ['percentile', 'percentile_approx', 'median', 'quantile', 'distribution'],
      difficulty: 'intermediate',
    },

    {
      id: 'collect-list-set',
      name: 'collect_list() / collect_set()',
      category: 'aggregations',
      syntax: 'collect_list("col")  |  collect_set("col")',
      shortDescription: 'Aggregate values into an array per group',
      longDescription: `collect_list() aggregates all values in a group into an array (preserving order and duplicates). collect_set() returns distinct values only. Use with caution on large groups — collecting millions of values per key can cause OOM errors on the driver.`,
      examples: [
        {
          label: 'Collect into arrays',
          code: `from pyspark.sql.functions import collect_list, collect_set, sort_array, col

# All purchases per customer
df.groupBy("customer_id").agg(
    collect_list("product").alias("all_products"),     # with duplicates
    collect_set("category").alias("unique_categories") # distinct only
).show()

# Sorted list
df.groupBy("user_id").agg(
    sort_array(collect_list("event_type")).alias("event_sequence")
).show()`,
        },
      ],
      notes: [
        'If groups have millions of rows, collect_list will OOM — sample or limit first',
        'collect_set result order is non-deterministic',
      ],
      tags: ['collect_list', 'collect_set', 'array', 'aggregate', 'group'],
      difficulty: 'intermediate',
    },

    {
      id: 'agg-functions-misc',
      name: 'first() / last() / sum_distinct()',
      category: 'aggregations',
      syntax: 'first("col", ignorenulls=True)  |  last("col")  |  sumDistinct("col")',
      shortDescription: 'Miscellaneous aggregation functions',
      longDescription: `first() returns the first value in a group (non-deterministic without ORDER BY). last() returns the last. Both accept ignorenulls=True to skip nulls. sumDistinct() sums only unique values in a group.`,
      examples: [
        {
          label: 'First, last, sum_distinct',
          code: `from pyspark.sql.functions import first, last, sum_distinct, col

df.groupBy("session_id").agg(
    first("page_url", ignorenulls=True).alias("entry_page"),
    last("page_url",  ignorenulls=True).alias("exit_page"),
    sum_distinct("product_id").alias("unique_product_sum"),
).show()`,
        },
      ],
      tags: ['first', 'last', 'sum_distinct', 'aggregate'],
      difficulty: 'intermediate',
    },

    // ─────────────────────────────────────────────
    // JOINS
    // ─────────────────────────────────────────────
    {
      id: 'join',
      name: 'df.join()',
      category: 'joins',
      syntax: 'df1.join(df2, on="key", how="inner")',
      shortDescription: 'Join two DataFrames — the most common multi-table operation',
      longDescription: `join() combines two DataFrames on a key column or condition. The how parameter controls the join type: inner, left, right, full, left_semi, left_anti, cross. For large tables, Spark uses sort-merge join by default. For small lookup tables, broadcast join is dramatically faster.`,
      parameters: [
        { name: 'other', type: 'DataFrame', required: true, description: 'Right-side DataFrame' },
        { name: 'on', type: 'str | list | Column', required: false, description: 'Join key column(s) or condition expression' },
        { name: 'how', type: 'str', required: false, default: 'inner', description: 'inner / left / right / full / left_semi / left_anti / cross' },
      ],
      returns: 'DataFrame',
      examples: [
        {
          label: 'All join types',
          code: `# Inner join (default)
result = orders.join(customers, "customer_id", "inner")

# Left join — keep all left rows
result = orders.join(customers, "customer_id", "left")

# Left semi-join — like inner but returns only left columns
result = orders.join(customers, "customer_id", "left_semi")

# Left anti-join — rows in left NOT in right
orphan_orders = orders.join(customers, "customer_id", "left_anti")

# Join on multiple columns
result = df1.join(df2, ["year", "month", "region"], "inner")

# Join on expression (different column names)
result = orders.join(customers,
    orders.cust_id == customers.customer_id, "left")`,
        },
        {
          label: 'Broadcast join (small table optimization)',
          code: `from pyspark.sql.functions import broadcast

# Hint Spark to broadcast the small lookup table
result = large_orders.join(
    broadcast(small_lookup_table),
    "region_code",
    "left"
)`,
        },
      ],
      notes: [
        'Avoid joining on nullable columns — nulls never match nulls in SQL semantics',
        'Rename ambiguous columns before joining to avoid resolution errors',
        'Use broadcast() for tables < 100MB for dramatic speed improvement',
      ],
      performance: 'Sort-merge join shuffles both datasets. Broadcast join shuffles only the large one. For a 10GB vs 10MB join, broadcast is 10-100x faster.',
      tags: ['join', 'merge', 'combine', 'inner', 'left', 'right', 'full', 'semi', 'anti'],
      difficulty: 'beginner',
    },

    {
      id: 'broadcast',
      name: 'broadcast()',
      category: 'joins',
      syntax: 'df1.join(broadcast(small_df), "key")',
      shortDescription: 'Force a small DataFrame to be broadcast to all executors',
      longDescription: `broadcast() tells Spark to send a copy of the DataFrame to every executor, eliminating the shuffle for one side of the join. This is the most impactful single-line optimization for joins involving one large and one small (< 100MB) table. Spark auto-broadcasts tables below autoBroadcastJoinThreshold, but explicit broadcast() ensures it always happens.`,
      examples: [
        {
          label: 'Broadcast pattern',
          code: `from pyspark.sql.functions import broadcast

# Small dimension tables are perfect for broadcast
country_lookup = spark.read.parquet("s3://bucket/dim/countries")   # 500KB
currency_rates = spark.read.parquet("s3://bucket/dim/currencies")  # 1MB

# Both small tables are broadcast — no shuffle at all
result = large_events \
    .join(broadcast(country_lookup),  "country_code", "left") \
    .join(broadcast(currency_rates),  "currency",     "left")`,
        },
        {
          label: 'Tune broadcast threshold',
          code: `# Auto-broadcast all tables < 50MB (default is 10MB)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", str(50 * 1024 * 1024))

# Disable auto-broadcast completely (for testing)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "-1")`,
        },
      ],
      performance: 'Eliminates the shuffle for the broadcast side entirely. On billion-row datasets, this saves minutes per join.',
      tags: ['broadcast', 'join', 'optimization', 'performance', 'shuffle'],
      difficulty: 'intermediate',
    },

    {
      id: 'join-skew',
      name: 'Skewed Join (Salting)',
      category: 'joins',
      syntax: '# Technique: add random salt key to distribute hot keys',
      shortDescription: 'Handle data skew in joins — essential for production at scale',
      longDescription: `Data skew occurs when a small number of key values hold most of the data (e.g., 80% of orders are for one product). This causes a few executors to process gigabytes while others process megabytes, creating a straggler bottleneck. Salting artificially distributes the hot key across multiple partitions.`,
      examples: [
        {
          label: 'Salt-based skew fix',
          code: `from pyspark.sql.functions import col, lit, rand, floor, concat_ws, explode, array

SALT_FACTOR = 50  # number of buckets to split hot key into

# Step 1: Add random salt to the large table
large = large_df.withColumn(
    "salt_key",
    concat_ws("_", col("join_key"), (floor(rand() * SALT_FACTOR)).cast("string"))
)

# Step 2: Explode the small table to match all salt buckets
small_exploded = small_df.withColumn(
    "salt_range", array([lit(str(i)) for i in range(SALT_FACTOR)])
).select(
    "*",
    explode("salt_range").alias("salt_val")
).withColumn(
    "salt_key",
    concat_ws("_", col("join_key"), col("salt_val"))
).drop("salt_range", "salt_val")

# Step 3: Join on the salted key
result = large.join(broadcast(small_exploded), "salt_key", "inner") \
    .drop("salt_key")`,
        },
        {
          label: 'AQE skew join (Spark 3.x)',
          code: `# Let AQE handle it automatically (Spark 3.x+)
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
# AQE splits skewed partitions at runtime automatically`,
        },
      ],
      notes: [
        'AQE skewJoin.enabled handles most skew automatically in Spark 3.x',
        'Manual salting gives more control for extreme skew',
        'Identify skewed keys first: df.groupBy("key").count().orderBy("count", ascending=False).show(20)',
      ],
      performance: 'Skewed joins are the #1 cause of Spark job timeouts. Fix skew and jobs that take hours may run in minutes.',
      tags: ['skew', 'salt', 'join', 'skewed', 'hot-key', 'performance', 'distribution'],
      difficulty: 'advanced',
    },

    // ─────────────────────────────────────────────
    // WINDOW FUNCTIONS
    // ─────────────────────────────────────────────
    {
      id: 'window-spec',
      name: 'Window.partitionBy().orderBy()',
      category: 'window',
      syntax: 'Window.partitionBy("col").orderBy("col").rowsBetween(start, end)',
      shortDescription: 'Define a window specification for window functions',
      longDescription: `A WindowSpec defines the logical "window" of rows that a window function operates over. partitionBy() defines groups (like GROUP BY but without collapsing rows). orderBy() determines row order within each partition. rowsBetween() and rangeBetween() define which rows in the window to include.`,
      examples: [
        {
          label: 'Common window specs',
          code: `from pyspark.sql.window import Window
from pyspark.sql.functions import col

# All rows in the partition (unordered)
all_rows = Window.partitionBy("department")

# Rows ordered — all preceding rows up to current row (running total)
running_total = Window.partitionBy("department") \
    .orderBy("date") \
    .rowsBetween(Window.unboundedPreceding, Window.currentRow)

# Preceding 6 rows + current row (7-row rolling window)
rolling_7 = Window.partitionBy("product") \
    .orderBy("date") \
    .rowsBetween(-6, 0)

# Entire ordered partition (for cumulative ranks)
ordered = Window.partitionBy("region").orderBy(col("revenue").desc())`,
        },
      ],
      performance: 'Window functions shuffle by partitionBy key. Keep partitions large enough to avoid massive shuffles.',
      tags: ['window', 'windowspec', 'partitionby', 'orderby', 'frame'],
      difficulty: 'intermediate',
    },

    {
      id: 'row-number',
      name: 'row_number()',
      category: 'window',
      syntax: 'row_number().over(Window.partitionBy(...).orderBy(...))',
      shortDescription: 'Assign a unique sequential number to each row within a partition',
      longDescription: `row_number() assigns 1, 2, 3, ... to rows within each partition in the specified order. Rows with identical ORDER BY values get different (arbitrary) numbers. Use for deduplication (keep row 1 per key) or top-N per group patterns.`,
      examples: [
        {
          label: 'Deduplication — keep latest record',
          code: `from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, col

window = Window.partitionBy("customer_id").orderBy(col("updated_at").desc())

deduped = df \
    .withColumn("rn", row_number().over(window)) \
    .filter(col("rn") == 1) \
    .drop("rn")`,
        },
        {
          label: 'Top N per group',
          code: `# Top 3 products by revenue per region
window = Window.partitionBy("region").orderBy(col("revenue").desc())

top3 = df \
    .withColumn("rn", row_number().over(window)) \
    .filter(col("rn") <= 3) \
    .drop("rn")`,
        },
      ],
      tags: ['row_number', 'dedup', 'top-n', 'window', 'rank'],
      difficulty: 'intermediate',
    },

    {
      id: 'rank-dense-rank',
      name: 'rank() / dense_rank()',
      category: 'window',
      syntax: 'rank().over(window)  |  dense_rank().over(window)',
      shortDescription: 'Assign ranks — rank() leaves gaps for ties, dense_rank() does not',
      longDescription: `rank() assigns the same rank to tied rows but skips numbers after ties (1, 1, 3). dense_rank() also assigns the same rank to ties but uses consecutive numbers (1, 1, 2). Use dense_rank() when you want no gaps in the ranking sequence.`,
      examples: [
        {
          label: 'rank vs dense_rank',
          code: `from pyspark.sql.window import Window
from pyspark.sql.functions import rank, dense_rank, col

window = Window.partitionBy("department").orderBy(col("salary").desc())

df.withColumns({
    "rank":       rank().over(window),       # 1, 1, 3, 4 (gap after tie)
    "dense_rank": dense_rank().over(window), # 1, 1, 2, 3 (no gap)
}).show()`,
        },
      ],
      tags: ['rank', 'dense_rank', 'window', 'ranking'],
      difficulty: 'intermediate',
    },

    {
      id: 'lag-lead',
      name: 'lag() / lead()',
      category: 'window',
      syntax: 'lag("col", n, default).over(window)  |  lead("col", n, default).over(window)',
      shortDescription: 'Access a value from N rows before or after the current row',
      longDescription: `lag() looks backward n rows. lead() looks forward n rows. Both accept a default value for rows where the offset falls outside the window. Essential for calculating period-over-period changes, time differences between events, or session analysis.`,
      examples: [
        {
          label: 'Period-over-period comparison',
          code: `from pyspark.sql.window import Window
from pyspark.sql.functions import lag, lead, col

window = Window.partitionBy("product").orderBy("date")

df = df.withColumns({
    # Previous day's value
    "prev_revenue":     lag("revenue",  1, 0).over(window),
    # Next day's value
    "next_revenue":     lead("revenue", 1, 0).over(window),
    # Day-over-day change
    "revenue_change":   col("revenue") - lag("revenue", 1).over(window),
    # MoM % change
    "revenue_pct_chg":  (col("revenue") - lag("revenue", 1).over(window)) / lag("revenue", 1).over(window) * 100,
    # Time between events (seconds)
    "seconds_between":  col("event_ts").cast("long") - lag(col("event_ts").cast("long"), 1).over(window),
})`,
        },
      ],
      tags: ['lag', 'lead', 'window', 'offset', 'prev', 'next', 'time-series'],
      difficulty: 'intermediate',
    },

    {
      id: 'running-total',
      name: 'Running Total / Cumulative Sum',
      category: 'window',
      syntax: 'sum("val").over(Window.partitionBy(...).orderBy(...).rowsBetween(unboundedPreceding, currentRow))',
      shortDescription: 'Compute a running/cumulative total within each partition',
      longDescription: `A running total sums all rows from the start of the partition up to and including the current row. Combined with lag() and lead(), this pattern is the foundation of time-series analysis in PySpark.`,
      examples: [
        {
          label: 'Running total and cumulative metrics',
          code: `from pyspark.sql.window import Window
from pyspark.sql.functions import sum, avg, max, count, col

# Window: all preceding rows up to current row
running_window = Window.partitionBy("customer_id") \
    .orderBy("order_date") \
    .rowsBetween(Window.unboundedPreceding, Window.currentRow)

df = df.withColumns({
    "running_spend":      sum("amount").over(running_window),
    "running_orders":     count("*").over(running_window),
    "running_avg_spend":  avg("amount").over(running_window),
    "max_order_so_far":   max("amount").over(running_window),
})`,
        },
        {
          label: '7-day rolling average',
          code: `rolling_7d = Window.partitionBy("product") \
    .orderBy("date") \
    .rowsBetween(-6, 0)  # current row + 6 preceding = 7 rows

df = df.withColumn("rolling_7d_avg_revenue", avg("revenue").over(rolling_7d))`,
        },
      ],
      tags: ['running', 'cumulative', 'sum', 'window', 'rolling', 'time-series'],
      difficulty: 'intermediate',
    },

    {
      id: 'ntile',
      name: 'ntile() / percent_rank() / cume_dist()',
      category: 'window',
      syntax: 'ntile(n).over(window)',
      shortDescription: 'Divide rows into N equal buckets, compute percentile rank or cumulative distribution',
      longDescription: `ntile(n) assigns each row to one of N buckets (e.g., quartiles with ntile(4)). percent_rank() returns the relative rank as a fraction 0-1. cume_dist() returns what fraction of rows have a value <= the current row.`,
      examples: [
        {
          label: 'Percentile bucketing',
          code: `from pyspark.sql.window import Window
from pyspark.sql.functions import ntile, percent_rank, cume_dist, col

window = Window.partitionBy("region").orderBy("revenue")

df = df.withColumns({
    "quartile":      ntile(4).over(window),      # 1, 2, 3, 4
    "decile":        ntile(10).over(window),     # 1-10
    "percent_rank":  percent_rank().over(window), # 0.0 - 1.0
    "cume_dist":     cume_dist().over(window),   # fraction of rows ≤ current
})`,
        },
      ],
      tags: ['ntile', 'percentile', 'bucket', 'quartile', 'window', 'distribution'],
      difficulty: 'intermediate',
    },

    // ─────────────────────────────────────────────
    // ARRAYS & MAPS
    // ─────────────────────────────────────────────
    {
      id: 'array-functions',
      name: 'array_contains() / size() / array_distinct()',
      category: 'arrays',
      syntax: 'array_contains(col("arr"), value)  |  size(col("arr"))',
      shortDescription: 'Core operations on ArrayType columns',
      longDescription: `PySpark provides a rich set of array functions for working with ArrayType columns. These are essential for nested data from JSON, or after collect_list() operations.`,
      examples: [
        {
          label: 'Common array operations',
          code: `from pyspark.sql.functions import (
    array_contains, array_distinct, array_except,
    array_intersect, array_union, array_sort,
    flatten, reverse, size, slice, col
)

# Check if array contains value
df.filter(array_contains(col("tags"), "premium")).show()

# Count array elements
df = df.withColumn("num_items", size(col("items")))

# Remove duplicates from array
df = df.withColumn("unique_tags", array_distinct(col("tags")))

# Sort array elements
df = df.withColumn("sorted_items", array_sort(col("items")))

# Slice: first 3 elements (1-indexed)
df = df.withColumn("top3_items", slice(col("items"), 1, 3))

# Flatten array of arrays
df = df.withColumn("flat_list", flatten(col("nested_arrays")))`,
        },
      ],
      tags: ['array', 'array_contains', 'size', 'array_distinct', 'flatten'],
      difficulty: 'intermediate',
    },

    {
      id: 'map-functions',
      name: 'map_keys() / map_values() / element_at()',
      category: 'arrays',
      syntax: 'map_keys(col("map"))  |  map_values(col("map"))  |  element_at(col("map"), "key")',
      shortDescription: 'Operations on MapType (key-value) columns',
      longDescription: `MapType columns store key-value pairs. map_keys() and map_values() extract all keys/values as arrays. element_at() retrieves a specific value by key. The [] indexing operator also works. Essential for working with JSON properties or metadata stored as maps.`,
      examples: [
        {
          label: 'Map operations',
          code: `from pyspark.sql.functions import map_keys, map_values, element_at, col

# Extract all keys and values
df = df.withColumns({
    "all_keys":   map_keys(col("properties")),
    "all_values": map_values(col("properties")),
})

# Get a specific key
df = df.withColumn("user_agent", element_at(col("headers"), "User-Agent"))

# Using [] syntax (equivalent)
df = df.withColumn("content_type", col("headers")["Content-Type"])`,
        },
      ],
      tags: ['map', 'map_keys', 'map_values', 'element_at', 'dict', 'nested'],
      difficulty: 'intermediate',
    },

    {
      id: 'transform-array',
      name: 'transform() / filter() / aggregate()',
      category: 'arrays',
      syntax: 'transform(col("arr"), lambda x: x * 2)',
      shortDescription: 'Apply a lambda function to each element of an array column',
      longDescription: `Higher-order functions (Spark 2.4+) allow you to apply lambda expressions to array elements without exploding/imploding. transform() maps over elements, filter() keeps matching elements, aggregate() folds elements into a single value. These avoid the expensive explode→process→collect round-trip.`,
      examples: [
        {
          label: 'Higher-order array functions',
          code: `from pyspark.sql.functions import transform, filter, aggregate, col, lit

# transform: multiply each element by 2
df = df.withColumn("doubled", transform(col("prices"), lambda x: x * 2))

# filter: keep only elements > 100
df = df.withColumn("high_prices", filter(col("prices"), lambda x: x > 100))

# aggregate: sum all array elements
df = df.withColumn("total_price",
    aggregate(col("prices"), lit(0.0), lambda acc, x: acc + x))

# Using expr for SQL syntax
from pyspark.sql.functions import expr
df = df.withColumn("high_prices_sql",
    expr("filter(prices, x -> x > 100)"))`,
        },
      ],
      notes: [
        'Higher-order functions avoid explode→process→collect — more efficient on large arrays',
        'Spark 2.4+ required for lambda syntax',
        'expr() with SQL syntax is often more readable than Python lambda syntax',
      ],
      tags: ['transform', 'filter', 'aggregate', 'higher-order', 'lambda', 'array'],
      difficulty: 'advanced',
    },

    // ─────────────────────────────────────────────
    // SORTING & RANKING
    // ─────────────────────────────────────────────
    {
      id: 'orderBy',
      name: 'df.orderBy() / df.sort()',
      category: 'sorting',
      syntax: 'df.orderBy("col", ascending=False)  |  df.orderBy(col("col").desc())',
      shortDescription: 'Sort a DataFrame by one or more columns',
      longDescription: `orderBy() and sort() are aliases. Sorting is a full shuffle — very expensive for large datasets. Only sort when necessary (e.g., before writing sorted Parquet for downstream queries, or for final output). Sort pushdown into partitions with sortWithinPartitions() is cheaper for downstream efficiency.`,
      examples: [
        {
          label: 'Sort in various ways',
          code: `from pyspark.sql.functions import col, asc, desc

# Simple sort
df.orderBy("revenue").show()

# Descending
df.orderBy(col("revenue").desc()).show()
df.orderBy("revenue", ascending=False).show()

# Multiple columns
df.orderBy(col("region").asc(), col("revenue").desc()).show()

# Nulls first or last
df.orderBy(col("revenue").desc_nulls_last()).show()`,
        },
        {
          label: 'Sort within partitions (cheaper)',
          code: `# Sort locally within each partition — cheaper than global sort
# Good for ensuring consistent order within partitions before writing
df.sortWithinPartitions("date", "customer_id") \
  .write.parquet("s3://bucket/output/")`,
        },
      ],
      notes: [
        'Global orderBy is a full shuffle — avoid unless absolutely necessary',
        'sortWithinPartitions is much cheaper — no shuffle, sorts locally',
        'For final display, .limit(100).orderBy() is much cheaper than orderBy().limit(100)',
      ],
      performance: 'Use limit().orderBy() rather than orderBy().limit() — collects fewer rows before sorting.',
      tags: ['orderby', 'sort', 'ascending', 'descending', 'order'],
      difficulty: 'beginner',
    },

    // ─────────────────────────────────────────────
    // DEDUP & SAMPLING
    // ─────────────────────────────────────────────
    {
      id: 'dropDuplicates',
      name: 'df.dropDuplicates() / df.distinct()',
      category: 'dedup',
      syntax: 'df.dropDuplicates(["col1", "col2"])  |  df.distinct()',
      shortDescription: 'Remove duplicate rows from a DataFrame',
      longDescription: `distinct() removes rows that are identical across all columns. dropDuplicates() lets you specify which columns define uniqueness (subset deduplication) — keeping the first occurrence of each unique combination. For keeping specific rows (e.g., most recent), use row_number() instead.`,
      examples: [
        {
          label: 'Deduplication patterns',
          code: `# Full row deduplication
df_deduped = df.distinct()

# Deduplicate on specific columns (keep first occurrence)
df_deduped = df.dropDuplicates(["customer_id", "order_date"])

# Deduplicate keeping specific row (e.g., latest)
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, col

window = Window.partitionBy("customer_id").orderBy(col("updated_at").desc())
df_deduped = df.withColumn("rn", row_number().over(window)) \
    .filter(col("rn") == 1) \
    .drop("rn")`,
        },
      ],
      notes: [
        'distinct() and dropDuplicates() both trigger a shuffle',
        'dropDuplicates order is non-deterministic — use row_number() if you need the "latest" row',
      ],
      tags: ['distinct', 'dropduplicates', 'dedup', 'unique'],
      difficulty: 'beginner',
    },

    {
      id: 'sample',
      name: 'df.sample() / df.limit()',
      category: 'dedup',
      syntax: 'df.sample(fraction=0.1, seed=42)  |  df.limit(1000)',
      shortDescription: 'Sample a fraction of rows or take a fixed number',
      longDescription: `sample() returns a random fraction of rows (not exact count). withReplacement=True allows a row to appear multiple times (bootstrap sampling). seed ensures reproducibility. limit() takes the first N rows — fast but not random (depends on partition order).`,
      examples: [
        {
          label: 'Sampling patterns',
          code: `# 10% sample (reproducible)
df_sample = df.sample(fraction=0.1, seed=42)

# 1% sample with replacement (bootstrap)
df_bootstrap = df.sample(withReplacement=True, fraction=0.01, seed=42)

# Take first 1000 rows (not random, fast)
df_head = df.limit(1000)

# Consistent hash-based sample (same users every run)
from pyspark.sql.functions import pmod, hash, col
df_sample = df.filter(pmod(abs(hash(col("user_id"))), 100) < 10)  # 10% same users always`,
        },
      ],
      tags: ['sample', 'limit', 'subset', 'random', 'fraction'],
      difficulty: 'beginner',
    },

    // ─────────────────────────────────────────────
    // ACTIONS
    // ─────────────────────────────────────────────
    {
      id: 'show',
      name: 'df.show() / df.display()',
      category: 'actions',
      syntax: 'df.show(n=20, truncate=True, vertical=False)',
      shortDescription: 'Display the first N rows of a DataFrame',
      longDescription: `show() is an action that triggers computation and prints results to the console. It collects up to n rows to the driver. truncate=True (default) limits column widths to 20 characters. For Databricks notebooks, display() renders an interactive HTML table. Never call show() on a huge DataFrame without limit().`,
      examples: [
        {
          label: 'show variations',
          code: `# Default: 20 rows, truncated
df.show()

# 5 rows, no truncation
df.show(5, truncate=False)

# Vertical format (one column per line — useful for wide tables)
df.show(5, vertical=True)

# Show with a limit first (safe)
df.limit(100).show()`,
        },
      ],
      tags: ['show', 'display', 'action', 'print', 'debug'],
      difficulty: 'beginner',
    },

    {
      id: 'count',
      name: 'df.count()',
      category: 'actions',
      syntax: 'df.count()',
      shortDescription: 'Count the total number of rows — triggers full computation',
      longDescription: `count() returns the total number of rows as a Python integer. It is a full scan action — avoid it in the middle of a pipeline unless you need the exact count. Use for data validation, sanity checks, or monitoring. For approximate counts, use approx_count_distinct on a unique key.`,
      examples: [
        {
          label: 'Count patterns',
          code: `# Total rows
total = df.count()
print(f"Total rows: {total:,}")

# Count after filter
active_count = df.filter(col("status") == "active").count()

# Count nulls in a column
null_count = df.filter(col("email").isNull()).count()

# Count distinct values
unique_customers = df.select("customer_id").distinct().count()`,
        },
      ],
      notes: [
        'count() triggers a full scan — expensive on large datasets',
        'In production pipelines, avoid unnecessary count() calls',
        'Use explain() to check if count() triggers unexpected shuffles',
      ],
      tags: ['count', 'action', 'rows', 'scan'],
      difficulty: 'beginner',
    },

    {
      id: 'collect',
      name: 'df.collect() / df.toPandas()',
      category: 'actions',
      syntax: 'df.collect()  |  df.toPandas()',
      shortDescription: 'Collect all rows to the driver as Python objects',
      longDescription: `collect() returns all rows as a list of Row objects. toPandas() converts the DataFrame to a Pandas DataFrame. Both transfer all data to the driver — DANGEROUS for large datasets. Only use after filtering to a small result set. Always limit() before collecting.`,
      examples: [
        {
          label: 'Safe collect patterns',
          code: `# Always limit first!
rows = df.limit(1000).collect()
for row in rows:
    print(row["order_id"], row["amount"])

# Convert small result to Pandas for visualization
summary = df.groupBy("region").agg(sum("revenue")).toPandas()
import matplotlib.pyplot as plt
summary.plot(kind="bar")

# Get first row
first = df.first()   # Row object
val = first["revenue"]

# Get single value
total = df.agg(sum("revenue")).collect()[0][0]`,
        },
      ],
      notes: [
        'collect() on a 10GB DataFrame will crash your driver — always limit()',
        'Use toPandas() only for final small results (< 100K rows)',
      ],
      tags: ['collect', 'topandas', 'action', 'driver'],
      difficulty: 'beginner',
    },

    {
      id: 'foreach',
      name: 'df.foreach() / df.foreachPartition()',
      category: 'actions',
      syntax: 'df.foreach(func)  |  df.foreachPartition(func)',
      shortDescription: 'Apply a function to each row or partition',
      longDescription: `foreach() applies a function to each row. foreachPartition() applies a function to each partition (as an iterator) — more efficient because you can set up a DB connection once per partition rather than per row. Useful for writing to external systems row by row.`,
      examples: [
        {
          label: 'foreachPartition for DB writes',
          code: `def write_to_db(rows):
    # Set up connection ONCE per partition
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for row in rows:
        cursor.execute(
            "INSERT INTO events VALUES (?, ?, ?)",
            (row.event_id, row.user_id, row.event_type)
        )
    
    conn.commit()
    conn.close()

# Execute against each partition
df.foreachPartition(write_to_db)`,
        },
      ],
      notes: [
        'foreachPartition is N times faster than foreach for DB writes (N = rows per partition)',
        'Use JDBC write for bulk loads — foreachPartition for row-by-row custom logic',
      ],
      tags: ['foreach', 'foreachpartition', 'action', 'write', 'external'],
      difficulty: 'intermediate',
    },

    // ─────────────────────────────────────────────
    // PERFORMANCE
    // ─────────────────────────────────────────────
    {
      id: 'cache-persist',
      name: 'df.cache() / df.persist()',
      category: 'performance',
      syntax: 'df.cache()  |  df.persist(StorageLevel.MEMORY_AND_DISK)',
      shortDescription: 'Cache a DataFrame in memory to avoid recomputation',
      longDescription: `cache() and persist() store a DataFrame in memory (or disk) after first computation, so subsequent actions reuse it without recomputing the full lineage. Essential when a DataFrame is used more than once. cache() is equivalent to persist(MEMORY_AND_DISK). Always unpersist() when done to free memory.`,
      examples: [
        {
          label: 'Cache and unpersist pattern',
          code: `from pyspark import StorageLevel

# cache() = MEMORY_AND_DISK (recommended default)
df_base = spark.read.parquet("s3://bucket/large_dataset/") \
    .filter(col("year") == 2024) \
    .cache()

# Force materialization (cache() is lazy)
df_base.count()  # triggers caching

# Now reuse without recomputation
count_by_region  = df_base.groupBy("region").count()
count_by_product = df_base.groupBy("product").count()
summary_stats    = df_base.agg(sum("revenue"), avg("amount"))

# Always free memory when done
df_base.unpersist()`,
        },
        {
          label: 'Storage levels',
          code: `from pyspark import StorageLevel

# In-memory only (fast but may evict on OOM)
df.persist(StorageLevel.MEMORY_ONLY)

# In-memory + disk (spill to disk on OOM — safe choice)
df.persist(StorageLevel.MEMORY_AND_DISK)

# Disk only (slow but always available)
df.persist(StorageLevel.DISK_ONLY)

# Replicated (for fault tolerance)
df.persist(StorageLevel.MEMORY_AND_DISK_2)`,
        },
      ],
      notes: [
        'cache() is lazy — data is not cached until an action is called',
        'Call .count() after .cache() to force materialization',
        'Always unpersist() — cached DataFrames persist until unpersisted or session ends',
        'Monitor cache via Spark UI → Storage tab',
      ],
      performance: 'If a DataFrame is used 3+ times without caching, you are recomputing it from scratch each time — potentially reading GB from S3 repeatedly.',
      tags: ['cache', 'persist', 'storage', 'performance', 'memory', 'recompute'],
      difficulty: 'intermediate',
    },

    {
      id: 'repartition',
      name: 'df.repartition() / df.coalesce()',
      category: 'performance',
      syntax: 'df.repartition(n)  |  df.repartition(n, "col")  |  df.coalesce(n)',
      shortDescription: 'Control the number and layout of DataFrame partitions',
      longDescription: `repartition(n) triggers a full shuffle to redistribute data into exactly n partitions. repartition("col") shuffles data so all rows with the same value are in the same partition (like a pre-shuffle for joins). coalesce(n) REDUCES partition count without a full shuffle — much cheaper. Use coalesce to reduce small partitions before writing.`,
      examples: [
        {
          label: 'Repartition patterns',
          code: `# Increase parallelism for large operations
df = df.repartition(400)

# Partition by a column (co-locate for faster joins later)
df = df.repartition(200, "customer_id")

# Reduce to 100 partitions without shuffle (cheap)
df = df.coalesce(100)

# Check current partition count
print(df.rdd.getNumPartitions())

# Write exactly 1 file per partition (avoid small files)
df.coalesce(100).write.parquet("s3://bucket/output/")`,
        },
        {
          label: 'Target partition sizing',
          code: `# Rule of thumb: 128MB - 1GB per partition
# If dataset is 100GB → target 200 partitions (500MB each)

data_size_gb = 100
target_partition_size_gb = 0.5
num_partitions = int(data_size_gb / target_partition_size_gb)  # 200

df = df.repartition(num_partitions)`,
        },
      ],
      notes: [
        'repartition() = full shuffle (expensive). coalesce() = no shuffle (cheap)',
        'Default 200 shuffle partitions is often wrong — tune with spark.sql.shuffle.partitions',
        'Under-partitioned (too few) → OOM. Over-partitioned (too many) → task overhead',
      ],
      performance: 'Incorrect partition count is one of the most common performance problems. Too few = OOM. Too many = scheduler overhead.',
      tags: ['repartition', 'coalesce', 'partitions', 'parallelism', 'performance'],
      difficulty: 'intermediate',
    },

    {
      id: 'explain',
      name: 'df.explain()',
      category: 'performance',
      syntax: 'df.explain(mode="cost" | "extended" | "formatted")',
      shortDescription: 'View the query execution plan for optimization',
      longDescription: `explain() prints Spark's logical and physical query plans. Use it to verify that predicate pushdown is working, broadcasts are being applied, and joins are using the expected strategy. "extended" shows all plan stages. "cost" includes cost estimates. "formatted" gives the most readable output.`,
      examples: [
        {
          label: 'Read query plans',
          code: `# Simple explanation
df.explain()

# Extended plan (logical + physical + analysis)
df.explain("extended")

# Formatted (most readable, Spark 3.x)
df.explain("formatted")

# Practical pattern: verify broadcast join
result = large_df.join(broadcast(small_df), "key")
result.explain("formatted")
# Look for: BroadcastHashJoin in the plan
# If you see SortMergeJoin instead, broadcast is not applied`,
        },
      ],
      notes: [
        'Look for SortMergeJoin → indicates a large-large join (may need optimization)',
        'Look for BroadcastHashJoin → broadcast is working',
        'Look for Filter at the bottom of the scan → predicate pushdown is active',
        'FileScan with PushedFilters → parquet predicate pushdown working',
      ],
      tags: ['explain', 'query-plan', 'optimization', 'debug', 'performance'],
      difficulty: 'advanced',
    },

    {
      id: 'aqe',
      name: 'Adaptive Query Execution (AQE)',
      category: 'performance',
      syntax: 'spark.conf.set("spark.sql.adaptive.enabled", "true")',
      shortDescription: 'Let Spark dynamically optimize queries at runtime (Spark 3.x)',
      longDescription: `Adaptive Query Execution (AQE) collects statistics at runtime and re-optimizes the query plan as it executes. It automatically: (1) coalesces small shuffle partitions to avoid tiny task overhead, (2) converts sort-merge joins to broadcast joins when one side turns out to be small, (3) splits skewed partitions to fix data skew. It is the most impactful free optimization in Spark 3.x.`,
      examples: [
        {
          label: 'Enable all AQE features',
          code: `# Enable AQE (disabled by default in Spark 3.0, enabled by default in Spark 3.2+)
spark.conf.set("spark.sql.adaptive.enabled", "true")

# Auto-coalesce shuffle partitions
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.advisoryPartitionSizeInBytes", "128mb")

# Auto-convert sort-merge to broadcast at runtime
spark.conf.set("spark.sql.adaptive.localShuffleReader.enabled", "true")

# Auto-fix data skew in joins
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256mb")`,
        },
      ],
      notes: [
        'AQE is enabled by default in Spark 3.2+',
        'AQE alone can reduce runtime by 2-10x without code changes',
        'Check AQE decisions in Spark UI → SQL tab → query details',
      ],
      performance: 'Enable AQE before any other optimization. It is the highest ROI config change in Spark 3.x.',
      tags: ['aqe', 'adaptive', 'optimization', 'performance', 'spark3', 'automatic'],
      difficulty: 'intermediate',
    },

    {
      id: 'shuffle-partitions',
      name: 'spark.sql.shuffle.partitions',
      category: 'performance',
      syntax: 'spark.conf.set("spark.sql.shuffle.partitions", "n")',
      shortDescription: 'The single most important Spark configuration for performance',
      longDescription: `spark.sql.shuffle.partitions controls how many partitions are created after a shuffle (joins, groupBy, orderBy). The default is 200 — too low for big data (creates 200 tasks processing GBs each), too high for local/small data (creates 200 near-empty tasks). Rule of thumb: set to 2-4x the number of executor cores.`,
      examples: [
        {
          label: 'Tune shuffle partitions',
          code: `# Default: 200 (usually wrong)
# Local dev (small data)
spark.conf.set("spark.sql.shuffle.partitions", "8")

# Medium cluster (50 cores)
spark.conf.set("spark.sql.shuffle.partitions", "200")

# Large cluster (500 cores)
spark.conf.set("spark.sql.shuffle.partitions", "2000")

# Formula: total_executor_cores * 2-4
total_cores = 500  # your cluster
spark.conf.set("spark.sql.shuffle.partitions", str(total_cores * 3))

# Let AQE choose automatically (Spark 3.x)
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
# AQE will collapse many small partitions into fewer large ones`,
        },
      ],
      performance: 'Wrong shuffle partition count causes either OOM (too few) or excessive task overhead (too many). This one config can 5x your job performance.',
      tags: ['shuffle', 'partitions', 'config', 'performance', 'tuning'],
      difficulty: 'intermediate',
    },

    {
      id: 'z-order',
      name: 'Z-Ordering / OPTIMIZE (Delta Lake)',
      category: 'performance',
      syntax: 'delta_table.optimize().executeZOrderBy("customer_id")',
      shortDescription: 'Colocate related data in the same files for faster queries',
      longDescription: `Z-ordering (multi-dimensional clustering) rearranges data within Parquet files so that rows with similar values in the Z-order columns are stored together. This allows Spark to use data skipping to skip entire files for highly selective queries. Most effective on columns used frequently in WHERE clauses.`,
      examples: [
        {
          label: 'Z-order a Delta table',
          code: `from delta.tables import DeltaTable

dt = DeltaTable.forPath(spark, "s3://bucket/delta/events")

# Compact files AND Z-order by frequently queried column
dt.optimize().executeZOrderBy("customer_id")
# → Files are now clustered by customer_id
# → Query for one customer scans a few files instead of all files`,
        },
        {
          label: 'Liquid Clustering (Delta 3.x)',
          code: `# Liquid Clustering (incremental, no full rewrite)
# CREATE TABLE with CLUSTER BY
spark.sql("""
    CREATE TABLE events
    USING DELTA
    CLUSTER BY (customer_id, event_date)
    AS SELECT * FROM raw_events
""")

# OPTIMIZE picks up new data incrementally
spark.sql("OPTIMIZE events")`,
        },
      ],
      notes: [
        'Z-order with 1-2 columns is most effective — diminishing returns beyond 3',
        'Run OPTIMIZE after large batch loads (daily or weekly)',
        'Use Liquid Clustering (Delta 3.x) for tables with frequent incremental writes',
      ],
      performance: 'Z-order can reduce data scanned from 100% to 1-5% for selective queries on the clustered column — 20-100x speedup.',
      tags: ['zorder', 'optimize', 'delta', 'clustering', 'performance', 'data-skipping'],
      difficulty: 'advanced',
    },

    {
      id: 'kryo-serializer',
      name: 'KryoSerializer',
      category: 'performance',
      syntax: 'spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")',
      shortDescription: 'Use Kryo serialization for faster shuffle and RDD operations',
      longDescription: `Kryo is a fast binary serialization library. Replacing Java's default serializer with Kryo reduces serialized object size by 2-10x and is 10-100x faster for serialization/deserialization. Particularly impactful for jobs with large shuffles or many RDD operations.`,
      examples: [
        {
          label: 'Enable Kryo serialization',
          code: `spark = SparkSession.builder \
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
    .config("spark.kryo.registrationRequired", "false") \
    .getOrCreate()`,
        },
      ],
      performance: 'Reduces shuffle data size by 2-10x. Critical for shuffle-heavy jobs (large joins, groupBy on big data).',
      tags: ['kryo', 'serializer', 'serialization', 'performance', 'shuffle'],
      difficulty: 'advanced',
    },

    {
      id: 'checkpoint',
      name: 'df.checkpoint()',
      category: 'performance',
      syntax: 'spark.sparkContext.setCheckpointDir("path")\ndf.checkpoint()',
      shortDescription: 'Break lineage to prevent stack overflow and speed up iterative jobs',
      longDescription: `checkpoint() materializes a DataFrame to HDFS/S3 and cuts the lineage graph. For iterative algorithms (ML, graph processing) that build enormous lineage chains, Spark eventually throws StackOverflowError. Checkpointing resets the lineage at that point. Also speeds up long pipelines by avoiding full recomputation on failure.`,
      examples: [
        {
          label: 'Checkpoint in iterative pipeline',
          code: `# Set checkpoint directory (must be accessible by all executors)
spark.sparkContext.setCheckpointDir("s3://bucket/spark-checkpoints/")

# In an iterative loop, checkpoint every N iterations
for i in range(100):
    df = process(df)
    
    if i % 10 == 0:
        df = df.checkpoint()  # Materializes and cuts lineage
        df.count()            # Force checkpoint to complete`,
        },
      ],
      notes: [
        'checkpoint() is eager — it writes data immediately when called',
        'Different from persist() — checkpoint breaks the DAG lineage',
        'Use for iterative ML pipelines or any job with 100+ transformations',
      ],
      tags: ['checkpoint', 'lineage', 'iterative', 'performance', 'dag'],
      difficulty: 'advanced',
    },

    {
      id: 'dynamic-partition-overwrite',
      name: 'Dynamic Partition Overwrite',
      category: 'performance',
      syntax: 'spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")',
      shortDescription: 'Overwrite only the partitions present in the DataFrame, not all partitions',
      longDescription: `By default, overwrite mode replaces the ENTIRE table (all partitions). Dynamic partition overwrite changes this to replace ONLY the partitions present in the incoming DataFrame. This is critical for incremental loads — you can process one day's data without touching historical partitions.`,
      examples: [
        {
          label: 'Enable dynamic partition overwrite',
          code: `spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")

# Process only Jan 2024 — only replaces year=2024/month=1/ partition
jan_data = df.filter((col("year") == 2024) & (col("month") == 1))

jan_data.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("s3://bucket/events/")
# Historical data (year=2023, month=12, etc.) is UNTOUCHED`,
        },
      ],
      performance: 'Without dynamic partition overwrite, every incremental load rewrites the entire table. With it, each run only rewrites the affected partitions.',
      tags: ['dynamic-partition', 'overwrite', 'incremental', 'performance', 'write'],
      difficulty: 'advanced',
    },

    {
      id: 'skew-hint',
      name: 'SKEW_JOIN Hint',
      category: 'performance',
      syntax: 'df.hint("SKEW", "skewed_column")',
      shortDescription: 'Hint Spark about skewed columns for automatic skew handling',
      longDescription: `The SKEW join hint (Spark 3.x) tells Spark which column has a skewed distribution. Spark then splits the skewed partition into smaller pieces to balance load. Combined with AQE skewJoin, this gives Spark the best chance of automatically handling skew without manual salting.`,
      examples: [
        {
          label: 'Skew hint',
          code: `# Tell Spark that "customer_id" has skew in the left DataFrame
result = orders.hint("SKEW", "customer_id") \
    .join(customers, "customer_id", "inner")

# For specific skewed values
result = orders.hint("SKEW", "customer_id", "99999") \
    .join(customers, "customer_id")`,
        },
      ],
      tags: ['skew', 'hint', 'performance', 'join', 'spark3'],
      difficulty: 'advanced',
    },

    // ─────────────────────────────────────────────
    // UDFs & PANDAS UDFs
    // ─────────────────────────────────────────────
    {
      id: 'udf',
      name: 'udf() — User Defined Functions',
      category: 'udf',
      syntax: '@udf(returnType=StringType())\ndef my_func(value): ...',
      shortDescription: 'Define custom Python functions and apply them to DataFrame columns',
      longDescription: `UDFs (User Defined Functions) let you apply arbitrary Python logic to DataFrame columns. They are convenient but SLOW — each row is serialized from JVM → Python → JVM, row by row. Only use UDFs when the built-in Spark functions cannot accomplish the task. Prefer Pandas UDFs for better performance.`,
      examples: [
        {
          label: 'Define and register a UDF',
          code: `from pyspark.sql.functions import udf, col
from pyspark.sql.types import StringType

# Method 1: decorator
@udf(returnType=StringType())
def classify_amount(amount):
    if amount is None:
        return "unknown"
    if amount >= 10_000:
        return "whale"
    elif amount >= 1_000:
        return "regular"
    return "small"

df = df.withColumn("tier", classify_amount(col("amount")))

# Method 2: functional
def parse_sku(sku):
    if sku is None:
        return None
    return sku.split("-")[0] if "-" in sku else sku

parse_sku_udf = udf(parse_sku, StringType())
df = df.withColumn("sku_prefix", parse_sku_udf(col("sku")))`,
        },
      ],
      notes: [
        'UDFs are 10-100x slower than equivalent built-in functions',
        'Always prefer Spark native functions when possible',
        'Use Pandas UDF (vectorized) for better performance',
      ],
      performance: 'Each UDF call crosses the JVM-Python boundary per row. For 1 billion rows, this adds minutes of overhead.',
      tags: ['udf', 'custom', 'function', 'python'],
      difficulty: 'intermediate',
    },

    {
      id: 'pandas-udf',
      name: 'pandas_udf() — Vectorized UDF',
      category: 'udf',
      syntax: '@pandas_udf(returnType=DoubleType())\ndef my_func(series: pd.Series) -> pd.Series: ...',
      shortDescription: 'Vectorized UDFs using Apache Arrow — 10-100x faster than regular UDFs',
      longDescription: `Pandas UDFs (formerly Vectorized UDFs) use Apache Arrow to send entire column chunks (as Pandas Series) across the JVM-Python boundary at once, instead of row by row. They are 10-100x faster than regular UDFs and accept vectorized Pandas operations. Always prefer Pandas UDFs over row-level UDFs for large datasets.`,
      examples: [
        {
          label: 'Scalar Pandas UDF',
          code: `import pandas as pd
from pyspark.sql.functions import pandas_udf, col
from pyspark.sql.types import DoubleType, StringType

# Scalar: one input series → one output series (same length)
@pandas_udf(DoubleType())
def normalize_score(s: pd.Series) -> pd.Series:
    """Min-max normalize a column"""
    return (s - s.min()) / (s.max() - s.min())

df = df.withColumn("score_normalized", normalize_score(col("raw_score")))`,
        },
        {
          label: 'Grouped map Pandas UDF',
          code: `from pyspark.sql.functions import PandasUDFType

# Grouped Map: apply Pandas logic to each group
@pandas_udf(df.schema, PandasUDFType.GROUPED_MAP)
def add_group_stats(pdf: pd.DataFrame) -> pd.DataFrame:
    """Add group-level statistics within each partition"""
    pdf["group_mean"]  = pdf["revenue"].mean()
    pdf["group_std"]   = pdf["revenue"].std()
    pdf["z_score"]     = (pdf["revenue"] - pdf["group_mean"]) / pdf["group_std"]
    return pdf

result = df.groupby("region").apply(add_group_stats)`,
        },
      ],
      performance: 'Pandas UDF is 10-100x faster than regular UDF due to Arrow-based batch processing instead of row-by-row serialization.',
      tags: ['pandas_udf', 'vectorized', 'arrow', 'performance', 'custom'],
      difficulty: 'advanced',
    },

    {
      id: 'mapInPandas',
      name: 'df.mapInPandas()',
      category: 'udf',
      syntax: 'df.mapInPandas(func, schema)',
      shortDescription: 'Apply a Pandas function to each partition as a full DataFrame',
      longDescription: `mapInPandas() converts each Spark partition into a Pandas DataFrame, applies your function, and converts back. Unlike Grouped Map, it does not require a groupBy key — it processes partitions as-is. Ideal for ML inference, feature engineering using Pandas/Scikit-learn, or any batch processing that benefits from full DataFrame context.`,
      examples: [
        {
          label: 'ML inference per partition',
          code: `import pandas as pd
import pickle

# Assume model is broadcast to all executors
model_broadcast = spark.sparkContext.broadcast(
    pickle.loads(open("model.pkl", "rb").read())
)

def predict(iterator):
    model = model_broadcast.value
    for pdf in iterator:
        pdf["prediction"] = model.predict(pdf[["feature1", "feature2", "feature3"]])
        yield pdf

from pyspark.sql.types import StructType, StructField, DoubleType
result_schema = df.schema.add(StructField("prediction", DoubleType(), True))

predictions = df.mapInPandas(predict, schema=result_schema)`,
        },
      ],
      tags: ['mapinpandas', 'pandas', 'ml', 'inference', 'batch'],
      difficulty: 'advanced',
    },

    // ─────────────────────────────────────────────
    // STRUCTURED STREAMING
    // ─────────────────────────────────────────────
    {
      id: 'readStream',
      name: 'spark.readStream',
      category: 'streaming',
      syntax: 'spark.readStream.format("kafka").option(...).load()',
      shortDescription: 'Read a continuous stream of data into a streaming DataFrame',
      longDescription: `readStream creates a streaming DataFrame from Kafka, Kinesis, Delta, files, or socket. The API is identical to batch DataFrames — you can use filter(), select(), groupBy(), etc. The query only executes when you call writeStream.start().`,
      examples: [
        {
          label: 'Read from Kafka',
          code: `streaming_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "broker1:9092,broker2:9092") \
    .option("subscribe", "events-topic") \
    .option("startingOffsets", "latest") \
    .option("maxOffsetsPerTrigger", "100000") \
    .load()

# Parse JSON payload
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StructField, StringType, LongType

schema = StructType([
    StructField("user_id",    LongType(),   True),
    StructField("event_type", StringType(), True),
])

events = streaming_df \
    .select(from_json(col("value").cast("string"), schema).alias("data")) \
    .select("data.*")`,
        },
        {
          label: 'Read from Delta (streaming source)',
          code: `stream_df = spark.readStream \
    .format("delta") \
    .option("ignoreChanges", "true") \
    .load("s3://bucket/delta/events")`,
        },
      ],
      tags: ['streaming', 'readstream', 'kafka', 'delta', 'real-time'],
      difficulty: 'advanced',
    },

    {
      id: 'writeStream',
      name: 'df.writeStream',
      category: 'streaming',
      syntax: 'df.writeStream.format("delta").option("checkpointLocation", ...).start()',
      shortDescription: 'Write a streaming DataFrame continuously to a sink',
      longDescription: `writeStream defines where and how to write streaming output. The checkpointLocation is REQUIRED — it stores the streaming state for exactly-once processing and restart recovery. outputMode controls how results are emitted: append (new rows only), update (changed rows), complete (all rows, for aggregations).`,
      examples: [
        {
          label: 'Write streaming output to Delta',
          code: `query = events.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "s3://bucket/checkpoints/events-stream/") \
    .option("mergeSchema", "true") \
    .partitionBy("date") \
    .start("s3://bucket/delta/events_processed/")

# Wait for termination
query.awaitTermination()`,
        },
        {
          label: 'Streaming aggregation with watermark',
          code: `from pyspark.sql.functions import window, col, sum

# Watermark: handle late-arriving data up to 1 hour late
events_with_watermark = events \
    .withWatermark("event_ts", "1 hour")

# 5-minute tumbling window aggregation
agg_stream = events_with_watermark \
    .groupBy(
        window(col("event_ts"), "5 minutes"),
        col("event_type")
    ) \
    .agg(sum("value").alias("total_value"))

query = agg_stream.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "s3://bucket/checkpoints/agg/") \
    .start("s3://bucket/delta/agg_output/")`,
        },
      ],
      notes: [
        'checkpointLocation is mandatory — without it, restart means reprocessing from the start',
        'append mode: new rows only. update mode: changed rows only. complete mode: full table each trigger.',
        'Watermark is required for stateful aggregations (window, deduplication)',
      ],
      tags: ['streaming', 'writestream', 'checkpoint', 'delta', 'real-time'],
      difficulty: 'advanced',
    },

    {
      id: 'foreachBatch',
      name: 'foreachBatch()',
      category: 'streaming',
      syntax: 'df.writeStream.foreachBatch(func).start()',
      shortDescription: 'Apply arbitrary batch logic to each micro-batch in a stream',
      longDescription: `foreachBatch() gives you a regular (batch) DataFrame for each micro-batch, letting you use any DataFrame operation that does not work in streaming mode (like MERGE INTO, multiple sinks, or complex transformations). It is the most flexible streaming output method.`,
      examples: [
        {
          label: 'foreachBatch for upsert pattern',
          code: `from delta.tables import DeltaTable

def upsert_to_delta(batch_df, batch_id):
    target = DeltaTable.forPath(spark, "s3://bucket/delta/orders")
    
    target.alias("target").merge(
        batch_df.alias("source"),
        "target.order_id = source.order_id"
    ).whenMatchedUpdateAll() \
     .whenNotMatchedInsertAll() \
     .execute()

query = stream_df.writeStream \
    .foreachBatch(upsert_to_delta) \
    .option("checkpointLocation", "s3://bucket/checkpoints/orders/") \
    .trigger(processingTime="1 minute") \
    .start()`,
        },
      ],
      tags: ['foreachbatch', 'streaming', 'upsert', 'merge', 'delta'],
      difficulty: 'advanced',
    },

  ], // end functions array
} // end pysparkData
