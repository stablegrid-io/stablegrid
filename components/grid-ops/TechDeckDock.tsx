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
    <section className="rounded-2xl border border-[#2a3240] bg-[radial-gradient(circle_at_60%_0%,rgba(34,185,153,0.08),transparent_52%),linear-gradient(180deg,rgba(16,20,27,0.97),rgba(11,14,20,0.96))] p-2.5 text-[#dbe3f0] shadow-[0_16px_44px_rgba(0,0,0,0.34)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-lg font-semibold uppercase tracking-[0.12em] text-[#9fb0ca]">Tech Deck</p>

        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1 rounded-full border border-[#3a4758] bg-[#171f2a]/90 px-3 py-1 text-xs font-semibold text-[#d8e4f7] transition hover:border-brand-400/60"
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
        <div className="rounded-xl border border-[#323f50] bg-[#131a24]/92 px-3 py-2 text-sm text-[#c6d3e6]">
          Deck collapsed for map focus. Expand to review and deploy infrastructure.
        </div>
      )}
    </section>
  );
}
