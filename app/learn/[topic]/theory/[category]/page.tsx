import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TheoryLayout } from '@/components/learn/theory/TheoryLayout';
import { learnTopics } from '@/data/learn';
import { theoryDocs } from '@/data/learn/theory';
import {
  filterTheoryDocByCategory,
  getTheoryCategories,
  getTheoryCategoryMeta,
  type TheoryCategorySlug
} from '@/data/learn/theory/categories';

interface LearnTopicTheoryCategoryPageProps {
  params: {
    topic: string;
    category: string;
  };
}

const ALL_CATEGORY = 'all';

export default function LearnTopicTheoryCategoryPage({
  params
}: LearnTopicTheoryCategoryPageProps) {
  const doc = theoryDocs[params.topic];
  if (!doc) {
    notFound();
  }

  const categoryParam = params.category.toLowerCase();
  const categories = getTheoryCategories(doc);
  const validSlugs = categories.map((item) => item.slug);
  const isAllCategory = categoryParam === ALL_CATEGORY;

  if (!isAllCategory && !validSlugs.includes(categoryParam as TheoryCategorySlug)) {
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
    (isAllCategory ? ALL_CATEGORY : categoryParam) as TheoryCategorySlug | 'all'
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

    const slugs = getTheoryCategories(doc).map((category) => category.slug);
    return [{ topic: topic.id, category: ALL_CATEGORY }].concat(
      slugs.map((category) => ({ topic: topic.id, category }))
    );
  });
}

export function generateMetadata({
  params
}: LearnTopicTheoryCategoryPageProps): Metadata {
  const doc = theoryDocs[params.topic];
  if (!doc) {
    return {
      title: 'Theory | Learn | DataGridLab',
      description: 'Chapter-based theory documentation.'
    };
  }

  const categoryParam = params.category.toLowerCase();
  const categoryMeta = getTheoryCategoryMeta(
    (categoryParam === ALL_CATEGORY
      ? ALL_CATEGORY
      : categoryParam) as TheoryCategorySlug | 'all'
  );

  return {
    title: `${doc.title} ${categoryMeta.label} | DataGridLab`,
    description: categoryMeta.description
  };
}
