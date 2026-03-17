import { Info, Loader2, Lock, Zap } from 'lucide-react';
import type { GridOpsAssetView } from '@/lib/grid-ops/types';
import { BatteryStorageModelPreview } from '@/components/grid-ops/BatteryStorageModelPreview';
import { ControlCenterModelPreview } from '@/components/grid-ops/ControlCenterModelPreview';
import { SolarForecastingModelPreview } from '@/components/grid-ops/SolarForecastingModelPreview';

interface AssetDeckProps {
  assets: GridOpsAssetView[];
  recommendedAssetId: string | null;
  pendingAssetId: string | null;
  selectedAssetId: string | null;
  onDeploy: (assetId: string) => void;
  onAssetHover: (assetId: string | null) => void;
  onAssetSelect: (assetId: string | null) => void;
  layout?: 'panel' | 'dock';
  className?: string;
  showHeader?: boolean;
  showModelPreviews?: boolean;
}

export function AssetDeck({
  assets,
  recommendedAssetId,
  pendingAssetId,
  selectedAssetId,
  onDeploy,
  onAssetHover,
  onAssetSelect,
  layout = 'panel',
  className,
  showHeader = true,
  showModelPreviews = true
}: AssetDeckProps) {
  const panelMode = layout === 'panel';

  return (
    <section
      className={`rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,25,0.88),rgba(8,12,18,0.94))] p-2.5 text-[#dbe4f1] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
        panelMode
          ? ''
          : 'border-white/8 bg-[radial-gradient(circle_at_30%_24%,rgba(144,216,196,0.1),transparent_34%),linear-gradient(180deg,rgba(12,17,24,0.9),rgba(8,12,18,0.95))] p-2 backdrop-blur-xl'
      } ${className ?? ''}`}
    >
      {showHeader ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-[#e4ebf8]">Tech Deck</h3>
          <p className="text-xs text-[#9eabc0]">
            Deploy in sequence to unlock deeper control
          </p>
        </div>
      ) : null}

      <div className={panelMode ? 'grid gap-3 xl:grid-cols-2' : 'flex gap-3 overflow-x-auto pb-1'}>
        {assets.map((asset) => {
          const isRecommended = recommendedAssetId === asset.id;
          const isPending = pendingAssetId === asset.id;
          const isSelected = selectedAssetId === asset.id;
          const isDeployed = asset.status === 'deployed';
          const isLocked = Boolean(asset.locked_reason) && asset.status !== 'available';
          const isUnlocked = !isLocked;
          const hasInlinePreview =
            asset.id === 'control-center' ||
            asset.id === 'battery-storage' ||
            asset.id === 'solar-forecasting-array';

          return (
            <article
              key={asset.id}
              className={`group/asset rounded-xl border p-3 transition ${
                panelMode ? '' : 'min-w-[280px] max-w-[320px] shrink-0'
              } ${
                isRecommended
                  ? 'border-brand-400/35 bg-[linear-gradient(180deg,rgba(25,65,55,0.42),rgba(12,18,24,0.92))]'
                  : isLocked
                    ? 'border-white/7 bg-black/15 opacity-[0.78]'
                  : panelMode
                    ? 'border-white/8 bg-black/20 backdrop-blur-sm'
                    : 'border-white/8 bg-white/[0.035] backdrop-blur-sm'
              } ${isSelected ? 'border-cyan-300/70 shadow-[0_0_0_1px_rgba(125,211,252,0.35),0_18px_34px_rgba(10,52,64,0.25)]' : ''} cursor-pointer`}
              onMouseEnter={() => onAssetHover(asset.id)}
              onMouseLeave={() => onAssetHover(null)}
              onClick={() => onAssetSelect(asset.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onAssetSelect(asset.id);
                }
              }}
              tabIndex={0}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#97a8c1]">
                      {asset.category}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                        isDeployed
                          ? 'border-brand-400/25 bg-brand-500/10 text-brand-200'
                          : isLocked
                            ? 'border-white/10 bg-white/[0.04] text-[#97a5b9]'
                            : 'border-emerald-300/18 bg-emerald-400/10 text-[#dff6ee]'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isDeployed
                            ? 'bg-brand-300'
                            : isLocked
                              ? 'bg-[#708196]'
                              : 'bg-[#9fe3c9]'
                        }`}
                      />
                      {isDeployed ? 'Active' : isLocked ? 'Locked' : 'Ready'}
                    </span>
                  </div>
                  <h4 className="mt-0.5 text-sm font-semibold text-[#e7eefb]">
                    {asset.name}
                  </h4>
                </div>
                <AssetMetricsPopover asset={asset} panelMode={panelMode} placement="header" />
              </div>

              <p className="mt-1.5 text-xs text-[#a7b5c9]">{asset.description}</p>

              {isLocked || asset.synergy_hint ? (
                <div className="mt-2 grid gap-2">
                  {isLocked ? (
                    <div className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-2 backdrop-blur-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#97a7bc]">
                        Locked
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#d8e1ef]">
                        {asset.locked_reason}
                      </p>
                    </div>
                  ) : null}

                  {asset.synergy_hint ? (
                    <div className="rounded-lg border border-brand-500/25 bg-brand-500/10 px-2.5 py-2 text-[11px] text-brand-200">
                      {asset.synergy_hint}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {showModelPreviews && hasInlinePreview ? (
                asset.id === 'control-center' ? (
                  <ControlCenterModelPreview className={`${panelMode ? 'mt-2.5 h-40' : 'mt-2.5 h-36'} ${isLocked ? 'opacity-80' : ''}`} />
                ) : asset.id === 'battery-storage' ? (
                  <BatteryStorageModelPreview className={`${panelMode ? 'mt-2.5 h-40' : 'mt-2.5 h-36'} ${isLocked ? 'opacity-80' : ''}`} />
                ) : asset.id === 'solar-forecasting-array' ? (
                  <SolarForecastingModelPreview className={`${panelMode ? 'mt-2.5 h-40' : 'mt-2.5 h-36'} ${isLocked ? 'opacity-80' : ''}`} />
                ) : null
              ) : null}

              <div className="mt-2.5">
                {isDeployed ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-400/25 bg-brand-500/10 px-2.5 py-1.5 text-xs font-semibold text-brand-200"
                  >
                    <Zap className="h-4 w-4" />
                    Infrastructure active
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDeploy(asset.id)}
                    disabled={asset.status !== 'available' || isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-[#e6edf8] transition hover:border-brand-400/45 hover:bg-brand-500/10 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.03] disabled:text-[#90a0b6]"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : isLocked ? (
                      <>
                        <Lock className="h-4 w-4" />
                        Locked asset
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Deploy asset
                      </>
                    )}
                  </button>
                )}
              </div>

              {isUnlocked && !isPending ? (
                <p className="mt-2 text-[11px] text-[#8fa2ba]">
                  {isDeployed
                    ? 'Live on the grid.'
                    : 'Available now. Deploy when you are ready.'}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AssetMetricsPopover({
  asset,
  panelMode,
  placement = 'inline'
}: {
  asset: GridOpsAssetView;
  panelMode: boolean;
  placement?: 'inline' | 'header';
}) {
  return (
    <div className={placement === 'header' ? 'relative shrink-0' : 'relative mt-2.5 flex justify-end'}>
      <div className="group/metrics relative">
        <button
          type="button"
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#93a8c4] transition ${
            panelMode
              ? 'border-white/8 bg-black/20 hover:border-white/16'
              : 'border-white/8 bg-white/[0.04] hover:border-white/16'
          }`}
          aria-label={`View ${asset.name} metrics`}
        >
          <Info className="h-3.5 w-3.5" />
          Details
        </button>

        <div className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 w-[232px] translate-y-1 rounded-lg border border-white/10 bg-[#0d141e]/95 p-1.5 opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl transition group-hover/metrics:pointer-events-auto group-hover/metrics:translate-y-0 group-hover/metrics:opacity-100 group-focus-within/metrics:pointer-events-auto group-focus-within/metrics:translate-y-0 group-focus-within/metrics:opacity-100">
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <StatRow label="Cost" value={`${asset.cost_kwh.toFixed(2)} kWh`} />
            <StatRow label="Stability" value={`+${asset.effects.stability}%`} />
            <StatRow label="Risk Damp" value={`+${asset.effects.riskMitigation}`} />
            <StatRow label="Forecast" value={`+${asset.effects.forecast}%`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-black/20 px-2 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9fb0c8]">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-[#e2ebf9]">{value}</p>
    </div>
  );
}
