import { redirect } from 'next/navigation';

interface Props {
  params: { topic: string; level: string; modulePrefix: string };
}

export default function PracticeSessionRedirect({ params }: Props) {
  redirect(`/operations/practice/${params.topic}/${params.level}/${params.modulePrefix}`);
}
