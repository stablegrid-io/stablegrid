import { MissionView } from '@/components/operations/MissionView';

interface Props {
  params: { id: string };
}

export function generateMetadata({ params }: Props) {
  return { title: `${params.id} · Operations · GRID-FLUX` };
}

export default function MissionPage({ params }: Props) {
  return <MissionView missionId={params.id} />;
}
