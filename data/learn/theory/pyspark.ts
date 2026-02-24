import type { TheoryDoc } from '@/types/theory';

export const pysparkTheory: TheoryDoc = {
  topic: 'pyspark',
  title: 'PySpark Modules',
  description:
    'From big-data foundations to distributed joins, organized as practical modules and lessons.',
  version: 'Module Curriculum v2',
  chapters: [
    {
      id: 'module-01',
      number: 1,
      title: 'Module 1: The Dawn of PySpark',
      description:
        'Why PySpark emerged, how big data broke traditional systems, and what changed with Spark.',
      totalMinutes: 90,
      sections: [
        {
          id: 'module-01-lesson-01',
          title: 'Lesson 1: The Data Avalanche and the Breaking Point',
          estimatedMinutes: 22,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Web 2.0 shifted data from predictable business records to continuous behavioral streams: clicks, searches, telemetry, and logs. Traditional RDBMS systems were excellent for structured data at moderate scale, but they were not designed for internet-scale event volume.'
            },
            {
              type: 'key-concept',
              term: 'Scaling Up vs Scaling Out',
              definition:
                'Vertical scaling upgrades one machine. Horizontal scaling distributes work across many networked machines.',
              analogy:
                'One giant truck versus a coordinated fleet of smaller trucks.'
            },
            {
              type: 'diagram',
              title: 'Scaling Model Shift',
              content: `Vertical Scaling (legacy)

      [ SUPER SERVER ]
        +CPU +RAM +Disk

Horizontal Scaling (distributed)

[Node] [Node] [Node] [Node]
       Connected over network`,
              caption:
                'Big data forced the industry from expensive single-box scaling to distributed cluster execution.'
            },
            {
              type: 'callout',
              variant: 'insight',
              title: 'Operational reality',
              content:
                'Data growth is exponential while hardware gains per machine are incremental. Distribution is mandatory, not optional.'
            }
          ]
        },
        {
          id: 'module-01-lesson-02',
          title: 'Lesson 2: The 3Vs, Veracity, and Value',
          estimatedMinutes: 24,
          blocks: [
            {
              type: 'table',
              headers: ['Dimension', 'What Changed', 'Engineering Impact'],
              rows: [
                ['Volume', 'GB to PB and beyond', 'Requires distributed storage and compute'],
                ['Velocity', 'Batch to continuous streams', 'Needs near real-time processing'],
                ['Variety', 'Structured plus semi/unstructured', 'Schema and parsing flexibility required'],
                ['Veracity', 'Data can be wrong, missing, or malicious', 'Needs distributed validation and cleaning'],
                ['Value', 'Insights must be predictive, not retrospective', 'Needs scalable analytics and ML']
              ]
            },
            {
              type: 'paragraph',
              content:
                'In a smart grid example with 1 million meters reporting every 15 minutes, the system ingests roughly 96 million records per day. The core challenge is not only storing this data, but validating and converting it into operational decisions.'
            },
            {
              type: 'bullet-list',
              items: [
                'Detect impossible values at scale (veracity).',
                'Impute missing time-series readings using window logic.',
                'Build reliable gold-layer datasets for operators.',
                'Train predictive models on multi-year historical data.'
              ]
            }
          ]
        },
        {
          id: 'module-01-lesson-03',
          title: 'Lesson 3: Hadoop Era to Spark Revolution',
          estimatedMinutes: 22,
          blocks: [
            {
              type: 'comparison',
              title: 'MapReduce vs Spark Execution Model',
              left: {
                label: 'Hadoop MapReduce',
                points: [
                  'Writes intermediate steps to disk repeatedly.',
                  'Great for long-running batch workloads.',
                  'High latency for iterative workloads and ML.'
                ]
              },
              right: {
                label: 'Spark',
                points: [
                  'Keeps working datasets in memory when possible.',
                  'Supports SQL, streaming, and ML in one engine.',
                  'Much faster for iterative and exploratory analytics.'
                ]
              }
            },
            {
              type: 'paragraph',
              content:
                'Spark introduced a unified engine and made distributed processing significantly faster for repeated transformations. PySpark then made this model accessible to Python-first data teams.'
            }
          ]
        },
        {
          id: 'module-01-lesson-04',
          title: 'Lesson 4: Why PySpark Matters Today',
          estimatedMinutes: 22,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Modern Spark is commonly used in managed cloud platforms (Databricks, EMR, Dataproc). Teams focus on data logic while infrastructure orchestration is abstracted.'
            },
            {
              type: 'code',
              language: 'python',
              label: 'Minimal PySpark entry point',
              content: `from pyspark.sql import SparkSession

spark = SparkSession.builder.getOrCreate()

df = spark.read.parquet("smart_meter_data")
clean_df = df.filter(df.kW < 10000)`
            },
            {
              type: 'callout',
              variant: 'tip',
              content:
                'Even a simple filter can execute across dozens of worker nodes. Think distributed execution, not local scripting.'
            }
          ]
        }
      ],
      checkpointQuiz: {
        question: 'Why did horizontal scaling become essential for big data systems?',
        options: [
          'Because SQL syntax changed',
          'Because vertical scaling became physically and financially insufficient',
          'Because Python cannot run on large servers',
          'Because cloud providers disallowed single-node databases'
        ],
        correctAnswer:
          'Because vertical scaling became physically and financially insufficient',
        explanation:
          'Data volume and velocity grew faster than single-machine upgrades could handle, forcing distributed compute architectures.'
      }
    },
    {
      id: 'module-02',
      number: 2,
      title: 'Module 2: Up and Running with DataFrames',
      description:
        'Initialize Spark, understand lazy evaluation, and build core DataFrame operations with distributed reasoning.',
      totalMinutes: 120,
      sections: [
        {
          id: 'module-02-lesson-01',
          title: 'Lesson 1: SparkSession and Cluster Roles',
          estimatedMinutes: 30,
          blocks: [
            {
              type: 'paragraph',
              content:
                'SparkSession is your application boundary. It is created on the driver, which plans work. Executors run tasks across partitions.'
            },
            {
              type: 'code',
              language: 'python',
              label: 'SparkSession setup',
              content: `from pyspark.sql import SparkSession

spark = (SparkSession.builder
    .appName("SmartGrid_Analytics_App")
    .getOrCreate())`
            },
            {
              type: 'diagram',
              title: 'Driver / Executor Model',
              content: `Driver (SparkSession)
  |- Builds logical + physical plan
  |- Coordinates job execution

Executors (workers)
  |- Run tasks
  |- Process partitions
  |- Return partial results`,
              caption:
                'The driver plans and orchestrates; executors perform distributed compute.'
            }
          ]
        },
        {
          id: 'module-02-lesson-02',
          title: 'Lesson 2: Creating and Reading DataFrames',
          estimatedMinutes: 30,
          blocks: [
            {
              type: 'paragraph',
              content:
                'You can create DataFrames from local data for prototyping, but production pipelines typically read from distributed storage using optimized formats.'
            },
            {
              type: 'code',
              language: 'python',
              label: 'CSV and Parquet reads',
              content: `df_csv = (spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv("/data/smart_meters.csv"))

df_parquet = spark.read.parquet("/data/smart_meters/")

df_parquet.printSchema()
df_parquet.show(5)`
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Production format default',
              content:
                'Prefer Parquet for columnar reads, compression, and predicate pushdown performance.'
            }
          ]
        },
        {
          id: 'module-02-lesson-03',
          title: 'Lesson 3: Lazy Evaluation and Execution Plans',
          estimatedMinutes: 30,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Transformations are lazy and build a DAG. Actions trigger actual execution on the cluster.'
            },
            {
              type: 'diagram',
              title: 'Lazy DAG Example',
              content: `df.read -> filter -> withColumn -> groupBy
                (no execution yet)

Action:
show()/count()/write()

=> Spark materializes the plan`,
              caption:
                'Nothing runs until an action is invoked.'
            },
            {
              type: 'code',
              language: 'python',
              label: 'Plan introspection',
              content: `projected_df = df.filter(df.customer_type == "Residential") \
    .withColumn("winter_kw", df.daily_kw * 2)

projected_df.explain("formatted")`
            }
          ]
        },
        {
          id: 'module-02-lesson-04',
          title: 'Lesson 4: Partitioning, Caching, and Costly Actions',
          estimatedMinutes: 30,
          blocks: [
            {
              type: 'bullet-list',
              items: [
                'Early filtering lowers downstream shuffle cost.',
                'groupBy and joins are usually wide operations and trigger shuffle.',
                'count() scans the dataset; collect() can overwhelm driver memory.',
                'cache() helps only when the same DataFrame is reused enough times.'
              ]
            },
            {
              type: 'table',
              headers: ['Method', 'Shuffle', 'Typical Use'],
              rows: [
                ['repartition(n)', 'Yes', 'Increase/rebalance partitions before heavy ops'],
                ['coalesce(n)', 'Usually No (when reducing)', 'Consolidate partitions before writes']
              ]
            },
            {
              type: 'code',
              language: 'python',
              label: 'Partition diagnostics',
              content: `df.rdd.getNumPartitions()

df = df.repartition(200)  # increases parallelism, but shuffles
final_df = df.coalesce(20)  # fewer output files`
            }
          ]
        }
      ],
      checkpointQuiz: {
        question: 'Which statement best describes lazy evaluation in Spark?',
        options: [
          'Spark executes each transformation immediately for early feedback',
          'Spark executes only when an action is called',
          'Spark executes only groupBy transformations lazily',
          'Spark executes eagerly when DataFrame is created from CSV'
        ],
        correctAnswer: 'Spark executes only when an action is called',
        explanation:
          'Transformations build a plan; actions materialize it and trigger cluster execution.'
      }
    },
    {
      id: 'module-03',
      number: 3,
      title: 'Module 3: Inside the Engine',
      description:
        'Catalyst, DAG scheduler, shuffle mechanics, and Tungsten internals for distributed engineers.',
      totalMinutes: 110,
      sections: [
        {
          id: 'module-03-lesson-01',
          title: 'Lesson 1: Catalyst Optimizer',
          estimatedMinutes: 28,
          blocks: [
            {
              type: 'diagram',
              title: 'Catalyst Planning Pipeline',
              content: `PySpark Transformations
   -> Unresolved Logical Plan
   -> Resolved Logical Plan
   -> Optimized Logical Plan
   -> Physical Plan`,
              caption:
                'Spark transforms your declarative logic into executable physical operators.'
            },
            {
              type: 'bullet-list',
              items: [
                'Predicate pushdown moves filters earlier.',
                'Projection pruning removes unused columns.',
                'Join strategy selection chooses cost-effective physical execution.'
              ]
            },
            {
              type: 'code',
              language: 'python',
              label: 'Inspect optimized query plan',
              content: 'result.explain("formatted")'
            }
          ]
        },
        {
          id: 'module-03-lesson-02',
          title: 'Lesson 2: DAG Scheduler, Jobs, Stages, Tasks',
          estimatedMinutes: 27,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Actions create jobs, shuffle boundaries create stages, and each partition maps to a task. Parallelism is partition-driven and bounded by available cores.'
            },
            {
              type: 'diagram',
              title: 'Execution Breakdown',
              content: `Action (show/count/write)
  -> Job
    -> Stage 1 (narrow ops)
    -> Stage 2 (after shuffle)
      -> Task per partition`,
              caption:
                'A stage boundary appears whenever data needs to be redistributed.'
            }
          ]
        },
        {
          id: 'module-03-lesson-03',
          title: 'Lesson 3: Shuffle and Data Skew',
          estimatedMinutes: 27,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Shuffle is costly because it combines disk IO, network transfer, serialization, and sorting. Skew amplifies this by overloading a subset of partitions.'
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Skew symptom',
              content:
                'If one task runs much longer than peers, key distribution is likely uneven and causing stragglers.'
            },
            {
              type: 'bullet-list',
              items: [
                'Use salting for hot keys.',
                'Broadcast genuinely small dimensions.',
                'Adjust partitioning where distribution is highly uneven.'
              ]
            }
          ]
        },
        {
          id: 'module-03-lesson-04',
          title: 'Lesson 4: Project Tungsten',
          estimatedMinutes: 28,
          blocks: [
            {
              type: 'bullet-list',
              items: [
                'Compact binary memory layout reduces object overhead.',
                'Cache-aware execution improves CPU efficiency.',
                'Whole-stage code generation compiles optimized execution paths.'
              ]
            },
            {
              type: 'paragraph',
              content:
                'Combined with Catalyst and the scheduler, Tungsten is why Spark can execute complex distributed pipelines efficiently at scale.'
            }
          ]
        }
      ],
      checkpointQuiz: {
        question: 'What usually indicates a shuffle boundary in execution planning?',
        options: [
          'A new SparkSession',
          'An Exchange operator / wide dependency',
          'A call to printSchema()',
          'Reading Parquet instead of CSV'
        ],
        correctAnswer: 'An Exchange operator / wide dependency',
        explanation:
          'Wide dependencies require data movement across partitions; Spark inserts exchange steps and stage boundaries.'
      }
    },
    {
      id: 'module-04',
      number: 4,
      title: 'Module 4: Performance Tuning',
      description:
        'Systematic diagnosis and optimization of slow or unstable distributed PySpark jobs.',
      totalMinutes: 120,
      sections: [
        {
          id: 'module-04-lesson-01',
          title: 'Lesson 1: Diagnose Bottlenecks',
          estimatedMinutes: 30,
          blocks: [
            {
              type: 'bullet-list',
              items: [
                'Excessive shuffle',
                'Data skew',
                'Memory pressure and spill',
                'Driver overload',
                'Poor partitioning strategy'
              ]
            },
            {
              type: 'subheading',
              content: 'Driver OOM vs Executor OOM'
            },
            {
              type: 'comparison',
              left: {
                label: 'Driver OOM',
                points: [
                  'Often caused by collect() on large datasets.',
                  'Single-process memory limit is exceeded.',
                  'Use limit()/sample() or distributed writes instead.'
                ]
              },
              right: {
                label: 'Executor OOM',
                points: [
                  'Usually appears in skewed or large shuffle stages.',
                  'One task processes too much partition data.',
                  'Mitigate by balancing keys and partition sizes.'
                ]
              }
            }
          ]
        },
        {
          id: 'module-04-lesson-02',
          title: 'Lesson 2: Shuffle Anatomy and Skew Dynamics',
          estimatedMinutes: 30,
          blocks: [
            {
              type: 'diagram',
              title: 'Shuffle Cost Path',
              content: `Partition-local compute
  -> repartition by key
  -> write intermediate files
  -> network transfer
  -> merge + sort on destination`,
              caption:
                'Shuffle touches every slow subsystem: disk, network, and sort.'
            },
            {
              type: 'paragraph',
              content:
                'In skewed datasets, one key can dominate a partition, creating stragglers while other tasks finish quickly. Overall stage completion waits for the slowest task.'
            }
          ]
        },
        {
          id: 'module-04-lesson-03',
          title: 'Lesson 3: Read Plans Like an Engineer',
          estimatedMinutes: 30,
          blocks: [
            {
              type: 'code',
              language: 'python',
              label: 'Plan review command',
              content: 'query.explain("formatted")'
            },
            {
              type: 'numbered-list',
              items: [
                'Start from scans at the bottom.',
                'Trace filters/projections in the middle.',
                'Identify exchanges and joins near the top.',
                'Map expensive operators to known bottlenecks.'
              ]
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Red flag operator',
              content:
                'Repeated Exchange nodes often indicate repeated data movement and should trigger optimization review.'
            }
          ]
        },
        {
          id: 'module-04-lesson-04',
          title: 'Lesson 4: Practical Fixes (Broadcast and Salting)',
          estimatedMinutes: 30,
          blocks: [
            {
              type: 'subheading',
              content: 'Broadcast small dimensions'
            },
            {
              type: 'code',
              language: 'python',
              label: 'Broadcast join pattern',
              content: `from pyspark.sql.functions import broadcast

joined = meter_readings.join(broadcast(zip_codes), "zip_code")`
            },
            {
              type: 'paragraph',
              content:
                'Broadcast keeps the large table in place and replicates only the small table to executors, dramatically reducing large-scale shuffle movement.'
            },
            {
              type: 'subheading',
              content: 'Salt hot keys'
            },
            {
              type: 'code',
              language: 'python',
              label: 'Salting pattern for skew mitigation',
              content: `from pyspark.sql.functions import rand, floor, concat, col

salted = (df
    .withColumn("salt", floor(rand() * 10))
    .withColumn("salted_key", concat(col("customer_type"), col("salt"))))`
            }
          ]
        }
      ],
      checkpointQuiz: {
        question: 'Which fix best addresses a 1 TB fact table joined with a 5 MB lookup table?',
        options: [
          'collect() both tables and join on driver',
          'Broadcast the 5 MB table',
          'coalesce(1) before join',
          'Disable Catalyst optimizer'
        ],
        correctAnswer: 'Broadcast the 5 MB table',
        explanation:
          'Broadcasting the small table avoids shuffling the very large dataset and reduces network and disk overhead.'
      }
    },
    {
      id: 'module-05',
      number: 5,
      title: 'Module 5: Advanced Joins and Distributed Relationships',
      description:
        'Join strategy, cost tradeoffs, and robust data-quality joins at scale.',
      totalMinutes: 100,
      sections: [
        {
          id: 'module-05-lesson-01',
          title: 'Lesson 1: Shuffle Hash Join and Sort-Merge Join',
          estimatedMinutes: 25,
          blocks: [
            {
              type: 'diagram',
              title: 'Shuffle Join Visualization',
              content: `Before
Exec A: [A1 A2 A3]
Exec B: [B1 B2 B3]
Exec C: [C1 C2 C3]

After repartition by join key
Exec A: [A1 B2 C3]
Exec B: [A2 B1 C1]
Exec C: [A3 B3 C2]`,
              caption:
                'Both sides move so matching keys land together before local join execution.'
            },
            {
              type: 'paragraph',
              content:
                'For large-to-large joins, Spark often selects shuffle-based strategies. The real cost is bytes moved plus sort and merge overhead.'
            }
          ]
        },
        {
          id: 'module-05-lesson-02',
          title: 'Lesson 2: Broadcast Join Strategy',
          estimatedMinutes: 25,
          blocks: [
            {
              type: 'diagram',
              title: 'Broadcast Join Visualization',
              content: `Small table (dimension)
      |
Broadcast to each executor
      |
[Exec A] [Exec B] [Exec C]
Each executor joins locally with its large-table partition`,
              caption:
                'Broadcast joins move only the small table and keep the large table partition-local.'
            },
            {
              type: 'bullet-list',
              items: [
                'Best for lookup/dimension/reference tables.',
                'Think in bytes, not row counts only.',
                'Validate executor memory capacity before forcing broadcast.'
              ]
            }
          ]
        },
        {
          id: 'module-05-lesson-03',
          title: 'Lesson 3: Self-Join vs Window Functions',
          estimatedMinutes: 25,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Many self-join patterns introduce avoidable shuffle. Window functions often compute equivalent context within partition boundaries more efficiently.'
            },
            {
              type: 'code',
              language: 'python',
              label: 'Window replacement for previous-reading lookup',
              content: `from pyspark.sql.window import Window
from pyspark.sql.functions import lag

window_spec = Window.partitionBy("meter_id").orderBy("timestamp")

spikes_df = readings_df.withColumn(
    "prev_kw",
    lag("daily_kw").over(window_spec)
)`
            }
          ]
        },
        {
          id: 'module-05-lesson-04',
          title: 'Lesson 4: Anti-Joins for Orphan Detection',
          estimatedMinutes: 25,
          blocks: [
            {
              type: 'paragraph',
              content:
                'left_anti joins isolate records in the left table with no right-side match. They are practical for metadata integrity and foreign-key style checks in data lakes.'
            },
            {
              type: 'code',
              language: 'python',
              label: 'Orphan meter detection',
              content:
                'rogue_meters = readings_df.join(metadata_df, "meter_id", "left_anti")'
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Join performance checklist',
              content:
                'Filter early, project narrow schemas, broadcast where appropriate, monitor skew, and inspect Exchange operators in execution plans.'
            }
          ]
        }
      ],
      checkpointQuiz: {
        question: 'When should you prefer a window function over a self-join?',
        options: [
          'When you need row context within partitions and want to avoid extra shuffle',
          'When both tables are tiny and broadcastable',
          'Only when using CSV inputs',
          'Never; self-joins are always faster'
        ],
        correctAnswer:
          'When you need row context within partitions and want to avoid extra shuffle',
        explanation:
          'Window functions compute ordered context locally per partition and often avoid the global reshuffle that self-joins require.'
      }
    }
  ]
};
