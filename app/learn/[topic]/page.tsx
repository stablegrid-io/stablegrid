import { redirect } from 'next/navigation';
import { learnTopics } from '@/data/learn';

interface LearnTopicPageProps {
  params: {
    topic: string;
  };
}

export default function LearnTopicPage({ params }: LearnTopicPageProps) {
  redirect(`/learn/${params.topic}/theory`);
}

export function generateStaticParams() {
  return learnTopics.map((topic) => ({ topic: topic.id }));
}
