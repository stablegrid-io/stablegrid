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
    <section className="rounded-2xl border border-[#224235] bg-[radial-gradient(circle_at_60%_0%,rgba(16,185,129,0.1),transparent_52%),linear-gradient(180deg,rgba(7,17,14,0.97),rgba(5,12,10,0.96))] p-2.5 text-[#d3e9dc] shadow-[0_16px_44px_rgba(0,0,0,0.34)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-lg font-semibold uppercase tracking-[0.12em] text-[#94c6b0]">Tech Deck</p>

        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1 rounded-full border border-[#2f5f4c] bg-[#101f19]/82 px-3 py-1 text-xs font-semibold text-[#cde8db] transition hover:border-emerald-400/60"
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
        <div className="rounded-xl border border-[#2a4d3f] bg-[#0a1813]/90 px-3 py-2 text-sm text-[#c4dbce]">
          Deck collapsed for map focus. Expand to review and deploy infrastructure.
        </div>
      )}
    </section>
  );
}
