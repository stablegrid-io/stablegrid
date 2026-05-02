import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CodingTopicGallery } from '@/components/practice/CodingTopicGallery';
import {
  CODING_LANGUAGES,
  getCodingLanguage,
  type CodingLanguageId,
} from '@/lib/practice/codingLanguages';

interface Props {
  params: { language: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const language = getCodingLanguage(params.language);
  if (!language) {
    return { title: 'Coding Practice | stablegrid.io', robots: { index: false, follow: false } };
  }
  return {
    title: `${language.title} Practice | stablegrid.io`,
    description: language.description,
    robots: { index: false, follow: false },
  };
}

export function generateStaticParams() {
  return CODING_LANGUAGES.map((l) => ({ language: l.id }));
}

export default function CodingTopicGalleryPage({ params }: Props) {
  const language = getCodingLanguage(params.language);
  if (!language) {
    notFound();
  }
  return <CodingTopicGallery languageId={language.id as CodingLanguageId} />;
}
