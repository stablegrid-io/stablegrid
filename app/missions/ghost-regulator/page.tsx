import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const GhostRegulatorMission = dynamic(() =>
  import('@/components/missions/GhostRegulatorMission').then(
    (module) => module.GhostRegulatorMission
  )
);

export const metadata: Metadata = {
  title: 'stableGrid.io',
  description:
    'Play through all four acts of the Ghost Regulator incident mission with live chat, investigation queries, and final classification.'
};

export default function GhostRegulatorMissionPage() {
  return <GhostRegulatorMission />;
}
