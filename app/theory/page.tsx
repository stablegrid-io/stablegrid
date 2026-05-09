import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TheoryTrackEditorial } from '@/components/learn/theory/TheoryTrackEditorial';
import { getLearnTopicMeta } from '@/data/learn';
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
import { loadServerTheoryProgress } from '@/lib/learn/serverTheoryProgress';
import { CourseJsonLd, BreadcrumbJsonLd } from '@/lib/seo/jsonLd';

const TOPIC = 'pyspark';

export default async function TheoryPage() {
  const doc = theoryDocs[TOPIC];
  if (!doc) {
    notFound();
  }

  const { completedChapterIds, chapterProgressById, moduleProgressById } =
    await loadServerTheoryProgress(TOPIC);

  const tracks = getTheoryTracks(doc);
  if (tracks.length === 0) {
    notFound();
  }

  const meta = getLearnTopicMeta(TOPIC);
  const courseUrl = 'https://stablegrid.io/theory';
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: meta?.title ?? doc.title, url: '/theory' }
  ];

  return (
    <>
      <CourseJsonLd
        name={meta?.title ?? doc.title}
        description={meta?.description ?? doc.description}
        url={courseUrl}
        totalMinutes={meta?.chapterMinutes}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <TheoryTrackEditorial
        doc={doc}
        tracks={tracks}
        completedChapterIds={completedChapterIds}
        chapterProgressById={chapterProgressById}
        moduleProgressById={moduleProgressById}
      />
    </>
  );
}

export function generateMetadata(): Metadata {
  const meta = getLearnTopicMeta(TOPIC);
  const doc = theoryDocs[TOPIC];

  if (!meta && !doc) {
    return { title: 'Theory' };
  }

  const title = meta?.title ?? doc?.title ?? 'Theory';
  const description = meta?.description ?? doc?.description ?? '';

  return {
    title: `${title} — Junior to Senior`,
    description,
    alternates: { canonical: '/theory' },
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} — StableGrid`,
      description,
      url: 'https://stablegrid.io/theory'
    }
  };
}
