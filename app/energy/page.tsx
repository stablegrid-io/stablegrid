import { CampaignOverview } from '@/components/grid-ops/CampaignOverview';
import { GridOpsExperience } from '@/components/grid-ops/GridOpsExperience';
import { isValidScenarioId } from '@/lib/grid-ops/config';

interface Props {
  searchParams: Promise<{ scenario?: string }>;
}

export default async function EnergyLabPage({ searchParams }: Props) {
  const params = await searchParams;
  const scenarioParam = params.scenario;

  if (scenarioParam && isValidScenarioId(scenarioParam)) {
    return <GridOpsExperience scenarioId={scenarioParam} />;
  }

  return <CampaignOverview />;
}
