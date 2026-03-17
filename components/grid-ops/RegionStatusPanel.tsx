import type { GridOpsRegionView } from '@/lib/grid-ops/types';

// Only show the 3 physical regions that have assets.
// interconnect-ring and optimization-layer are milestone thresholds with no mapped assets.
const PHYSICAL_REGION_IDS = new Set(['western-corridor', 'central-mesh', 'eastern-demand']);

const REGION_SHORT_LABEL: Record<string, string> = {
  'western-corridor': 'Western',
  'central-mesh': 'Central',
  'eastern-demand': 'Eastern'
};

interface Props {
  regions: GridOpsRegionView[];
}

export function RegionStatusPanel({ regions }: Props) {
  const physical = regions.filter((r) => PHYSICAL_REGION_IDS.has(r.id));

  return (
    <div className="mt-2 space-y-2">
      {physical.map((region) => (
        <div key={region.id} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Status dot */}
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                region.status === 'dark'
                  ? 'bg-rose-500'
                  : region.status === 'threatened'
                    ? 'bg-amber-400 animate-pulse'
                    : region.status === 'active'
                      ? 'bg-emerald-400'
                      : 'bg-slate-600'
              }`}
            />
            {/* Label */}
            <span className="truncate text-[0.8rem] font-medium text-[#c8d8ed]">
              {REGION_SHORT_LABEL[region.id] ?? region.name}
            </span>
            {/* Asset count */}
            {region.asset_ids.length > 0 && (
              <span className="shrink-0 text-[0.7rem] text-[#6a7f97]">
                {region.asset_ids.length} asset{region.asset_ids.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* Threat count badge */}
            {region.threat_count > 0 && region.status !== 'dark' && (
              <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-300">
                {region.threat_count} incident{region.threat_count !== 1 ? 's' : ''}
              </span>
            )}
            {/* DARK chip */}
            {region.status === 'dark' && (
              <span className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/15 px-1.5 py-0.5 text-[0.65rem] font-bold text-rose-400">
                DARK
              </span>
            )}
            {/* Inactive label */}
            {region.status === 'inactive' && (
              <span className="text-[0.68rem] text-[#4a5f75]">offline</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
