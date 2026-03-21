import type { TheoryDoc } from '@/types/theory';
import airflowTheoryJson from '@/data/learn/theory/published/airflow.json';

export const airflowTheory = {
  ...(airflowTheoryJson as TheoryDoc),
  title: 'Apache Airflow Modules',
  description:
    'Build Apache Airflow capability across orchestration foundations, DAG authoring, scheduling, monitoring, and production debugging.'
} satisfies TheoryDoc;
