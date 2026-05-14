import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { TheoryLayout } from '@/components/learn/theory/TheoryLayout';
import { CapstoneProjectView } from '@/components/learn/theory/CapstoneProjectView';
import { getLearnTopicMeta } from '@/data/learn';
import { theoryDocs } from '@/data/learn/theory';
import { getPracticeSet } from '@/data/operations/practice-sets';
import { PracticeSetSession } from '@/app/operations/practice/[topic]/[level]/[modulePrefix]/PracticeSetViewer';
import { readPracticeResumeTaskId } from '@/lib/practice/readPracticeResumeTaskId';
import { ModuleCheckpointSession } from '@/components/learn/theory/ModuleCheckpointSession';
import {
  filterTheoryDocByCategory,
  getChapterCategorySlug,
  getTheoryCategories,
  getTheoryCategoryMeta,
  type TheoryCategorySlug
} from '@/data/learn/theory/categories';
import {
  getTheoryTrackBySlug,
  getTheoryTrackDocBySlug,
  getTheoryTracks
} from '@/data/learn/theory/tracks';
import { CourseJsonLd, BreadcrumbJsonLd, FaqJsonLd } from '@/lib/seo/jsonLd';
import { TRACK_FAQS } from '@/lib/landing/faqs';

const TOPIC = 'pyspark';
const ALL_CATEGORY = 'all';

interface TheoryCategoryPageProps {
  params: { category: string };
  searchParams?: {
    chapter?: string | string[];
    lesson?: string | string[];
    practice?: string | string[];
    capstone?: string | string[];
    checkpoint?: string | string[];
  };
}

export default async function TheoryCategoryPage({
  params,
  searchParams
}: TheoryCategoryPageProps) {
  const doc = theoryDocs[TOPIC];
  if (!doc) {
    notFound();
  }

  const categoryParam = params.category.toLowerCase();

  // Redirect legacy track slugs to current ones
  const LEGACY_SLUG_MAP: Record<string, string> = {
    'data-engineering-track': 'junior',
    'full-stack': 'junior',
    'beginner': 'junior',
    'beginner-track': 'junior',
    'intermediate': 'mid',
    'intermediate-track': 'mid',
    'advanced': 'senior',
    'advanced-track': 'senior'
  };
  const mappedSlug = LEGACY_SLUG_MAP[categoryParam];
  if (mappedSlug) {
    const sp = searchParams ?? {};
    const searchStr = Object.keys(sp).length > 0
      ? '?' + Object.entries(sp)
          .flatMap(([k, v]) => Array.isArray(v) ? v.map(val => `${k}=${val}`) : v ? [`${k}=${v}`] : [])
          .join('&')
      : '';
    redirect(`/theory/${mappedSlug}${searchStr}`);
  }

  const track = getTheoryTrackBySlug(doc, categoryParam);
  if (track) {
    const trackDoc = getTheoryTrackDocBySlug(doc, categoryParam) ?? doc;

    const requestedCapstone =
      typeof searchParams?.capstone === 'string'
        ? searchParams.capstone
        : Array.isArray(searchParams?.capstone)
          ? searchParams.capstone[0]
          : null;

    if (requestedCapstone) {
      return <CapstoneProjectView topic={TOPIC} level={categoryParam} />;
    }

    const requestedPractice =
      typeof searchParams?.practice === 'string'
        ? searchParams.practice
        : Array.isArray(searchParams?.practice)
          ? searchParams.practice[0]
          : null;

    if (requestedPractice) {
      const modulePrefix = requestedPractice.replace(/^module-/, '');
      const practiceSet = getPracticeSet(TOPIC, modulePrefix);
      if (!practiceSet) {
        notFound();
      }
      const initialTaskId = await readPracticeResumeTaskId(
        TOPIC,
        practiceSet.metadata?.moduleId ?? ''
      );
      return (
        <PracticeSetSession
          practiceSet={practiceSet}
          initialTaskId={initialTaskId}
        />
      );
    }

    const requestedCheckpoint =
      typeof searchParams?.checkpoint === 'string'
        ? searchParams.checkpoint
        : Array.isArray(searchParams?.checkpoint)
          ? searchParams.checkpoint[0]
          : null;

    if (requestedCheckpoint) {
      const chapterIndex = trackDoc.chapters.findIndex((c) => c.id === requestedCheckpoint);
      if (chapterIndex < 0) {
        notFound();
      }
      const chapter = trackDoc.chapters[chapterIndex];
      const nextChapter = trackDoc.chapters[chapterIndex + 1];
      const nextModuleHref = nextChapter
        ? `/theory/${categoryParam}?chapter=${nextChapter.id}`
        : undefined;
      const nextModuleTitle = nextChapter
        ? nextChapter.title.replace(/^module\s*\d+\s*:\s*/i, '').trim() || nextChapter.title
        : undefined;
      return (
        <ModuleCheckpointSession
          topic={TOPIC}
          trackSlug={categoryParam}
          chapter={chapter}
          returnHref={`/theory/${categoryParam}`}
          nextModuleHref={nextModuleHref}
          nextModuleTitle={nextModuleTitle}
        />
      );
    }

    const requestedChapter =
      typeof searchParams?.chapter === 'string'
        ? searchParams.chapter
        : Array.isArray(searchParams?.chapter)
          ? searchParams.chapter[0]
          : null;

    if (requestedChapter) {
      const trackName = track.title ?? track.label;
      const trackDescription = track.description;
      const trackUrl = `https://stablegrid.io/theory/${categoryParam}`;
      const trackFaqs = TRACK_FAQS[categoryParam as keyof typeof TRACK_FAQS];
      return (
        <>
          <CourseJsonLd
            name={`${doc.title} — ${trackName}`}
            description={trackDescription}
            url={trackUrl}
          />
          <BreadcrumbJsonLd
            items={[
              { name: 'Home', url: '/' },
              { name: 'Theory', url: '/theory' },
              { name: trackName, url: `/theory/${categoryParam}` },
            ]}
          />
          {trackFaqs ? <FaqJsonLd items={trackFaqs} /> : null}
          <TheoryLayout doc={trackDoc} />
        </>
      );
    }

    // No query param — bounce back to the editorial track listing.
    redirect('/theory');
  }

  const categories = getTheoryCategories(doc);
  const validSlugs = categories.map((item) => item.slug);
  const isAllCategory = categoryParam === ALL_CATEGORY;

  if (!isAllCategory && !validSlugs.includes(categoryParam as TheoryCategorySlug)) {
    const chapterCategory = getChapterCategorySlug(doc, categoryParam);
    if (chapterCategory) {
      redirect(`/theory/${chapterCategory}?chapter=${categoryParam}`);
    }
    notFound();
  }

  const filteredDoc = filterTheoryDocByCategory(
    doc,
    (isAllCategory ? ALL_CATEGORY : categoryParam) as TheoryCategorySlug | 'all'
  );

  if (filteredDoc.chapters.length === 0) {
    notFound();
  }

  const categoryMeta = getTheoryCategoryMeta(
    (isAllCategory ? ALL_CATEGORY : categoryParam) as TheoryCategorySlug | 'all',
    doc.topic
  );

  return (
    <TheoryLayout
      doc={{
        ...filteredDoc,
        title: `${doc.title} · ${categoryMeta.label}`,
        description: categoryMeta.description
      }}
    />
  );
}

