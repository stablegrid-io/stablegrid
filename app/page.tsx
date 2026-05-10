import type { Metadata } from 'next';
import { LandingPage } from '@/components/home/LandingPage';
import { CourseListJsonLd, FaqJsonLd } from '@/lib/seo/jsonLd';
import { LANDING_FAQS } from '@/lib/landing/faqs';
import { LANDING_TOPICS } from '@/lib/landing/topics';

// Page-level title overrides the root layout's default template so the
// home page reads as a standalone canonical title in search results
// instead of inheriting "<default> · stablegrid.io".
const HOME_TITLE =
  'stablegrid.io — PySpark, written for engineers who already ship';
const HOME_DESCRIPTION =
  'A working PySpark journal for analysts and data engineers. Three tiers, thirty modules, every chapter paired with server-graded practice. Free during beta.';

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
    siteName: 'stablegrid.io',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'stablegrid.io' }],
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
