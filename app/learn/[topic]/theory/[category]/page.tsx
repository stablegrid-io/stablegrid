import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { TheoryLayout } from '@/components/learn/theory/TheoryLayout';
import { TheoryTrackPath } from '@/components/learn/theory/TheoryTrackPath';
import { learnTopics } from '@/data/learn';
import { theoryDocs } from '@/data/learn/theory';
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
import { loadServerTheoryProgress } from '@/lib/learn/serverTheoryProgress';

interface LearnTopicTheoryCategoryPageProps {
  params: {
    topic: string;
    category: string;
  };
  searchParams?: {
    chapter?: string | string[];
    lesson?: string | string[];
  };
}

const ALL_CATEGORY = 'all';

export default async function LearnTopicTheoryCategoryPage({
  params,
  searchParams
}: LearnTopicTheoryCategoryPageProps) {
  const doc = theoryDocs[params.topic];
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
    'advanced-track': 'senior',
  };
  const mappedSlug = LEGACY_SLUG_MAP[categoryParam];
  if (mappedSlug) {
    const sp = searchParams ?? {};
    const searchStr = Object.keys(sp).length > 0
      ? '?' + Object.entries(sp)
          .flatMap(([k, v]) => Array.isArray(v) ? v.map(val => `${k}=${val}`) : v ? [`${k}=${v}`] : [])
          .join('&')
      : '';
    redirect(`/learn/${params.topic}/theory/${mappedSlug}${searchStr}`);
  }

  const track = getTheoryTrackBySlug(doc, categoryParam);
  if (track) {
    const trackDoc = getTheoryTrackDocBySlug(doc, categoryParam) ?? doc;
    const requestedChapter =
      typeof searchParams?.chapter === 'string'
        ? searchParams.chapter
        : Array.isArray(searchParams?.chapter)
          ? searchParams.chapter[0]
          : null;

    if (requestedChapter) {
      return <TheoryLayout doc={trackDoc} />;
    }

    const { completedChapterIds, chapterProgressById, moduleProgressById } =
      await loadServerTheoryProgress(trackDoc.topic);

    return (
      <TheoryTrackPath
        doc={trackDoc}
        track={track}
        completedChapterIds={completedChapterIds}
        chapterProgressById={chapterProgressById}
        moduleProgressById={moduleProgressById}
      />
    );
  }

  const categories = getTheoryCategories(doc);
  const validSlugs = categories.map((item) => item.slug);
  const isAllCategory = categoryParam === ALL_CATEGORY;

  if (!isAllCategory && !validSlugs.includes(categoryParam as TheoryCategorySlug)) {
    // Maybe the param is a chapter ID (e.g. /theory/module-09) — redirect to the right category
    const chapterCategory = getChapterCategorySlug(doc, categoryParam);
    if (chapterCategory) {
      redirect(`/learn/${params.topic}/theory/${chapterCategory}?chapter=${categoryParam}`);
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
  return learnTopics.flatMap((topic) => {
    const doc = theoryDocs[topic.id];
    if (!doc) return [];

    const tracks = getTheoryTracks(doc).map((track) => ({
      topic: topic.id,
      category: track.slug
    }));
    const slugs = getTheoryCategories(doc).map((category) => category.slug);
    return [{ topic: topic.id, category: ALL_CATEGORY }]
      .concat(tracks)
      .concat(slugs.map((category) => ({ topic: topic.id, category })));
  });
}

export function generateMetadata({
  params
}: LearnTopicTheoryCategoryPageProps): Metadata {
  const doc = theoryDocs[params.topic];
  if (!doc) {
    return {
      title: 'stableGrid.io',
      description: 'Module-based theory documentation.'
    };
  }

  const categoryParam = params.category.toLowerCase();
  const track = getTheoryTrackBySlug(doc, categoryParam);
  if (track) {
    return {
      title: 'stableGrid.io',
      description: track.description
    };
  }

  const categoryMeta = getTheoryCategoryMeta(
    (categoryParam === ALL_CATEGORY
      ? ALL_CATEGORY
      : categoryParam) as TheoryCategorySlug | 'all',
    doc.topic
  );

  return {
    title: 'stableGrid.io',
    description: categoryMeta.description
  };
}
