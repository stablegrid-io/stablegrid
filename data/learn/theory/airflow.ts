import type { TheoryDoc } from '@/types/theory';
import airflowTheoryJson from '@/data/learn/theory/published/airflow.json';

export const airflowTheory = {
  ...(airflowTheoryJson as TheoryDoc),
  title: 'Apache Airflow: Beginner Track',
  description:
    'Beginner-first Airflow curriculum covering DAGs, scheduling, sensors, configuration, monitoring, and a capstone orchestration project.'
} satisfies TheoryDoc;
