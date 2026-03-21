import type { TheoryDoc } from '@/types/theory';
import airflowSeniorTrackJson from '@/data/learn/theory/published/airflow-senior-track.json';

export const airflowSeniorTrack = {
  ...(airflowSeniorTrackJson as TheoryDoc),
  id: 'airflow-senior-track',
  title: 'Apache Airflow: Senior Track',
  description:
    'Enterprise-scale Airflow patterns: DAG factories, KubernetesExecutor, custom XCom backends, provider development, REST API mastery, scheduler internals, version upgrades, multi-environment architecture, enterprise governance, and a platform architecture capstone.'
} satisfies TheoryDoc;
