import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CheatSheetLayout } from '@/components/learn/CheatSheetLayout';
import { cheatSheets, learnTopics } from '@/data/learn';

interface LearnTopicFunctionsPageProps {
  params: {
    topic: string;
  };
}

export default function LearnTopicFunctionsPage({
  params
}: LearnTopicFunctionsPageProps) {
  const sheet = cheatSheets[params.topic];
  if (!sheet) {
    notFound();
  }
  return <CheatSheetLayout data={sheet} />;
}

export function generateStaticParams() {
  return learnTopics.map((topic) => ({ topic: topic.id }));
}

export function generateMetadata({
  params
}: LearnTopicFunctionsPageProps): Metadata {
  const sheet = cheatSheets[params.topic];
  if (!sheet) {
    return {
      title: 'Functions | Learn | DataGridLab',
      description: 'Interactive function reference.'
    };
  }
  return {
    title: `${sheet.title} Functions | DataGridLab`,
    description: sheet.description
  };
}
