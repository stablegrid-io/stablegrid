import type { TheoryDoc } from '@/types/theory';
import airflowIntermediateTrackJson from '@/data/learn/theory/published/airflow-intermediate-track.json';

export const airflowIntermediateTrack = {
  ...(airflowIntermediateTrackJson as TheoryDoc),
  id: 'airflow-intermediate-track',
  title: 'Apache Airflow: Intermediate Track',
  description:
    'Master intermediate Airflow patterns: TaskFlow API, custom operators and hooks, dynamic task mapping, Datasets and event-driven scheduling, cross-DAG orchestration, testing strategies, CI/CD deployment, performance tuning, security and RBAC, and a production capstone.'
} satisfies TheoryDoc;
