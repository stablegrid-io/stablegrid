import type { Metadata } from 'next';
import { LandingPage } from '@/components/home/LandingPage';
import { CourseListJsonLd, FaqJsonLd } from '@/lib/seo/jsonLd';
import { LANDING_FAQS } from '@/lib/landing/faqs';
import { LANDING_TOPICS } from '@/lib/landing/topics';

// Page-level title overrides the root layout's default template so the
// home page reads as a standalone canonical title in search results
// instead of inheriting "<default> · StableGrid".
const HOME_TITLE =
  'StableGrid — PySpark, Airflow, Fabric, SQL & Python training for Data Engineers';
const HOME_DESCRIPTION =
  'Data engineering training for working analysts and engineers. Junior to Senior tracks in PySpark, Apache Airflow, Microsoft Fabric, SQL, and Python — deep theory paired with server-graded practice. Free during beta.';

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://stablegrid.io',
    siteName: 'StableGrid',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'StableGrid' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ['/og-image.png'],
  },
};

// Five topics surfaced on the landing — same data the Topics carousel
// renders. Emitted as a Schema.org ItemList of Course entries so Google
// has structured signal for each track without depending on visual
// parsing.
const COURSE_ITEMS = LANDING_TOPICS.map((topic) => ({
  name: `${topic.name} for Data Engineers`,
  description: topic.description,
  url: `/topics/${topic.slug}`,
}));

export default function RootPage() {
  return (
    <>
      <FaqJsonLd items={LANDING_FAQS} />
      <CourseListJsonLd
        items={COURSE_ITEMS}
        listName="StableGrid Tracks"
        listUrl="/"
      />
      <LandingPage />
    </>
  );
}
