import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound, redirect } from 'next/navigation';
import { MISSIONS } from '@/data/missions';

const UnifiedMissionExperience = dynamic(() =>
  import('@/components/missions/UnifiedMissionExperience').then(
    (module) => module.UnifiedMissionExperience
  )
);

interface MissionPageProps {
  params: {
    slug: string;
  };
}

export default function MissionPage({ params }: MissionPageProps) {
  if (params.slug === 'ghost-regulator') {
    redirect('/missions/ghost-regulator');
  }

  const mission = MISSIONS.find((item) => item.slug === params.slug);
  if (!mission) {
    notFound();
  }

  return <UnifiedMissionExperience mission={mission} />;
}

export function generateStaticParams() {
  return MISSIONS.map((mission) => ({ slug: mission.slug }));
}

export function generateMetadata({ params }: MissionPageProps): Metadata {
  const mission = MISSIONS.find((item) => item.slug === params.slug);
  if (!mission) {
    return {
      title: 'StableGrid.io',
      description: 'Mission detail page.'
    };
  }

  return {
    title: 'StableGrid.io',
    description: mission.summary
  };
}
