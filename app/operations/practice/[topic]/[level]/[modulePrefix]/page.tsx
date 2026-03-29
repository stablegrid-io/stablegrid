import { notFound } from 'next/navigation';
import { getPracticeSet } from '@/data/operations/practice-sets';
import { PracticeSetViewer } from './PracticeSetViewer';

interface Props {
  params: { topic: string; level: string; modulePrefix: string };
}

export default function PracticeSetPage({ params }: Props) {
  const practiceSet = getPracticeSet(params.topic, params.modulePrefix);

  if (!practiceSet) {
    notFound();
  }

  return <PracticeSetViewer practiceSet={practiceSet} />;
}
