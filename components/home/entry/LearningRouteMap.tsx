'use client';

import { LearningGrid } from '@/components/home/home/LearningGrid';
import type { LearningRouteMapData } from '@/components/home/entry/types';

interface LearningRouteMapProps {
  data: LearningRouteMapData;
}

export const LearningRouteMap = ({ data }: LearningRouteMapProps) => {
  return (
    <section
      aria-labelledby="learning-route-map-heading"
      className="rounded-2xl border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface"
    >
      <h2
        id="learning-route-map-heading"
        className="sr-only"
      >
        Learning Route Map
      </h2>
      <LearningGrid
        metrics={data.metrics}
        nodes={data.nodes}
        links={data.links}
        recommendedNodeId={data.recommendedNodeId}
        showRouteControls={false}
      />
    </section>
  );
};
