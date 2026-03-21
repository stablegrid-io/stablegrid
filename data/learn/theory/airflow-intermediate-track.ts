import type { TheoryDoc } from '@/types/theory';
import airflowIntermediateTrackJson from '@/data/learn/theory/published/airflow-intermediate-track.json';

export const airflowIntermediateTrack = {
  ...(airflowIntermediateTrackJson as TheoryDoc),
  id: 'airflow-intermediate-track',
  title: 'Apache Airflow: Intermediate Track - TaskFlow API',
  description:
    'Master the TaskFlow API as the modern interface for writing Airflow DAGs - replacing verbose operator boilerplate with decorated Python functions, automatic XCom, and inferred dependencies.'
} satisfies TheoryDoc;
