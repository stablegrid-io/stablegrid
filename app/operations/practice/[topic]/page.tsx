import { redirect } from 'next/navigation';

interface Props {
  params: { topic: string };
}

export default function PracticeTopicRedirect({ params }: Props) {
  redirect(`/learn/${params.topic}/theory`);
}
