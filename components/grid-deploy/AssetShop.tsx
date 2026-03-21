import { GRID_ASSETS, type GridAsset } from '@/data/gridAssets';

interface AssetShopProps {
  credits: number;
  selectedSlot: number | null;
  selectedSlotLabel: string | null;
  onDeploy: (assetId: string) => void;
}

export function AssetShop({ credits, selectedSlot, selectedSlotLabel, onDeploy }: AssetShopProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-[#22b99a]/50">
          Asset Shop
        </p>
        <p className="mt-1 font-mono text-[10px] text-[#22b99a]/30">
          {selectedSlot !== null
            ? `Deploying to: ${selectedSlotLabel}`
            : 'Select a grid slot to deploy an asset'}
        </p>
      </div>

      {selectedSlot !== null && (
        <div className="relative rounded-[4px] border border-[#22b99a]/25 bg-[#22b99a]/5 px-3 py-2">
          <span className="absolute left-2 top-2 h-3 w-3 border-l border-t border-[#22b99a]/40" />
          <span className="absolute right-2 top-2 h-3 w-3 border-r border-t border-[#22b99a]/40" />
          <span className="absolute left-2 bottom-2 h-3 w-3 border-l border-b border-[#22b99a]/40" />
          <span className="absolute right-2 bottom-2 h-3 w-3 border-r border-b border-[#22b99a]/40" />
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-[#22b99a]">
            Slot selected: {selectedSlotLabel}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {GRID_ASSETS.map((asset: GridAsset) => {
          const canAfford = credits >= asset.cost;
          const canBuy = canAfford && selectedSlot !== null;
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => canBuy && onDeploy(asset.id)}
              disabled={!canBuy}
              className="relative flex w-full items-start gap-3 overflow-hidden rounded-[4px] border p-3 text-left transition-all"
              style={{
                borderColor: canBuy
                  ? `${asset.color}40`
                  : canAfford
                  ? `${asset.color}20`
                  : 'rgba(26,46,38,0.6)',
                background: canBuy
                  ? `${asset.color}06`
                  : 'transparent',
                opacity: canAfford ? 1 : 0.3,
                cursor: canBuy ? 'pointer' : canAfford ? 'default' : 'not-allowed',
              }}
            >
              {/* Left accent stripe */}
              <div
                className="absolute inset-y-0 left-0 w-[2px]"
                style={{ background: canAfford ? `${asset.color}60` : 'transparent' }}
              />
              <span className="mt-0.5 text-xl">{asset.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#c8e8e0]">
                  {asset.name}
                </p>
                <p className="font-mono text-[10px] text-white/30">{asset.description}</p>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-bold text-[#f0c040]">
                €{asset.cost}
              </span>
            </button>
          );
        })}
      </div>

      {/* How it works */}
      <div className="relative rounded-[4px] border border-[#22b99a]/12 bg-[#080a09] p-4">
        <span className="absolute left-2 top-2 h-3 w-3 border-l border-t border-[#22b99a]/20" />
        <span className="absolute right-2 top-2 h-3 w-3 border-r border-t border-[#22b99a]/20" />
        <span className="absolute left-2 bottom-2 h-3 w-3 border-l border-b border-[#22b99a]/20" />
        <span className="absolute right-2 bottom-2 h-3 w-3 border-r border-b border-[#22b99a]/20" />
        <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-[#22b99a]/40">
          How it works
        </p>
        <ol className="space-y-1.5">
          {[
            'Earn € credits in Operations',
            'Click an empty grid slot (+)',
            'Select an asset from this panel',
            'Cover load demand across all slots',
            'Maximize your stability score',
          ].map((step, i) => (
            <li key={i} className="font-mono text-[10px] text-[#22b99a]/30">
              <span className="mr-1.5 text-[#22b99a]/50">▶</span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-3 font-mono text-[10px] text-[#22b99a]/20">
          <span className="mr-1 text-[#f0c040]/40">▶</span>
          Tip: Click a deployed asset to salvage it for 50% refund.
        </p>
      </div>
    </div>
  );
}
