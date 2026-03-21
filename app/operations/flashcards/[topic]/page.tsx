import { redirect } from 'next/navigation';

export default function OperationsFlashcardsTopicPage({ params }: { params: { topic: string } }) {
  redirect(`/practice/${params.topic}`);
}
