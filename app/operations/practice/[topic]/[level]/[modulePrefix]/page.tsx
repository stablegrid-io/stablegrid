import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPracticeSet } from '@/data/operations/practice-sets';
import { readPracticeResumeTaskId } from '@/lib/practice/readPracticeResumeTaskId';
import { PracticeSetSession } from './PracticeSetViewer';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: { topic: string; level: string; modulePrefix: string };
}

export default async function PracticeSetPage({ params }: Props) {
  const practiceSet = getPracticeSet(params.topic, params.modulePrefix);

  if (!practiceSet) {
    notFound();
  }

  const initialTaskId = await readPracticeResumeTaskId(
    params.topic,
    practiceSet.metadata?.moduleId ?? ''
  );

  return (
    <PracticeSetSession
      practiceSet={practiceSet}
      initialTaskId={initialTaskId}
    />
  );
}
