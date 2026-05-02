import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CodingTopicTiers } from '@/components/practice/CodingTopicTiers';
import { CODING_TOPICS, getCodingTopic } from '@/lib/practice/codingTopics';
import {
  CODING_LANGUAGES,
  getCodingLanguage,
} from '@/lib/practice/codingLanguages';

interface Props {
  params: { language: string; topic: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const topic = getCodingTopic(params.topic);
  const language = getCodingLanguage(params.language);
  if (!topic || !language) {
    return { title: 'Coding Practice | stablegrid.io', robots: { index: false, follow: false } };
  }
  return {
    title: `${topic.title} · ${language.title} | stablegrid.io`,
    description: topic.description,
    robots: { index: false, follow: false },
  };
}

export function generateStaticParams() {
  // Cross-product: every (language, topic) pair gets a static route.
  return CODING_LANGUAGES.flatMap((l) =>
    CODING_TOPICS.map((t) => ({ language: l.id, topic: t.id })),
  );
}

export default function CodingTopicTiersPage({ params }: Props) {
  const topic = getCodingTopic(params.topic);
  const language = getCodingLanguage(params.language);
  if (!topic || !language) {
    notFound();
  }
  return <CodingTopicTiers topicId={topic.id} languageId={language.id} />;
}
