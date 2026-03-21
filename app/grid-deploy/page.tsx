'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOperationsStore } from '@/lib/stores/useOperationsStore';
import { GRID_ASSETS, GRID_SLOTS, calculateGridScore } from '@/data/gridAssets';
import { GameToast, useGameToast } from '@/components/ui/GameToast';
import { GridMap } from '@/components/grid-deploy/GridMap';
import { GridStats } from '@/components/grid-deploy/GridStats';
import { AssetShop } from '@/components/grid-deploy/AssetShop';

export default function GridDeployPage() {
  const credits = useOperationsStore((s) => s.credits);
  const gridPlacements = useOperationsStore((s) => s.gridPlacements);
  const placeAsset = useOperationsStore((s) => s.placeAsset);
  const removeAsset = useOperationsStore((s) => s.removeAsset);
  const deductCredits = useOperationsStore((s) => s.deductCredits);
  const addCredits = useOperationsStore((s) => s.addCredits);
  const { toast, show: showToast } = useGameToast();

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const score = calculateGridScore(gridPlacements);
  const selectedSlotLabel = selectedSlot !== null ? (GRID_SLOTS[selectedSlot]?.label ?? null) : null;

  const handleSlotClick = (slotId: number) => {
    const existingAssetId = gridPlacements[slotId];
    if (existingAssetId) {
      const asset = GRID_ASSETS.find((a) => a.id === existingAssetId);
      if (!asset) return;
      const refund = Math.floor(asset.cost * 0.5);
      removeAsset(slotId);
      addCredits(refund);
      showToast(`${asset.name} salvaged · +€${refund}`, '#f0c040');
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slotId === selectedSlot ? null : slotId);
    }
  };

  const handleDeploy = (assetId: string) => {
    if (selectedSlot === null) return;
    const asset = GRID_ASSETS.find((a) => a.id === assetId);
    if (!asset) return;
    if (credits < asset.cost) { showToast('Insufficient credits', '#f04060'); return; }
    if (gridPlacements[selectedSlot]) { showToast('Slot already occupied', '#f04060'); return; }
    deductCredits(asset.cost);
    placeAsset(selectedSlot, assetId);
    showToast(`${asset.name} deployed · -€${asset.cost}`, asset.color);
    setSelectedSlot(null);
  };

  return (
    <div
      className="relative min-h-screen px-4 pb-20 pt-8"
      style={{ background: '#060809' }}
    >
      {/* Scanlines */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
          backgroundSize: '100% 3px',
        }}
      />
      {/* Tactical grid */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(250,250,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250,250,250,0.03) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />

      {toast && <GameToast msg={toast.msg} color={toast.color} />}

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div
          className="mb-8 pb-6"
          style={{ borderBottom: '1px solid rgba(34,185,154,0.12)' }}
        >
          <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#22b99a]/40">
            // GRID-FLUX · GRID DEPLOY
          </p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="font-mono text-[1.6rem] font-black uppercase tracking-[0.12em] text-[#e8f4f0]">
                Grid Deploy
              </h1>
              <div
                className="mt-2 h-[2px] w-28"
                style={{
                  background:
                    'linear-gradient(90deg, #f0c040 0%, #22b99a 50%, transparent 100%)',
                }}
              />
              <p className="mt-3 font-mono text-[11px] text-[#22b99a]/50">
                Deploy energy assets to cover load demand and stabilize your grid.
              </p>
            </div>

            {/* Balance HUD panel */}
            <div className="relative shrink-0 flex flex-col items-end gap-1 border border-[#22b99a]/20 bg-[#080a09] px-5 py-3 rounded-[4px]">
              <span className="absolute left-2 top-2 h-3 w-3 border-l border-t border-[#22b99a]/30" />
              <span className="absolute right-2 top-2 h-3 w-3 border-r border-t border-[#22b99a]/30" />
              <span className="absolute left-2 bottom-2 h-3 w-3 border-l border-b border-[#22b99a]/30" />
              <span className="absolute right-2 bottom-2 h-3 w-3 border-r border-b border-[#22b99a]/30" />
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#22b99a]/50">
                Balance
              </p>
              <p className="font-mono text-xl font-bold text-[#f0c040]">€{credits}</p>
              {credits === 0 && (
                <Link
                  href="/operations"
                  className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#22b99a] underline"
                >
                  Earn credits in Operations →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <GridStats score={score} />
        </div>

        {/* Map + shop */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          {/* Network Map container */}
          <div
            className="relative border border-[#22b99a]/20 bg-[#080a09] p-5 rounded-[4px]"
          >
            <span className="absolute left-3 top-3 h-4 w-4 border-l border-t border-[#22b99a]/30" />
            <span className="absolute right-3 top-3 h-4 w-4 border-r border-t border-[#22b99a]/30" />
            <span className="absolute left-3 bottom-3 h-4 w-4 border-l border-b border-[#22b99a]/30" />
            <span className="absolute right-3 bottom-3 h-4 w-4 border-r border-b border-[#22b99a]/30" />
            <p className="mb-4 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#22b99a]/50">
              Network Map
            </p>
            <GridMap
              placements={gridPlacements}
              selectedSlot={selectedSlot}
              onSlotClick={handleSlotClick}
            />
          </div>

          {/* Asset Shop container */}
          <div
            className="relative border border-[#22b99a]/20 bg-[#080a09] p-5 rounded-[4px]"
          >
            <span className="absolute left-3 top-3 h-4 w-4 border-l border-t border-[#22b99a]/30" />
            <span className="absolute right-3 top-3 h-4 w-4 border-r border-t border-[#22b99a]/30" />
            <span className="absolute left-3 bottom-3 h-4 w-4 border-l border-b border-[#22b99a]/30" />
            <span className="absolute right-3 bottom-3 h-4 w-4 border-r border-b border-[#22b99a]/30" />
            <p className="mb-4 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#22b99a]/50">
              Asset Shop
            </p>
            <AssetShop
              credits={credits}
              selectedSlot={selectedSlot}
              selectedSlotLabel={selectedSlotLabel}
              onDeploy={handleDeploy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
