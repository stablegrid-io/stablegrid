import type { CheatSheet } from '@/types/learn';

export const fabricData: CheatSheet = {
  topic: 'fabric',
  title: 'Microsoft Fabric Reference',
  description: 'Core patterns for Lakehouse, Warehouse, Pipelines, and Real-Time analytics.',
  version: 'Microsoft Fabric',
  categories: [
    {
      id: 'workspace',
      label: 'Workspace',
      description: 'Environment setup and access patterns.',
      count: 1
    },
    {
      id: 'lakehouse',
      label: 'Lakehouse',
      description: 'Delta tables and file operations.',
      count: 1
    },
    {
      id: 'notebooks',
      label: 'Notebooks',
      description: 'Spark notebook utilities and orchestration.',
      count: 1
    },
    {
      id: 'pipelines',
      label: 'Pipelines',
      description: 'Data movement and orchestration workflows.',
      count: 1
    },
    {
      id: 'warehouse',
      label: 'Warehouse SQL',
      description: 'SQL transformations and upsert patterns.',
      count: 1
    },
    {
      id: 'realtime',
      label: 'Real-Time Analytics',
      description: 'KQL-based aggregation patterns.',
      count: 1
    }
  ],
  functions: [
    {
      id: 'fabric-workspace-roles',
      name: 'Workspace Roles',
      category: 'workspace',
      syntax: 'Admin | Member | Contributor | Viewer',
      shortDescription: 'Control who can build, edit, or consume Fabric items.',
      longDescription:
        'Workspace roles define permissions across Lakehouse, Warehouse, Reports, and Pipelines. Treat role assignment as infrastructure and keep least-privilege defaults.',
      returns: 'Permission scope over workspace assets',
      examples: [
        {
          label: 'Typical production split',
          code: 'Admins: platform team\nContributors: data engineers\nViewers: business users'
        }
      ],
      notes: ['Keep production workspaces locked to Contributor/Viewer for most users.'],
      tags: ['workspace', 'roles', 'permissions', 'governance'],
      difficulty: 'beginner'
    },
    {
      id: 'fabric-lakehouse-read-delta',
      name: 'spark.read.format("delta").load()',
      category: 'lakehouse',
      syntax: 'spark.read.format("delta").load("Tables/sales_orders")',
      shortDescription: 'Read a Delta table from Fabric Lakehouse with Spark.',
      longDescription:
        'Lakehouse tables are stored in Delta format and can be read directly from notebooks. This is the standard entry point for transformation jobs.',
      returns: 'Spark DataFrame',
      examples: [
        {
          label: 'Read and inspect',
          code: 'df = spark.read.format("delta").load("Tables/sales_orders")\ndf.printSchema()\ndf.show(10)'
        }
      ],
      relatedFunctions: ['fabric-merge-into'],
      tags: ['fabric', 'lakehouse', 'delta', 'spark'],
      difficulty: 'beginner'
    },
    {
      id: 'fabric-mssparkutils-fs-ls',
      name: 'mssparkutils.fs.ls()',
      category: 'notebooks',
      syntax: 'mssparkutils.fs.ls("Files/raw/")',
      shortDescription: 'List files from OneLake paths in Fabric notebooks.',
      longDescription:
        'Notebook utilities help inspect and automate file operations in OneLake. Use this for debugging ingestion paths and lightweight orchestration logic.',
      returns: 'List of file metadata objects',
      examples: [
        {
          label: 'List raw landing files',
          code: 'files = mssparkutils.fs.ls("Files/raw/")\nfor f in files:\n    print(f.name, f.size)'
        }
      ],
      relatedFunctions: ['fabric-pipeline-copy-activity'],
      notes: ['Use small helper checks, not heavy business logic, inside utility loops.'],
      tags: ['mssparkutils', 'onelake', 'files', 'notebook'],
      difficulty: 'intermediate'
    },
    {
      id: 'fabric-pipeline-copy-activity',
      name: 'Copy Activity',
      category: 'pipelines',
      syntax: 'Source -> Mapping -> Sink (Data Pipeline)',
      shortDescription: 'Move data between sources and Fabric destinations.',
      longDescription:
        'Copy Activity is the default ingestion pattern for bringing operational data into Lakehouse or Warehouse layers. Configure schema mapping and incremental boundaries.',
      returns: 'Pipeline run with copied rows and execution metrics',
      examples: [
        {
          label: 'Incremental copy pattern',
          code: 'Source query: WHERE updated_at > @last_watermark\nSink: Lakehouse bronze table\nPost-copy: update watermark variable'
        }
      ],
      relatedFunctions: ['fabric-lakehouse-read-delta'],
      performance:
        'Partition large loads and enable parallel copy to reduce end-to-end pipeline duration.',
      tags: ['pipeline', 'ingestion', 'copy activity', 'etl'],
      difficulty: 'intermediate'
    },
    {
      id: 'fabric-merge-into',
      name: 'MERGE INTO',
      category: 'warehouse',
      syntax:
        'MERGE INTO target t USING source s ON t.key = s.key WHEN MATCHED THEN UPDATE ... WHEN NOT MATCHED THEN INSERT ...',
      shortDescription: 'Perform idempotent upserts in Warehouse or Lakehouse SQL.',
      longDescription:
        'MERGE handles slowly changing records and late-arriving updates in one statement. It is a core building block for reliable medallion pipelines.',
      returns: 'Updated target table state',
      examples: [
        {
          label: 'Upsert customer dimension',
          code: 'MERGE INTO dim_customer t\nUSING stg_customer s\nON t.customer_id = s.customer_id\nWHEN MATCHED THEN UPDATE SET t.email = s.email\nWHEN NOT MATCHED THEN INSERT (customer_id, email) VALUES (s.customer_id, s.email);'
        }
      ],
      relatedFunctions: ['fabric-pipeline-copy-activity'],
      notes: ['Always join on stable business keys, not volatile attributes.'],
      tags: ['merge', 'upsert', 'warehouse', 'sql'],
      difficulty: 'advanced'
    },
    {
      id: 'fabric-kql-summarize',
      name: 'KQL summarize',
      category: 'realtime',
      syntax: 'Events | summarize total=count() by bin(Timestamp, 5m), EventType',
      shortDescription: 'Aggregate streaming/event data in Real-Time Analytics.',
      longDescription:
        'KQL summarize produces fast grouped metrics over event streams or telemetry datasets. Combine with time binning for operational dashboards.',
      returns: 'Aggregated event table',
      examples: [
        {
          label: '5-minute error counts',
          code: 'AppEvents\n| where Level == "Error"\n| summarize errors=count() by bin(Timestamp, 5m), Service'
        }
      ],
      relatedFunctions: ['fabric-pipeline-copy-activity'],
      tags: ['kql', 'realtime', 'summarize', 'monitoring'],
      difficulty: 'intermediate'
    }
  ]
};
