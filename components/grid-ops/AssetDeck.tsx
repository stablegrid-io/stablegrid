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
      className={`rounded-2xl border border-[#d4dde8] bg-[#f8fbff] p-2.5 dark:border-[#2a3341] dark:bg-[#111720] ${
        panelMode
          ? ''
          : 'border-[#2f3a4b] bg-[radial-gradient(circle_at_30%_24%,rgba(34,185,153,0.08),transparent_38%),linear-gradient(180deg,rgba(16,20,27,0.96),rgba(11,14,20,0.96))] p-2 backdrop-blur'
      } ${className ?? ''}`}
    >
      {showHeader ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-[#1d2f46] dark:text-[#e4ebf8]">Tech Deck</h3>
          <p className="text-xs text-[#586b84] dark:text-[#9eabc0]">
            Deploy in sequence to unlock deeper control
          </p>
        </div>
      ) : null}

      <div className={panelMode ? 'grid gap-3 xl:grid-cols-2' : 'flex gap-3 overflow-x-auto pb-1'}>
        {assets.map((asset) => {
          const isRecommended = recommendedAssetId === asset.id;
          const isPending = pendingAssetId === asset.id;
          const isSelected = selectedAssetId === asset.id;
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
                  ? 'border-brand-500/60 bg-brand-500/10 dark:bg-brand-500/10'
                  : panelMode
                    ? 'border-[#cad6e4] bg-white dark:border-[#323d4d] dark:bg-[#151b25]'
                    : 'border-[#2f3e4f] bg-[#131a24]/90'
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f7490] dark:text-[#97a8c1]">
                    {asset.category}
                  </p>
                  <h4 className="mt-0.5 text-sm font-semibold text-[#20344d] dark:text-[#e7eefb]">
                    {asset.name}
                  </h4>
                </div>
                <AssetMetricsPopover asset={asset} panelMode={panelMode} placement="header" />
              </div>

              <p className="mt-1.5 text-xs text-[#50657e] dark:text-[#a7b5c9]">{asset.description}</p>

              <div className="mt-2 grid gap-2">
                <div className="rounded-lg border border-[#d7e1ee] bg-[#f4f8ff] px-2.5 py-2 dark:border-[#313e50] dark:bg-[#121923]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667c98] dark:text-[#9cadc4]">
                    Unlocks
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#233850] dark:text-[#e2eaf8]">
                    {asset.unlocks}
                  </p>
                </div>

                {asset.synergy_hint ? (
                  <div className="rounded-lg border border-brand-500/25 bg-brand-500/10 px-2.5 py-2 text-[11px] text-brand-800 dark:text-brand-300">
                    {asset.synergy_hint}
                  </div>
                ) : null}
              </div>

              {showModelPreviews && hasInlinePreview ? (
                asset.id === 'control-center' ? (
                  <ControlCenterModelPreview className={panelMode ? 'mt-2.5 h-40' : 'mt-2.5 h-36'} />
                ) : asset.id === 'battery-storage' ? (
                  <BatteryStorageModelPreview className={panelMode ? 'mt-2.5 h-40' : 'mt-2.5 h-36'} />
                ) : asset.id === 'solar-forecasting-array' ? (
                  <SolarForecastingModelPreview className={panelMode ? 'mt-2.5 h-40' : 'mt-2.5 h-36'} />
                ) : null
              ) : !showModelPreviews && hasInlinePreview ? (
                <div className="mt-2.5 rounded-lg border border-[#313d4f] bg-[#121923] px-3 py-2 text-[11px] text-[#9eacc2]">
                  3D preview unavailable in this runtime.
                </div>
              ) : null}

              <div className="mt-2.5">
                {asset.status === 'deployed' ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-500/35 bg-brand-500/10 px-2.5 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300"
                  >
                    <Zap className="h-4 w-4" />
                    Infrastructure active
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDeploy(asset.id)}
                    disabled={asset.status !== 'available' || isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-600/40 bg-[#1a2230] px-2.5 py-1.5 text-xs font-semibold text-brand-200 transition disabled:cursor-not-allowed disabled:border-[#4a5568] disabled:bg-[#2b3340] disabled:text-[#9ba8ba]"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : asset.locked_reason && asset.status !== 'available' ? (
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

              {!isPending && asset.locked_reason && asset.status !== 'available' ? (
                <p className="mt-2 text-[11px] text-[#647a96] dark:text-[#98a9c2]">
                  {asset.locked_reason}
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
              ? 'border-[#354255] bg-[#121922]/85 hover:border-[#4a5e78]'
              : 'border-[#34445a] bg-[#131a24] hover:border-[#4a5f79]'
          }`}
          aria-label={`View ${asset.name} metrics`}
        >
          <Info className="h-3.5 w-3.5" />
          Details
        </button>

        <div className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 w-[232px] translate-y-1 rounded-lg border border-[#354356] bg-[#111824]/95 p-1.5 opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition group-hover/metrics:pointer-events-auto group-hover/metrics:translate-y-0 group-hover/metrics:opacity-100 group-focus-within/metrics:pointer-events-auto group-focus-within/metrics:translate-y-0 group-focus-within/metrics:opacity-100">
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <StatRow label="Cost" value={`${asset.cost_kwh.toFixed(2)} kWh`} dockMode />
            <StatRow label="Stability" value={`+${asset.effects.stability}%`} dockMode />
            <StatRow label="Risk Damp" value={`+${asset.effects.riskMitigation}`} dockMode />
            <StatRow label="Forecast" value={`+${asset.effects.forecast}%`} dockMode />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  dockMode = false
}: {
  label: string;
  value: string;
  dockMode?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-2 py-1.5 ${
        dockMode
          ? 'border-[#354459] bg-[#121923] dark:border-[#354459] dark:bg-[#121923]'
          : 'border-[#d7e2ef] bg-[#f4f8ff] dark:border-[#334054] dark:bg-[#141b26]'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667d99] dark:text-[#9fb0c8]">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-[#223850] dark:text-[#e2ebf9]">{value}</p>
    </div>
  );
}
