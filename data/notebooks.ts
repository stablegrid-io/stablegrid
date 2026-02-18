export type NotebookDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type NotebookIssueSeverity = 'performance' | 'practice' | 'redundant';

export interface NotebookIssue {
  id: string;
  severity: NotebookIssueSeverity;
  title: string;
  explanation: string;
}

export interface NotebookLine {
  id: string;
  text: string;
  flaggable?: boolean;
  issueId?: string;
}

export interface NotebookCell {
  id: string;
  type: 'markdown' | 'code';
  content?: string;
  lines?: NotebookLine[];
  issues?: NotebookIssue[];
}

export interface NotebookDefinition {
  id: string;
  title: string;
  difficulty: NotebookDifficulty;
  context: string;
  estimatedMinutes: number;
  totalIssues: number;
  tags: string[];
  cells: NotebookCell[];
}

export const NOTEBOOKS: NotebookDefinition[] = [
  {
    id: 'nb-001',
    title: 'Outage Incident Root Cause Analysis',
    difficulty: 'Intermediate',
    context:
      'This Fabric notebook analyzes outage logs for the last 90 days and joins substation + weather data for operations reporting.',
    estimatedMinutes: 8,
    totalIssues: 7,
    tags: ['PySpark', 'Performance', 'Best Practices'],
    cells: [
      {
        id: 'n1-c1',
        type: 'markdown',
        content:
          '# Outage Root Cause Analysis\nAnalyze outage events, enrich with weather/substation metadata, and write a root-cause summary table.'
      },
      {
        id: 'n1-c2',
        type: 'code',
        lines: [
          { id: 'n1-c2-l1', text: 'from pyspark.sql import SparkSession' },
          {
            id: 'n1-c2-l2',
            text: 'from pyspark.sql.functions import *',
            flaggable: true,
            issueId: 'n1-i1'
          },
          {
            id: 'n1-c2-l3',
            text: 'from pyspark.sql.types import *',
            flaggable: true,
            issueId: 'n1-i1'
          },
          {
            id: 'n1-c2-l4',
            text: 'spark = SparkSession.builder.getOrCreate()',
            flaggable: true,
            issueId: 'n1-i2'
          }
        ],
        issues: [
          {
            id: 'n1-i1',
            severity: 'practice',
            title: 'Wildcard Imports',
            explanation:
              'Avoid `import *` in notebooks. It pollutes namespace and hides dependencies. Import only the functions you use.'
          },
          {
            id: 'n1-i2',
            severity: 'redundant',
            title: 'Redundant SparkSession Initialization',
            explanation:
              'Fabric notebooks already provide a managed `spark` session. Creating another one is unnecessary and can conflict with runtime config.'
          }
        ]
      },
      {
        id: 'n1-c3',
        type: 'code',
        lines: [
          { id: 'n1-c3-l1', text: 'outages = spark.read.format("delta").load("Tables/outage_events")' },
          {
            id: 'n1-c3-l2',
            text: 'display(outages)',
            flaggable: true,
            issueId: 'n1-i3'
          },
          { id: 'n1-c3-l3', text: 'substations = spark.read.format("delta").load("Tables/substations")' },
          {
            id: 'n1-c3-l4',
            text: 'display(substations)',
            flaggable: true,
            issueId: 'n1-i3'
          },
          { id: 'n1-c3-l5', text: 'weather = spark.read.format("delta").load("Tables/weather_hourly")' },
          {
            id: 'n1-c3-l6',
            text: 'display(weather)',
            flaggable: true,
            issueId: 'n1-i3'
          }
        ],
        issues: [
          {
            id: 'n1-i3',
            severity: 'performance',
            title: 'Heavy `display()` Calls on Production Datasets',
            explanation:
              'Multiple full `display()` calls can trigger expensive scans. Keep only lightweight checks (`printSchema`, `limit(5)`) in production pipelines.'
          }
        ]
      },
      {
        id: 'n1-c4',
        type: 'code',
        lines: [
          {
            id: 'n1-c4-l1',
            text: 'outages_pd = outages.toPandas()',
            flaggable: true,
            issueId: 'n1-i4'
          },
          {
            id: 'n1-c4-l2',
            text: 'recent = outages_pd[outages_pd["severity"] != "INFO"]',
            flaggable: true,
            issueId: 'n1-i4'
          },
          {
            id: 'n1-c4-l3',
            text: 'recent_outages = spark.createDataFrame(recent)',
            flaggable: true,
            issueId: 'n1-i4'
          }
        ],
        issues: [
          {
            id: 'n1-i4',
            severity: 'performance',
            title: 'Driver-Side Pandas Conversion',
            explanation:
              'Converting large Spark DataFrames with `.toPandas()` breaks distributed execution and can OOM the driver. Keep filtering in Spark with `col` expressions.'
          }
        ]
      },
      {
        id: 'n1-c5',
        type: 'code',
        lines: [
          { id: 'n1-c5-l1', text: 'enriched = recent_outages.join(substations, "substation_id")' },
          {
            id: 'n1-c5-l2',
            text: 'print(enriched.count())',
            flaggable: true,
            issueId: 'n1-i5'
          },
          {
            id: 'n1-c5-l3',
            text: 'print(enriched.select("substation_id").distinct().count())',
            flaggable: true,
            issueId: 'n1-i5'
          },
          {
            id: 'n1-c5-l4',
            text: 'root_cause.write.format("delta").mode("overwrite").save("Tables/outage_root_cause_summary")',
            flaggable: true,
            issueId: 'n1-i6'
          }
        ],
        issues: [
          {
            id: 'n1-i5',
            severity: 'performance',
            title: 'Repeated Actions Without Caching',
            explanation:
              'Multiple `.count()` actions on an uncached DataFrame re-run the full pipeline each time. Cache before repeated actions or aggregate once.'
          },
          {
            id: 'n1-i6',
            severity: 'practice',
            title: 'No Write Partition Strategy',
            explanation:
              'Summary writes should control file output (`coalesce` / `partitionBy`) to avoid small-file sprawl and unstable downstream performance.'
          }
        ]
      }
    ]
  },
  {
    id: 'nb-002',
    title: 'Solar Farm Generation Forecast ETL',
    difficulty: 'Beginner',
    context:
      'This notebook prepares sensor telemetry for day-ahead solar generation forecasting in Microsoft Fabric.',
    estimatedMinutes: 6,
    totalIssues: 5,
    tags: ['PySpark', 'Data Quality', 'IoT'],
    cells: [
      {
        id: 'n2-c1',
        type: 'markdown',
        content:
          '# Solar Forecast Data Prep\nClean raw irradiance telemetry and produce a training-ready feature dataset.'
      },
      {
        id: 'n2-c2',
        type: 'code',
        lines: [
          { id: 'n2-c2-l1', text: 'sensors = spark.read.format("delta").load("Tables/solar_sensor_raw")' },
          {
            id: 'n2-c2-l2',
            text: 'display(sensors)',
            flaggable: true,
            issueId: 'n2-i1'
          },
          {
            id: 'n2-c2-l3',
            text: 'sensors.count()',
            flaggable: true,
            issueId: 'n2-i2'
          }
        ],
        issues: [
          {
            id: 'n2-i1',
            severity: 'performance',
            title: 'Expensive Preview on Raw Telemetry',
            explanation:
              '`display()` on raw telemetry can scan huge tables. Use narrow previews and avoid display in scheduled jobs.'
          },
          {
            id: 'n2-i2',
            severity: 'redundant',
            title: 'Unused Standalone Count',
            explanation:
              'This `.count()` triggers a full scan but the result is not used. Remove it or persist it in a metric variable.'
          }
        ]
      },
      {
        id: 'n2-c3',
        type: 'code',
        lines: [
          {
            id: 'n2-c3-l1',
            text: 'clean = sensors.filter(col("irradiance_wm2").isNotNull())',
            flaggable: true,
            issueId: 'n2-i3'
          },
          {
            id: 'n2-c3-l2',
            text: 'clean = clean.filter(col("irradiance_wm2") >= 0)',
            flaggable: true,
            issueId: 'n2-i3'
          },
          {
            id: 'n2-c3-l3',
            text: 'clean = clean.filter(col("irradiance_wm2") <= 1500)',
            flaggable: true,
            issueId: 'n2-i3'
          }
        ],
        issues: [
          {
            id: 'n2-i3',
            severity: 'practice',
            title: 'Chained One-Condition Filters',
            explanation:
              'This pattern is harder to maintain. Combine predicates into one filter block for readability and easier review.'
          }
        ]
      },
      {
        id: 'n2-c4',
        type: 'code',
        lines: [
          {
            id: 'n2-c4-l1',
            text: 'farm_ids = clean.select("farm_id").distinct().collect()',
            flaggable: true,
            issueId: 'n2-i4'
          },
          {
            id: 'n2-c4-l2',
            text: 'for row in farm_ids:',
            flaggable: true,
            issueId: 'n2-i4'
          },
          {
            id: 'n2-c4-l3',
            text: '    clean.filter(col("farm_id") == row.farm_id).write.format("delta").mode("append").save(f"Tables/solar_features_{row.farm_id}")',
            flaggable: true,
            issueId: 'n2-i4'
          }
        ],
        issues: [
          {
            id: 'n2-i4',
            severity: 'performance',
            title: 'Driver Loop Over Distinct IDs',
            explanation:
              'Collecting IDs and writing in a Python loop triggers N Spark jobs. Use a single distributed write with `partitionBy("farm_id")`.'
          }
        ]
      },
      {
        id: 'n2-c5',
        type: 'code',
        lines: [
          {
            id: 'n2-c5-l1',
            text: 'spark.read.format("delta").load("Tables/solar_features_FARM001").count()',
            flaggable: true,
            issueId: 'n2-i5'
          },
          {
            id: 'n2-c5-l2',
            text: 'spark.read.format("delta").load("Tables/solar_features_FARM002").count()',
            flaggable: true,
            issueId: 'n2-i5'
          }
        ],
        issues: [
          {
            id: 'n2-i5',
            severity: 'redundant',
            title: 'Hardcoded Verification Reads',
            explanation:
              'Per-table verification does not scale. Validate all partitions in one grouped query to reduce extra scans and maintenance.'
          }
        ]
      }
    ]
  },
  {
    id: 'nb-003',
    title: 'Wind Turbine Anomaly Detection Pipeline',
    difficulty: 'Advanced',
    context:
      'This notebook flags turbines with abnormal vibration and power output behavior ahead of maintenance planning.',
    estimatedMinutes: 12,
    totalIssues: 8,
    tags: ['PySpark', 'Streaming', 'ML Prep'],
    cells: [
      {
        id: 'n3-c1',
        type: 'markdown',
        content:
          '# Wind Turbine Anomaly Detection\nBuild a scoring pipeline over SCADA telemetry and enrich with maintenance logs.'
      },
      {
        id: 'n3-c2',
        type: 'code',
        lines: [
          {
            id: 'n3-c2-l1',
            text: 'from pyspark.sql.functions import *',
            flaggable: true,
            issueId: 'n3-i1'
          },
          { id: 'n3-c2-l2', text: 'from pyspark.sql.window import Window' },
          {
            id: 'n3-c2-l3',
            text: 'spark = SparkSession.builder.config("spark.sql.shuffle.partitions","2").getOrCreate()',
            flaggable: true,
            issueId: 'n3-i2'
          }
        ],
        issues: [
          {
            id: 'n3-i1',
            severity: 'practice',
            title: 'Wildcard Imports',
            explanation:
              'Explicit imports make notebook dependencies clear and reduce accidental name collisions.'
          },
          {
            id: 'n3-i2',
            severity: 'performance',
            title: 'Unsafe Shuffle Partition Override',
            explanation:
              'Forcing shuffle partitions to 2 can create extreme skew and long task tails on telemetry-scale datasets.'
          }
        ]
      },
      {
        id: 'n3-c3',
        type: 'code',
        lines: [
          { id: 'n3-c3-l1', text: 'telemetry = spark.read.format("delta").load("Tables/turbine_scada_raw")' },
          {
            id: 'n3-c3-l2',
            text: 'display(telemetry)',
            flaggable: true,
            issueId: 'n3-i3'
          },
          { id: 'n3-c3-l3', text: 'stats = telemetry.groupBy("turbine_id").agg(avg("vibration").alias("mean_vib"))' },
          {
            id: 'n3-c3-l4',
            text: 'scored = telemetry.join(stats, "turbine_id")',
            flaggable: true,
            issueId: 'n3-i4'
          }
        ],
        issues: [
          {
            id: 'n3-i3',
            severity: 'performance',
            title: 'Unbounded Display on Long-Horizon Telemetry',
            explanation:
              'Avoid expensive visual materialization on massive input tables during production runs.'
          },
          {
            id: 'n3-i4',
            severity: 'performance',
            title: 'Join-Back Pattern Instead of Window Stats',
            explanation:
              'Computing aggregate stats then joining back adds another shuffle. Use window functions to compute statistics inline.'
          }
        ]
      },
      {
        id: 'n3-c4',
        type: 'code',
        lines: [
          {
            id: 'n3-c4-l1',
            text: 'anomalies = scored.filter("z_vibration > 3 OR z_vibration < -3 OR z_power > 3 OR z_power < -3")',
            flaggable: true,
            issueId: 'n3-i5'
          },
          {
            id: 'n3-c4-l2',
            text: 'print(anomalies.count())',
            flaggable: true,
            issueId: 'n3-i6'
          },
          {
            id: 'n3-c4-l3',
            text: 'print(anomalies.select("turbine_id").distinct().count())',
            flaggable: true,
            issueId: 'n3-i6'
          }
        ],
        issues: [
          {
            id: 'n3-i5',
            severity: 'practice',
            title: 'Raw SQL String Filter for Core Logic',
            explanation:
              'Use typed column expressions for maintainability and safer refactors across notebook revisions.'
          },
          {
            id: 'n3-i6',
            severity: 'performance',
            title: 'Repeated Actions on Uncached DataFrame',
            explanation:
              'Each action retriggers the full DAG. Cache or compute all required metrics in one aggregation.'
          }
        ]
      },
      {
        id: 'n3-c5',
        type: 'code',
        lines: [
          {
            id: 'n3-c5-l1',
            text: 'alerts = anomalies.toPandas()',
            flaggable: true,
            issueId: 'n3-i7'
          },
          {
            id: 'n3-c5-l2',
            text: 'for row in alerts.itertuples(): publish_alert(row)',
            flaggable: true,
            issueId: 'n3-i7'
          },
          {
            id: 'n3-c5-l3',
            text: 'alerts_delta.write.format("delta").mode("overwrite").save("Tables/turbine_alerts")',
            flaggable: true,
            issueId: 'n3-i8'
          }
        ],
        issues: [
          {
            id: 'n3-i7',
            severity: 'performance',
            title: 'Driver-Side Alert Dispatch Loop',
            explanation:
              'Moving anomaly rows to Pandas and looping on the driver breaks scalability and introduces reliability risk.'
          },
          {
            id: 'n3-i8',
            severity: 'practice',
            title: 'Write Without Layout Strategy',
            explanation:
              'Alert output should define partitioning and file sizing strategy to keep downstream consumers stable.'
          }
        ]
      }
    ]
  }
];

export const NOTEBOOKS_BY_ID = NOTEBOOKS.reduce<
  Record<string, NotebookDefinition>
>((accumulator, notebook) => {
  accumulator[notebook.id] = notebook;
  return accumulator;
}, {});
