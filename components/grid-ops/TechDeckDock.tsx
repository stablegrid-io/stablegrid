import { ChevronDown, ChevronUp } from 'lucide-react';
import type { GridOpsAssetView } from '@/lib/grid-ops/types';
import { AssetDeck } from '@/components/grid-ops/AssetDeck';

interface TechDeckDockProps {
  assets: GridOpsAssetView[];
  recommendedAssetId: string | null;
  pendingAssetId: string | null;
  selectedAssetId: string | null;
  open: boolean;
  showModelPreviews: boolean;
  onToggle: () => void;
  onDeploy: (assetId: string) => void;
  onAssetHover: (assetId: string | null) => void;
  onAssetSelect: (assetId: string | null) => void;
}

export function TechDeckDock({
  assets,
  recommendedAssetId,
  pendingAssetId,
  selectedAssetId,
  open,
  showModelPreviews,
  onToggle,
  onDeploy,
  onAssetHover,
  onAssetSelect
}: TechDeckDockProps) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,25,0.9),rgba(8,12,18,0.95))] p-2.5 text-[#dbe3f0] shadow-[0_24px_80px_-48px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(144,216,196,0.12),transparent_24%)]" />

      <div className="relative mb-2 flex items-center justify-between gap-3">
        <p className="text-lg font-semibold uppercase tracking-[0.12em] text-[#9fb0ca]">Tech Deck</p>

        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-[#d8e4f7] transition hover:border-white/20 hover:bg-white/[0.075]"
        >
          {open ? (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Collapse
            </>
          ) : (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Expand
            </>
          )}
        </button>
      </div>

      {open ? (
        <AssetDeck
          assets={assets}
          recommendedAssetId={recommendedAssetId}
          pendingAssetId={pendingAssetId}
          selectedAssetId={selectedAssetId}
          onDeploy={onDeploy}
          onAssetHover={onAssetHover}
          onAssetSelect={onAssetSelect}
          layout="dock"
          showHeader={false}
          showModelPreviews={showModelPreviews}
        />
      ) : (
        <div className="relative rounded-[20px] border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-[#c6d3e6] backdrop-blur-sm">
          Deck collapsed for map focus. Expand to review and deploy infrastructure.
        </div>
      )}
    </section>
  );
}
