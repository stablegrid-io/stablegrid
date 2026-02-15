import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ModeSelector } from '@/components/learn/ModeSelector';
import { getLearnTopicMeta, learnTopics } from '@/data/learn';

interface LearnTopicPageProps {
  params: {
    topic: string;
  };
}

export default function LearnTopicPage({ params }: LearnTopicPageProps) {
  const meta = getLearnTopicMeta(params.topic);
  if (!meta) {
    notFound();
  }

  return <ModeSelector meta={meta} />;
}

export function generateStaticParams() {
  return learnTopics.map((topic) => ({ topic: topic.id }));
}

export function generateMetadata({ params }: LearnTopicPageProps): Metadata {
  const meta = getLearnTopicMeta(params.topic);
  if (!meta) {
    return {
      title: 'Learn | Gridlock',
      description: 'Topic learning modes.'
    };
  }

  return {
    title: `${meta.title} | Learn | Gridlock`,
    description: meta.description
  };
}
