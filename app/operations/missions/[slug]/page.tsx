import { redirect } from 'next/navigation';

export default function OperationsMissionPage({ params }: { params: { slug: string } }) {
  redirect(`/missions/${params.slug}`);
}
