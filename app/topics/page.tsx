import type { Metadata } from 'next';
import { TopicsPage } from '@/components/topics/TopicsPage';

export const metadata: Metadata = {
  title: 'All topics — stablegrid',
  description:
    '20+ data engineering tracks structured into Junior, Mid, and Senior tiers. Explore PySpark, Microsoft Fabric, Apache Airflow, SQL, Python, Kafka, Docker, dbt, and more.',
};

export default function Page() {
  return <TopicsPage />;
}
