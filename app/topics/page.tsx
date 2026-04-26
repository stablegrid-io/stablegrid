import type { Metadata } from 'next';
import { TopicsPage } from '@/components/topics/TopicsPage';

export const metadata: Metadata = {
  title: 'All Tracks: PySpark, Airflow, Fabric, SQL, Python',
  description:
    '20+ data engineering tracks structured into Junior, Mid, and Senior tiers. Explore PySpark, Microsoft Fabric, Apache Airflow, SQL, Python, Kafka, Docker, dbt, and more.',
  alternates: { canonical: '/topics' },
  openGraph: {
    title: 'All Tracks — PySpark, Airflow, Fabric, SQL, Python',
    description:
      'Five core data engineering tracks plus 14+ reference topics, each progressing Junior to Senior.',
    url: 'https://stablegrid.io/topics',
  },
};

export default function Page() {
  return <TopicsPage />;
}
