import type { Metadata } from 'next';
import { TopicsPage } from '@/components/topics/TopicsPage';
import { LANDING_TOPICS } from '@/lib/landing/topics';
import {
  BreadcrumbJsonLd,
  CourseListJsonLd,
} from '@/lib/seo/jsonLd';

const TOPICS_DESCRIPTION =
  'PySpark for working data engineers and analysts — Junior, Mid, and Senior modules paired with server-graded practice. Free during beta.';

export const metadata: Metadata = {
  title: 'PySpark track — Junior to Senior',
  description: TOPICS_DESCRIPTION,
  keywords: [
    'pyspark course',
    'pyspark tutorial',
    'pyspark for engineers',
    'pyspark for analysts',
    'spark dataframe',
    'pyspark practice',
    'spark sql',
    'pyspark partitioning',
    'pyspark execution plan',
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
    title: 'PySpark track — Junior to Senior',
    description: TOPICS_DESCRIPTION,
    url: 'https://stablegrid.io/topics',
    siteName: 'stablegrid.io',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: 'stablegrid.io' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PySpark track — stablegrid.io',
    description: TOPICS_DESCRIPTION,
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
        listName="stablegrid.io PySpark track"
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
