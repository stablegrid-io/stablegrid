import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TheoryTrackGallery } from '@/components/learn/theory/TheoryTrackGallery';
import { TheoryTrackPath } from '@/components/learn/theory/TheoryTrackPath';
import { learnTopics, getLearnTopicMeta } from '@/data/learn';
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
import { loadServerTheoryProgress } from '@/lib/learn/serverTheoryProgress';
import { CourseJsonLd, BreadcrumbJsonLd } from '@/lib/seo/jsonLd';

interface LearnTopicTheoryPageProps {
  params: {
    topic: string;
  };
}

export default async function LearnTopicTheoryPage({
  params
}: LearnTopicTheoryPageProps) {
  const doc = theoryDocs[params.topic];
  if (!doc) {
    notFound();
  }

  const { completedChapterIds, chapterProgressById, moduleProgressById } =
    await loadServerTheoryProgress(params.topic);

  const tracks = getTheoryTracks(doc);
  const meta = getLearnTopicMeta(params.topic);
  const courseUrl = `https://stablegrid.io/learn/${params.topic}/theory`;
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Topics', url: '/topics' },
    { name: meta?.title ?? doc.title, url: `/learn/${params.topic}/theory` },
  ];

  // Show gallery when tracks are defined, otherwise go straight to module list
  if (tracks.length > 0) {
    return (
      <>
        <CourseJsonLd
          name={meta?.title ?? doc.title}
          description={meta?.description ?? doc.description}
          url={courseUrl}
          totalMinutes={meta?.chapterMinutes}
        />
        <BreadcrumbJsonLd items={breadcrumbItems} />
        <TheoryTrackGallery
          doc={doc}
          tracks={tracks}
          completedChapterIds={completedChapterIds}
          chapterProgressById={chapterProgressById}
          moduleProgressById={moduleProgressById}
        />
      </>
    );
  }

  // No tracks configured — show modules directly
  return (
    <>
      <CourseJsonLd
        name={meta?.title ?? doc.title}
        description={meta?.description ?? doc.description}
        url={courseUrl}
        totalMinutes={meta?.chapterMinutes}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <TheoryTrackPath
        doc={doc}
        track={{
          slug: 'all',
          label: doc.title,
          eyebrow: 'Modules',
          description: doc.description,
          highlights: [],
          chapters: [...(doc.modules ?? doc.chapters)],
          chapterCount: (doc.modules ?? doc.chapters).length,
          totalMinutes: (doc.modules ?? doc.chapters).reduce(
            (sum, ch) => sum + ch.totalMinutes,
            0
          ),
        }}
        completedChapterIds={completedChapterIds}
        chapterProgressById={chapterProgressById}
        moduleProgressById={moduleProgressById}
      />
    </>
  );
}

export function generateStaticParams() {
  return learnTopics.map((topic) => ({ topic: topic.id }));
}

export function generateMetadata({ params }: LearnTopicTheoryPageProps): Metadata {
  const meta = getLearnTopicMeta(params.topic);
  const doc = theoryDocs[params.topic];

  if (!meta && !doc) {
    return { title: 'Topic' };
  }

  const title = meta?.title ?? doc?.title ?? 'Topic';
  const description = meta?.description ?? doc?.description ?? '';
  const canonical = `/learn/${params.topic}/theory`;

  return {
    title: `${title} — Junior to Senior`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} — StableGrid`,
      description,
      url: `https://stablegrid.io${canonical}`,
    },
  };
}
