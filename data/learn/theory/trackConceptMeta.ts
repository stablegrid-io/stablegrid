export interface TrackConceptMeta {
  tagline: string;
  scenario: string;
  targetTechnology: string;
  version: string;
  format: string;
  estimatedDuration: string;
}

const META: Record<string, TrackConceptMeta> = {
  'pyspark/junior': {
    tagline: 'From zero Spark experience to confident PySpark pipelines — one concept at a time.',
    scenario: 'NordGrid Energy — 500K meters, 4 regions, Bronze-Silver-Gold',
    targetTechnology: 'PySpark 3.5+ / Apache Spark 3.5+',
    version: 'authored 2026-03-22, targets PySpark 3.5+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '43.1 hours (2,585 minutes)',
  },
  'pyspark/mid': {
    tagline: 'From working PySpark code to production-grade pipelines — performance, reliability, and engineering discipline.',
    scenario: 'NordGrid Energy — 1.2M meters, 12 regions, Bronze-Silver-Gold',
    targetTechnology: 'PySpark 3.5+ / Apache Spark 3.5+ / Delta Lake 2.4+',
    version: 'authored 2026-03-22, targets PySpark 3.5+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '54.7 hours (3,280 minutes)',
  },
  'pyspark/senior': {
    tagline: 'From production pipelines to platform architecture — designing the systems that other engineers build on.',
    scenario: 'GridUnion Continental — 8TB+, 30 regions, 4 countries, 6 teams, 50+ pipelines',
    targetTechnology: 'PySpark 3.5+ / Apache Spark 3.5+ / Delta Lake 2.4+ / Unity Catalog',
    version: 'authored 2026-03-22, targets PySpark 3.5+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '73.3 hours (4,400 minutes)',
  },
  'fabric/junior': {
    tagline: 'From zero Fabric experience to confident Lakehouse pipelines — one concept at a time.',
    scenario: 'NordGrid Energy — 500K meters, 4 regions, Bronze-Silver-Gold',
    targetTechnology: 'Microsoft Fabric (GA, 2025+)',
    version: 'authored 2026-03-23, targets Microsoft Fabric GA 2025+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '42.2 hours (2,530 minutes)',
  },
  'fabric/mid': {
    tagline: 'From working Fabric pipelines to production-grade platform operations — performance, reliability, and engineering discipline.',
    scenario: 'NordGrid Energy v2 — 1.2M meters, 12 regions, 3 teams, Bronze-Silver-Gold',
    targetTechnology: 'Microsoft Fabric GA 2025+ / PySpark 3.5+ / Delta Lake 2.4+',
    version: 'authored 2026-03-23, targets Microsoft Fabric GA 2025+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '52.2 hours (3,130 minutes)',
  },
  'fabric/senior': {
    tagline: 'From production pipelines to platform architecture — designing the systems that other engineers build on.',
    scenario: 'GridUnion Continental — 5M meters, 30 regions, 4 countries, 12 teams, 80 engineers',
    targetTechnology: 'Microsoft Fabric GA 2025+ / PySpark 3.5+ / Delta Lake 2.4+ / Microsoft Purview',
    version: 'authored 2026-03-23, targets Microsoft Fabric GA 2025+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '73.3 hours (4,400 minutes)',
  },
  'airflow/junior': {
    tagline: 'From zero Airflow experience to confident workflow orchestration — one DAG at a time.',
    scenario: 'SauleGrid — 400K meters, 4 regions, Bronze-Silver-Gold',
    targetTechnology: 'Apache Airflow 2.8+',
    version: 'authored 2026-03-23, targets Apache Airflow 2.8+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '42.7 hours (2,560 minutes)',
  },
  'airflow/mid': {
    tagline: 'From working DAGs to production-grade orchestration — reliability, testing, and operational discipline.',
    scenario: 'SauleGrid — 1.2M meters, 10 regions, 3 teams, Bronze-Silver-Gold',
    targetTechnology: 'Apache Airflow 2.8+ / Python 3.10+',
    version: 'authored 2026-03-24, targets Apache Airflow 2.8+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '53.2 hours (3,190 minutes)',
  },
  'airflow/senior': {
    tagline: 'From production orchestration to platform architecture — designing the systems that make orchestration reliable for everyone.',
    scenario: 'BalticSolar Alliance — 4M meters, 30 regions, 3 countries, 10 teams, 200+ DAGs',
    targetTechnology: 'Apache Airflow 2.8+ / Python 3.10+ / Celery 5+ / Kubernetes 1.28+',
    version: 'authored 2026-03-24, targets Apache Airflow 2.8+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '66.7 hours (4,000 minutes)',
  },
  'sql/junior': {
    tagline: 'From zero SQL experience to confident analytical queries — one clause at a time.',
    scenario: 'HydroAlpes — 350K meters, 4 regions, Bronze-Silver-Gold',
    targetTechnology: 'ANSI SQL / PostgreSQL 16+',
    version: 'authored 2026-03-27, targets ANSI SQL / PostgreSQL 16+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '42.7 hours (2,560 minutes)',
  },
  'sql/mid': {
    tagline: 'From correct queries to production-grade SQL — performance, reliability, and engineering discipline.',
    scenario: 'HydroAlpes — 1.2M meters, 10 regions, 3 teams, Bronze-Silver-Gold',
    targetTechnology: 'ANSI SQL / PostgreSQL 16+ / Spark SQL 3.5+',
    version: 'authored 2026-03-28, targets ANSI SQL / PostgreSQL 16+ / Spark SQL 3.5+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '53.5 hours (3,210 minutes)',
  },
  'sql/senior': {
    tagline: 'From production SQL to platform architecture — designing the multi-engine data platform that other engineers build on.',
    scenario: 'AlpineEnergy Group — 5M meters, 25 regions, 3 countries, 10 teams, 200+ SQL pipelines',
    targetTechnology: 'ANSI SQL / PostgreSQL 16+ / Spark SQL 3.5+ / Delta Lake 2.4+',
    version: 'authored 2026-03-28, targets ANSI SQL / PostgreSQL 16+ / Spark SQL 3.5+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '72.5 hours (4,350 minutes)',
  },
  'python-de/junior': {
    tagline: 'From general-purpose Python to data engineering Python — the patterns, tools, and discipline that production pipelines demand.',
    scenario: 'CelticWind Energy — 400K meters, 2,400 turbines, 4 regions, Bronze-Silver-Gold',
    targetTechnology: 'Python 3.12+ / standard library + pyarrow, requests, pydantic, pytest',
    version: 'authored 2026-03-29, targets Python 3.12+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '41.0 hours (2,460 minutes)',
  },
  'python-de/mid': {
    tagline: 'From working Python pipelines to production-grade systems — performance, concurrency, observability, and engineering discipline at scale.',
    scenario: 'CelticWind Energy — 1.2M meters, 8 sub-regions, 3 teams, Bronze-Silver-Gold',
    targetTechnology: 'Python 3.12+ / pyarrow, requests, pydantic, pytest, polars, structlog, prometheus-client',
    version: 'authored 2026-03-29, targets Python 3.12+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '52.5 hours (3,150 minutes)',
  },
  'python-de/senior': {
    tagline: 'From production pipelines to platform architecture — designing the Python data platform that 10 teams and 200 pipelines build on.',
    scenario: 'Atlantic Energy Alliance — 5M meters, 25 sub-regions, 3 countries, 10 teams, 200+ pipelines',
    targetTechnology: 'Python 3.12+ / Celery, Kafka, Delta Lake, Apache Iceberg, Protobuf, GraphQL, OpenTelemetry',
    version: 'authored 2026-03-29, targets Python 3.12+',
    format: 'Pure theory — no exercises, labs, or checkpoints',
    estimatedDuration: '72.5 hours (4,350 minutes)',
  },
};

export const getTrackConceptMeta = (topic: string, trackSlug: string): TrackConceptMeta | null =>
  META[`${topic}/${trackSlug}`] ?? null;
