import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CodingTopicTiers } from '@/components/practice/CodingTopicTiers';
import { CODING_TOPICS, getCodingTopic } from '@/lib/practice/codingTopics';

interface Props {
  params: { topic: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const topic = getCodingTopic(params.topic);
  if (!topic) {
    return { title: 'Coding Practice | stablegrid.io', robots: { index: false, follow: false } };
  }
  return {
    title: `${topic.title} — Coding Practice | stablegrid.io`,
    description: topic.description,
    robots: { index: false, follow: false },
  };
}

export function generateStaticParams() {
  return CODING_TOPICS.map((t) => ({ topic: t.id }));
}

export default function CodingTopicTiersPage({ params }: Props) {
  const topic = getCodingTopic(params.topic);
  if (!topic) {
    notFound();
  }
  return <CodingTopicTiers topicId={topic.id} />;
}
