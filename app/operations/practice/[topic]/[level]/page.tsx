import { redirect } from 'next/navigation';

interface Props {
  params: { topic: string; level: string };
}

export default function PracticeLevelRedirect({ params }: Props) {
  redirect(`/learn/${params.topic}/theory/${params.level}`);
}
