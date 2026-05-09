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
  }
};

export const getTrackConceptMeta = (topic: string, trackSlug: string): TrackConceptMeta | null =>
  META[`${topic}/${trackSlug}`] ?? null;
