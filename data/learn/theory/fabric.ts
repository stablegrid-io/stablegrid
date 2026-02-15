import type { TheoryDoc } from '@/types/theory';

export const fabricTheory: TheoryDoc = {
  topic: 'fabric',
  title: 'Microsoft Fabric Theory Guide',
  description: 'Architecture, Lakehouse patterns, and operating principles for Fabric workloads.',
  version: 'Microsoft Fabric',
  chapters: [
    {
      id: 'what-is-fabric',
      number: 1,
      title: 'What is Microsoft Fabric?',
      description: 'How Fabric unifies analytics workloads into one SaaS platform.',
      totalMinutes: 10,
      sections: [
        {
          id: 'fabric-positioning',
          title: 'Platform Positioning',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Microsoft Fabric combines Data Engineering, Data Factory, Data Warehouse, Real-Time Analytics, and Power BI into a single product surface. Instead of stitching separate services, teams work from shared workspaces and governance controls.'
            }
          ]
        },
        {
          id: 'onelake-concept',
          title: 'OneLake as Storage Foundation',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'callout',
              variant: 'insight',
              content:
                'OneLake is the storage layer behind Fabric items. Lakehouse tables, files, and semantic model artifacts are addressable from one logical data lake.'
            }
          ]
        }
      ]
    },
    {
      id: 'fabric-architecture',
      number: 2,
      title: 'Fabric Architecture Fundamentals',
      description: 'Workspaces, items, and execution engines.',
      totalMinutes: 14,
      sections: [
        {
          id: 'workspace-item-model',
          title: 'Workspace and Item Model',
          estimatedMinutes: 7,
          blocks: [
            {
              type: 'paragraph',
              content:
                'A workspace is the security and lifecycle boundary. Inside it, you compose items such as Lakehouse, Warehouse, Notebook, Pipeline, Semantic Model, and Report. This gives clear ownership and promotion paths across dev/test/prod.'
            }
          ]
        },
        {
          id: 'compute-engines',
          title: 'Engine Choices',
          estimatedMinutes: 7,
          blocks: [
            {
              type: 'table',
              headers: ['Workload', 'Primary Engine'],
              rows: [
                ['Notebook transformations', 'Spark'],
                ['Warehouse SQL', 'T-SQL engine'],
                ['Real-time exploration', 'KQL'],
                ['BI serving', 'Power BI semantic model']
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'lakehouse-data-modeling',
      number: 3,
      title: 'Lakehouse and Medallion Data Modeling',
      description: 'Bronze, Silver, Gold conventions and table design decisions.',
      totalMinutes: 12,
      sections: [
        {
          id: 'medallion-layers',
          title: 'Bronze / Silver / Gold Layers',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'bullet-list',
              items: [
                'Bronze keeps raw ingested records with minimal transformation.',
                'Silver standardizes schema, quality checks, and business keys.',
                'Gold serves curated tables optimized for BI and ML consumption.'
              ]
            }
          ]
        },
        {
          id: 'delta-design',
          title: 'Delta Table Design',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'callout',
              variant: 'tip',
              content:
                'Use partitioning only on high-selectivity query dimensions (for example date), and avoid over-partitioning that creates many small files.'
            }
          ]
        }
      ]
    },
    {
      id: 'fabric-optimization',
      number: 4,
      title: 'Performance and Optimization',
      description: 'How to keep Spark, SQL, and pipeline workloads efficient.',
      totalMinutes: 13,
      sections: [
        {
          id: 'pipeline-optimization',
          title: 'Pipeline Throughput',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Pipeline bottlenecks usually come from serial dependencies and non-incremental loads. Parallelize independent branches and enforce watermark-based ingestion.'
            }
          ]
        },
        {
          id: 'query-optimization',
          title: 'Query and Table Optimization',
          estimatedMinutes: 7,
          blocks: [
            {
              type: 'numbered-list',
              items: [
                'Prune unused columns before joins.',
                'Apply filters as early as possible.',
                'Use MERGE for idempotent upserts.',
                'Monitor small-file growth and compact regularly.'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'fabric-production',
      number: 5,
      title: 'Production Operations and Governance',
      description: 'Release, monitoring, and access-control practices.',
      totalMinutes: 11,
      sections: [
        {
          id: 'deployment-patterns',
          title: 'Deployment and Promotion',
          estimatedMinutes: 5,
          blocks: [
            {
              type: 'paragraph',
              content:
                'Use separate workspaces for dev, test, and production. Promote pipelines and semantic artifacts through controlled release paths to avoid ad-hoc production edits.'
            }
          ]
        },
        {
          id: 'observability-governance',
          title: 'Observability and Ownership',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'callout',
              variant: 'warning',
              content:
                'If ownership and SLA are unclear, failures linger. Assign explicit owners for each Lakehouse/Warehouse pipeline and enforce alert routing by domain.'
            }
          ]
        }
      ]
    }
  ]
};