export function generateStaticParams() {
  const doc = theoryDocs[TOPIC];
  if (!doc) return [];
  const tracks = getTheoryTracks(doc).map((track) => ({ category: track.slug }));
  const slugs = getTheoryCategories(doc).map((category) => ({ category: category.slug }));
  return [{ category: ALL_CATEGORY }].concat(tracks).concat(slugs);
}

export function generateMetadata({ params }: TheoryCategoryPageProps): Metadata {
  const doc = theoryDocs[TOPIC];
  if (!doc) {
    return {
      title: 'Theory',
      description: 'Module-based theory documentation.'
    };
  }

  const indexable = { index: true, follow: true } as const;
  const topicMeta = getLearnTopicMeta(TOPIC);
  const topicTitle = topicMeta?.title ?? doc.title;
  const categoryParam = params.category.toLowerCase();
  const track = getTheoryTrackBySlug(doc, categoryParam);

  if (track) {
    const trackName = track.title ?? track.label;
    const canonical = `/theory/${categoryParam}`;
    return {
      title: `${topicTitle} — ${trackName}`,
      description: track.description,
      alternates: { canonical },
      robots: indexable,
      openGraph: {
        title: `${topicTitle} — ${trackName}`,
        description: track.description,
        url: `https://stablegrid.io${canonical}`
      }
    };
  }

  const categoryMeta = getTheoryCategoryMeta(
    (categoryParam === ALL_CATEGORY
      ? ALL_CATEGORY
      : categoryParam) as TheoryCategorySlug | 'all',
    doc.topic
  );

  return {
    title: `${topicTitle} — ${categoryMeta.label}`,
    description: categoryMeta.description,
    alternates: { canonical: `/theory/${categoryParam}` },
    robots: indexable
  };
}
