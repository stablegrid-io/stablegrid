import type { Metadata } from 'next';
import { TopicsPage } from '@/components/topics/TopicsPage';
import { LANDING_TOPICS } from '@/lib/landing/topics';
import {
  BreadcrumbJsonLd,
  CourseListJsonLd,
} from '@/lib/seo/jsonLd';

const TOPICS_DESCRIPTION =
  '20+ data engineering tracks structured into Junior, Mid, and Senior tiers. Explore PySpark, Microsoft Fabric, Apache Airflow, SQL, Python, Kafka, Docker, dbt, and more.';

export const metadata: Metadata = {
  title: 'All Tracks: PySpark, Airflow, Fabric, SQL, Python',
  description: TOPICS_DESCRIPTION,
  keywords: [
    'data engineering tracks',
    'pyspark course',
    'apache airflow course',
    'microsoft fabric course',
    'sql for data engineers',
    'python for data engineers',
    'data engineer learning path',
  ],
  alternates: {
    canonical: '/topics',
    languages: {
      'en-US': '/topics',
      'x-default': '/topics',
    },
  },
  openGraph: {
    type: 'website',
    title: 'All Tracks — PySpark, Airflow, Fabric, SQL, Python',
    description:
      'Five core data engineering tracks plus 14+ reference topics, each progressing Junior to Senior.',
    url: 'https://stablegrid.io/topics',
    siteName: 'StableGrid',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: 'StableGrid Tracks' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Tracks — StableGrid',
    description:
      'Five core data engineering tracks. Junior to Senior. Free during beta.',
    images: ['/og-image.png'],
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Topics', url: '/topics' },
        ]}
      />
      <CourseListJsonLd
        listName="StableGrid Data Engineering Tracks"
        listUrl="/topics"
        items={LANDING_TOPICS.map((t) => ({
          name: t.name,
          description: t.description,
          url: `/topics/${t.slug}`,
        }))}
      />
      <TopicsPage />
    </>
  );
}
