'use client';

import { GRID_ASSETS, GRID_SLOTS, GRID_CONNECTIONS, type GridSlot } from '@/data/gridAssets';

interface GridMapProps {
  placements: Record<number, string>;
  selectedSlot: number | null;
  onSlotClick: (slotId: number) => void;
}

const VOLTAGE_COLOR: Record<string, string> = {
  '330 kV': '#22b99a',
  '110 kV': '#f0c040',
  '35 kV':  '#f07030',
};

export function GridMap({ placements, selectedSlot, onSlotClick }: GridMapProps) {
  return (
    <div>
      <svg viewBox="0 0 580 420" className="w-full" style={{ maxHeight: 440 }}>
        <defs>
          <pattern id="gdots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.5" fill="#162420" />
          </pattern>
        </defs>
        <rect width="580" height="420" fill="url(#gdots)" />

        {/* Connections */}
        {GRID_CONNECTIONS.map(({ from, to }, i) => {
          const a = GRID_SLOTS[from];
          const b = GRID_SLOTS[to];
          const active = !!placements[from] || !!placements[to];
          return (
            <g key={`c${i}`}>
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={active ? 'rgba(34,185,154,0.18)' : '#162420'} strokeWidth="2"
              />
              {active && (
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="#22b99a" strokeWidth="1" opacity="0.1"
                />
              )}
            </g>
          );
        })}

        {/* Slots */}
        {GRID_SLOTS.map((slot: GridSlot) => {
          const assetId = placements[slot.id];
          const asset = assetId ? GRID_ASSETS.find((a) => a.id === assetId) : null;
          const isSel = selectedSlot === slot.id;
          const voltColor = VOLTAGE_COLOR[slot.voltage] ?? '#22b99a';
          const nodeColor = asset ? asset.color : isSel ? '#22b99a' : '#1a2e26';

          return (
            <g key={slot.id} onClick={() => onSlotClick(slot.id)} style={{ cursor: 'pointer' }}>
              {isSel && (
                <circle
                  cx={slot.x} cy={slot.y} r="36"
                  fill="none" stroke="#22b99a" strokeWidth="1.5"
                  strokeDasharray="4 3" opacity="0.5"
                />
              )}

              {/* Node */}
              <rect
                x={slot.x - 28} y={slot.y - 22} width="56" height="44" rx="3"
                fill={asset ? `${asset.color}12` : isSel ? 'rgba(34,185,154,0.08)' : '#0c1410'}
                stroke={nodeColor + (asset ? 'a0' : isSel ? '90' : '50')}
                strokeWidth={isSel ? 2 : 1.2}
              />

              {/* Corner ticks */}
              {([[-28,-22,-20,-22],[-28,-22,-28,-14],[28,-22,20,-22],[28,-22,28,-14],
                [-28,22,-20,22],[-28,22,-28,14],[28,22,20,22],[28,22,28,14]] as const).map(([x1,y1,x2,y2], bi) => (
                <line key={bi}
                  x1={slot.x+x1} y1={slot.y+y1} x2={slot.x+x2} y2={slot.y+y2}
                  stroke={nodeColor} strokeWidth="1.5"
                />
              ))}

              {/* Content */}
              {asset ? (
                <>
                  <text x={slot.x} y={slot.y - 1} textAnchor="middle" fontSize="16">{asset.icon}</text>
                  <text x={slot.x} y={slot.y + 14} textAnchor="middle" fontSize="7.5"
                    fill={asset.color + 'b0'} fontFamily="monospace" fontWeight="600">
                    {asset.output > 0 ? `${asset.output} MW` : 'STAB'}
                  </text>
                </>
              ) : (
                <text x={slot.x} y={slot.y + 5} textAnchor="middle" fontSize="20"
                  fill={isSel ? '#22b99a60' : '#1a2e26'}>+</text>
              )}

              {/* Slot label */}
              <text x={slot.x} y={slot.y - 33} textAnchor="middle" fontSize="8"
                fill="#4a6860" fontFamily="monospace">{slot.label}</text>

              {/* Voltage badge */}
              <rect x={slot.x - 20} y={slot.y + 26} width="40" height="12" rx="2"
                fill={voltColor + '12'} stroke={voltColor + '30'} strokeWidth="0.5" />
              <text x={slot.x} y={slot.y + 35} textAnchor="middle" fontSize="6.5"
                fill={voltColor + '90'} fontFamily="monospace">{slot.voltage}</text>

              {/* Load */}
              <text x={slot.x} y={slot.y + 50} textAnchor="middle" fontSize="7"
                fill="#f0406070" fontFamily="monospace">{slot.loadDemand} MW load</text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#22b99a]/30">
        Click an empty slot to select it, then choose an asset from the shop. Click a deployed asset to salvage (50% refund).
      </p>
    </div>
  );
}
