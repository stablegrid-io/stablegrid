'use client';

import { useId, useRef, useState, useCallback, type CSSProperties } from 'react';

interface BessContainerProps {
  uid?: string;
  fill?: number;
  doorsOpen?: boolean;
  kWh?: number;
  pct?: number;
  litCells?: number;
  totalCells?: number;
  className?: string;
  style?: CSSProperties;
}

export default function BessContainer({
  uid: uidProp,
  fill = 0.65,
  doorsOpen = false,
  kWh = 0,
  pct = 0,
  litCells: litCellsProp,
  totalCells: totalCellsProp,
  className = '',
  style = {},
}: BessContainerProps) {
  const autoUid = useId().replace(/:/g, '');
  const uid = uidProp || autoUid;
  const clamped = Math.max(0, Math.min(1, fill));

  const W = 260, H = 160, D = 140;
  const KX = 0.58, KY = 0.32;
  const P = (x: number, y: number, z: number) => ({ x: x + z * KX, y: -y - z * KY });

  const COLS = 6, ROWS = 7;
  const TOTAL_CELLS = COLS * ROWS;
  const fillContinuous = clamped * TOTAL_CELLS; // e.g. 26.4 — cell 26 is partially lit
  const litCells = Math.floor(fillContinuous);
  const partialFill = fillContinuous - litCells; // 0–1 for the next cell
  const kWhPerCell = kWh > 0 && TOTAL_CELLS > 0 ? kWh / (clamped * TOTAL_CELLS) : 0;
  const rackZ = 24;
  const rackX0 = 14, rackX1 = W - 14;
  const rackY0 = 12, rackY1 = H - 18;

  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ mx: number; my: number; text: string; sub: string; lit: boolean } | null>(null);

  const handleCellEnter = useCallback((e: React.MouseEvent, text: string, sub: string, lit: boolean) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    setHoveredCell({ mx, my, text, sub, lit });
  }, []);

  const doorY0 = 10, doorY1 = H - 10;
  const doorXL0 = 8, doorXL1 = W / 2;
  const doorXR0 = W / 2, doorXR1 = W - 8;

  // Door animation: open state holds doors open, closed state holds them shut
  const doorOpenPct = doorsOpen ? 'scaleX(0.12)' : 'scaleX(1)';
  const doorSkewL = doorsOpen ? 'skewY(-8deg)' : 'skewY(0deg)';
  const doorSkewR = doorsOpen ? 'skewY(8deg)' : 'skewY(0deg)';

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <svg
        viewBox="-40 -210 380 290"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`side-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c5cad3" />
            <stop offset="100%" stopColor="#6d737e" />
          </linearGradient>
          <linearGradient id={`top-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5f7fa" />
            <stop offset="100%" stopColor="#c5cad3" />
          </linearGradient>
          <linearGradient id={`doorL-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dfe3ea" />
            <stop offset="50%" stopColor="#b6bcc8" />
            <stop offset="100%" stopColor="#7c8392" />
          </linearGradient>
          <linearGradient id={`doorR-${uid}`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dfe3ea" />
            <stop offset="50%" stopColor="#b6bcc8" />
            <stop offset="100%" stopColor="#7c8392" />
          </linearGradient>
          <linearGradient id={`doorBack-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a3f4a" />
            <stop offset="100%" stopColor="#1b1e25" />
          </linearGradient>
          <linearGradient id={`inside-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06080c" />
            <stop offset="100%" stopColor="#12151c" />
          </linearGradient>
          <linearGradient id={`modOff-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f3540" />
            <stop offset="100%" stopColor="#13161c" />
          </linearGradient>
          <linearGradient id={`modOn-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b5ecf6" />
            <stop offset="55%" stopColor="#3fb0c8" />
            <stop offset="100%" stopColor="#1a5565" />
          </linearGradient>
          <radialGradient id={`halo-${uid}`} cx="0.5" cy="0.5" r="0.55">
            <stop offset="0%" stopColor="#78d4e8" stopOpacity="0.24" />
            <stop offset="65%" stopColor="#78d4e8" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#78d4e8" stopOpacity="0" />
          </radialGradient>
          <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id={`spill-${uid}`} cx="0.5" cy="0.5" r="0.55">
            <stop offset="0%" stopColor="#78d4e8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#78d4e8" stopOpacity="0" />
          </radialGradient>
        </defs>

        <style>{`
          @keyframes bp-${uid} { 0%,100%{opacity:.75} 50%{opacity:1} }
          .bp-${uid} { animation: bp-${uid} 2400ms ease-in-out infinite; }
        `}</style>

        {/* Halo — disabled */}

        {/* Ground shadow */}
        {(() => {
          const sh1 = P(-12, 0, 0), sh2 = P(W + 12, 0, 0), sh3 = P(W + 12, 0, D), sh4 = P(-12, 0, D);
          return <polygon points={`${sh1.x},${sh1.y + 8} ${sh2.x},${sh2.y + 8} ${sh3.x},${sh3.y + 6} ${sh4.x},${sh4.y + 6}`} fill="#000" opacity="0.5" />;
        })()}

        {/* Interior: back wall */}
        {(() => {
          const b1 = P(0, 0, D), b2 = P(W, 0, D), b3 = P(W, H, D), b4 = P(0, H, D);
          return (
            <>
              <polygon points={`${b1.x},${b1.y} ${b2.x},${b2.y} ${b3.x},${b3.y} ${b4.x},${b4.y}`} fill={`url(#inside-${uid})`} />
              <polygon points={`${b1.x},${b1.y} ${b2.x},${b2.y} ${b3.x},${b3.y} ${b4.x},${b4.y}`} fill="#3fb0c8" opacity="0.08" />
            </>
          );
        })()}

        {/* Left interior wall */}
        {(() => {
          const a = P(0, 0, 0), b = P(0, H, 0), c = P(0, H, D), d = P(0, 0, D);
          return <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill="#0a0d13" />;
        })()}

        {/* Floor */}
        {(() => {
          const f1 = P(0, 0, 0), f2 = P(W, 0, 0), f3 = P(W, 0, D), f4 = P(0, 0, D);
          return <polygon points={`${f1.x},${f1.y} ${f2.x},${f2.y} ${f3.x},${f3.y} ${f4.x},${f4.y}`} fill="#05070b" />;
        })()}

        {/* Interior spill light — disabled */}

        {/* Rack of modules */}
        {(() => {
          const cellW = (rackX1 - rackX0) / COLS;
          const cellH = (rackY1 - rackY0) / ROWS;
          const depthZ = rackZ + 14;
          const cells = [];

          for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
              const x0 = rackX0 + col * cellW + 0.8;
              const x1 = rackX0 + (col + 1) * cellW - 0.8;
              const y0 = rackY1 - (row + 1) * cellH + 0.8;
              const y1 = rackY1 - row * cellH - 0.8;
              const cellIndex = row * COLS + col;
              const lit = cellIndex < litCells;
              const isPartial = cellIndex === litCells && partialFill > 0.05;
              const cellOpacity = lit ? 0.95 : isPartial ? 0.15 + partialFill * 0.6 : 0;

              const f_bl = P(x0, y0, rackZ), f_br = P(x1, y0, rackZ);
              const f_tr = P(x1, y1, rackZ), f_tl = P(x0, y1, rackZ);
              const b_br = P(x1, y0, depthZ), b_tr = P(x1, y1, depthZ), b_tl = P(x0, y1, depthZ);

              // Tooltip content
              const cellId = `R${row + 1}C${col + 1}`;
              const cellKWh = lit ? Math.round(kWhPerCell) : isPartial ? Math.round(kWhPerCell * partialFill) : 0;
              const tipText = lit ? `${cellKWh.toLocaleString()} kWh` : isPartial ? `${cellKWh.toLocaleString()} kWh` : 'Empty';
              const tipSub = lit ? `Cell ${cellId} · Charged` : isPartial ? `Cell ${cellId} · Charging` : `Cell ${cellId} · Awaiting charge`;
              const cx = (f_bl.x + f_tr.x) / 2;
              const cy = (f_tl.y + f_bl.y) / 2;

              cells.push(
                <g key={`c${row}-${col}`} style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => handleCellEnter(e, tipText, tipSub, lit)}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  <polygon points={`${f_tl.x},${f_tl.y} ${f_tr.x},${f_tr.y} ${b_tr.x},${b_tr.y} ${b_tl.x},${b_tl.y}`} fill="#0e1117" stroke="#000" strokeWidth="0.25" />
                  <polygon points={`${f_br.x},${f_br.y} ${b_br.x},${b_br.y} ${b_tr.x},${b_tr.y} ${f_tr.x},${f_tr.y}`} fill="#1a1e28" stroke="#000" strokeWidth="0.25" />
                  <polygon points={`${f_bl.x},${f_bl.y} ${f_br.x},${f_br.y} ${f_tr.x},${f_tr.y} ${f_tl.x},${f_tl.y}`} fill={`url(#modOff-${uid})`} stroke="#000" strokeWidth="0.4" />
                  <line x1={f_bl.x + 1.2} y1={(f_bl.y + f_tl.y) / 2} x2={f_br.x - 1.2} y2={(f_br.y + f_tr.y) / 2} stroke="#000" strokeOpacity="0.45" strokeWidth="0.35" />
                  {(lit || isPartial) && (
                    <g>
                      <polygon
                        points={`${f_bl.x + 0.6},${f_bl.y - 0.6} ${f_br.x - 0.6},${f_br.y - 0.6} ${f_tr.x - 0.6},${f_tr.y + 0.6} ${f_tl.x + 0.6},${f_tl.y + 0.6}`}
                        fill={`url(#modOn-${uid})`} opacity={cellOpacity}
                        className={lit ? `bp-${uid}` : undefined}
                        style={lit ? { animationDelay: `${(row * 91 + col * 203) % 1800}ms` } : undefined}
                      />
                      {lit && <line x1={f_tl.x + 1} y1={f_tl.y + 0.8} x2={f_tr.x - 1} y2={f_tr.y + 0.8} stroke="#ffffff" strokeOpacity="0.85" strokeWidth="0.5" />}
                    </g>
                  )}
                  {!lit && ((row + col) % 4 === 0) && (
                    <circle cx={f_br.x - 1.5} cy={(f_br.y + f_tr.y) / 2} r="0.5" fill="#ff2a2a" opacity="0.55" />
                  )}
                </g>
              );
            }
          }
          return cells;
        })()}

        {/* Rack rails */}
        {Array.from({ length: COLS + 1 }).map((_, i) => {
          const x = rackX0 + ((rackX1 - rackX0) * i / COLS);
          const p1 = P(x, rackY0, rackZ), p2 = P(x, rackY1, rackZ);
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#000" strokeOpacity="0.9" strokeWidth="0.9" />;
        })}

        {/* Right side face */}
        {(() => {
          const s1 = P(W, 0, 0), s2 = P(W, H, 0), s3 = P(W, H, D), s4 = P(W, 0, D);
          return <polygon points={`${s1.x},${s1.y} ${s2.x},${s2.y} ${s3.x},${s3.y} ${s4.x},${s4.y}`} fill={`url(#side-${uid})`} stroke="#0b0e14" strokeWidth="1" strokeLinejoin="round" />;
        })()}

        {/* Louvers on right side */}
        {Array.from({ length: 18 }).map((_, i) => {
          const t = (i + 0.5) / 18;
          const y = 12 + (H - 24) * t;
          const p1 = P(W, y, 6), p2 = P(W, y, D - 6);
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#4a4f5a" strokeOpacity="0.7" strokeWidth="0.9" strokeLinecap="round" />;
        })}

        {/* Top face */}
        {(() => {
          const t1 = P(0, H, 0), t2 = P(W, H, 0), t3 = P(W, H, D), t4 = P(0, H, D);
          return <polygon points={`${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y} ${t4.x},${t4.y}`} fill={`url(#top-${uid})`} stroke="#0b0e14" strokeWidth="1" strokeLinejoin="round" />;
        })()}
        {[0.25, 0.5, 0.75].map((t, i) => {
          const p1 = P(W * t, H, 0), p2 = P(W * t, H, D);
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#9097a4" strokeOpacity="0.55" strokeWidth="0.8" />;
        })}

        {/* Front frame */}
        {(() => {
          const f1 = P(0, 0, 0), f2 = P(W, 0, 0), f3 = P(W, H, 0), f4 = P(0, H, 0);
          return (
            <g>
              <polygon points={`${f1.x},${f1.y} ${P(doorXL0, 0, 0).x},${P(doorXL0, 0, 0).y} ${P(doorXL0, H, 0).x},${P(doorXL0, H, 0).y} ${f4.x},${f4.y}`} fill="#42485a" stroke="#0b0e14" strokeWidth="0.8" />
              <polygon points={`${P(doorXR1, 0, 0).x},${P(doorXR1, 0, 0).y} ${f2.x},${f2.y} ${f3.x},${f3.y} ${P(doorXR1, H, 0).x},${P(doorXR1, H, 0).y}`} fill="#42485a" stroke="#0b0e14" strokeWidth="0.8" />
              <polygon points={`${f1.x},${f1.y} ${f2.x},${f2.y} ${P(doorXR1, doorY0, 0).x},${P(doorXR1, doorY0, 0).y} ${P(doorXL0, doorY0, 0).x},${P(doorXL0, doorY0, 0).y}`} fill="#3a4050" stroke="#0b0e14" strokeWidth="0.8" />
              <polygon points={`${P(doorXL0, doorY1, 0).x},${P(doorXL0, doorY1, 0).y} ${P(doorXR1, doorY1, 0).x},${P(doorXR1, doorY1, 0).y} ${f3.x},${f3.y} ${f4.x},${f4.y}`} fill="#525866" stroke="#0b0e14" strokeWidth="0.8" />
            </g>
          );
        })()}

        {/* Doors */}
        {(() => {
          const LtopL = P(doorXL0, doorY1, 0), LbotR = P(doorXL1, doorY0, 0);
          const RtopL = P(doorXR0, doorY1, 0), RbotR = P(doorXR1, doorY0, 0);
          const Lx = LtopL.x, Ly = LtopL.y, Lw = LbotR.x - LtopL.x, Lh = LbotR.y - LtopL.y;
          const Rx = RtopL.x, Ry = RtopL.y, Rw = RbotR.x - RtopL.x, Rh = RbotR.y - RtopL.y;

          const leaf = (side: 'L' | 'R') => {
            const grad = side === 'L' ? `doorL-${uid}` : `doorR-${uid}`;
            return (
              <g>
                <rect x="0" y="0" width="100" height="100" fill={`url(#${grad})`} stroke="#0b0e14" strokeWidth="0.6" />
                <rect x="4" y="4" width="92" height="92" rx="1.2" fill="none" stroke="#0b0e14" strokeOpacity="0.35" strokeWidth="0.3" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <line key={`v1-${i}`} x1="22" y1={10 + i * 1.6} x2="78" y2={10 + i * 1.6} stroke="#0b0e14" strokeOpacity="0.45" strokeWidth="0.35" />
                ))}
                {Array.from({ length: 5 }).map((_, i) => (
                  <line key={`v2-${i}`} x1="22" y1={86 + i * 1.6} x2="78" y2={86 + i * 1.6} stroke="#0b0e14" strokeOpacity="0.45" strokeWidth="0.35" />
                ))}
                <rect x={side === 'L' ? 84 : 12} y="44" width="4" height="16" rx="1.2" fill="#2a2f3a" stroke="#0b0e14" strokeWidth="0.2" />
                <rect x={side === 'L' ? 84.2 : 12.2} y="44" width="0.6" height="16" fill="#ffffff" opacity="0.5" />
                <rect x={side === 'L' ? 0.5 : 97.5} y="10" width="2" height="4" fill="#3a4050" />
                <rect x={side === 'L' ? 0.5 : 97.5} y="86" width="2" height="4" fill="#3a4050" />
                <polygon points="0,0 35,0 15,100 0,100" fill="#ffffff" opacity="0.08" />

                {/* Left door: minimal brand */}
                {side === 'L' && (
                  <g>
                    <text x="50" y="48" fontSize="4.5" fontWeight="700" fontFamily="system-ui" fill="#4a4f5a" letterSpacing="2" textAnchor="middle">STABLEGRID</text>
                    <text x="50" y="55" fontSize="2.2" fontWeight="500" fontFamily="system-ui" fill="#6b7280" letterSpacing="1.5" textAnchor="middle">SG-5000 · LFP</text>
                  </g>
                )}

                {/* Right door: live params */}
                {side === 'R' && (
                  <g>
                    <text x="50" y="30" fontSize="2.2" fontWeight="600" fontFamily="system-ui" fill="#6b7280" letterSpacing="1.5" textAnchor="middle">STORED</text>
                    <text x="50" y="42" fontSize="8" fontWeight="700" fontFamily="system-ui" fill="#1a1f2a" letterSpacing="-0.3" textAnchor="middle">{kWh.toLocaleString()}</text>
                    <text x="50" y="49" fontSize="2.8" fontWeight="600" fontFamily="system-ui" fill="#3fb0c8" letterSpacing="1.2" textAnchor="middle">kWh</text>

                    <line x1="30" y1="56" x2="70" y2="56" stroke="#0b0e14" strokeOpacity="0.15" strokeWidth="0.3" />

                    <text x="35" y="66" fontSize="2" fontWeight="600" fontFamily="system-ui" fill="#6b7280" letterSpacing="1" textAnchor="middle">CELLS</text>
                    <text x="35" y="74" fontSize="5.5" fontWeight="700" fontFamily="system-ui" fill="#1a1f2a" textAnchor="middle">{litCellsProp ?? Math.floor((fill ?? 0) * (totalCellsProp ?? COLS * ROWS))}/{totalCellsProp ?? COLS * ROWS}</text>

                    <text x="65" y="66" fontSize="2" fontWeight="600" fontFamily="system-ui" fill="#6b7280" letterSpacing="1" textAnchor="middle">CHARGE</text>
                    <text x="65" y="74" fontSize="5.5" fontWeight="700" fontFamily="system-ui" fill="#1a1f2a" textAnchor="middle">{pct}%</text>
                  </g>
                )}
              </g>
            );
          };

          return (
            <g>
              <svg x={Lx} y={Ly} width={Lw} height={Lh} viewBox="0 0 100 100" overflow="visible" preserveAspectRatio="none">
                <g style={{ transformOrigin: 'left center', transformBox: 'fill-box' as any, transform: `${doorOpenPct} ${doorSkewL}`, transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  <rect x="0" y="0" width="100" height="100" fill={`url(#doorBack-${uid})`} />
                  {leaf('L')}
                </g>
              </svg>
              <svg x={Rx} y={Ry} width={Rw} height={Rh} viewBox="0 0 100 100" overflow="visible" preserveAspectRatio="none">
                <g style={{ transformOrigin: 'right center', transformBox: 'fill-box' as any, transform: `${doorOpenPct} ${doorSkewR}`, transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  <rect x="0" y="0" width="100" height="100" fill={`url(#doorBack-${uid})`} />
                  {leaf('R')}
                </g>
              </svg>
            </g>
          );
        })()}

      </svg>

      {/* HTML tooltip overlay */}
      {hoveredCell && (
        <div
          style={{
            position: 'absolute',
            left: `${hoveredCell.mx}%`,
            top: `${hoveredCell.my}%`,
            transform: 'translate(-50%, -120%)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: '#111416',
              border: `1px solid ${hoveredCell.lit ? 'rgba(120,212,232,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10,
              padding: '8px 14px',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: hoveredCell.lit ? '#78d4e8' : 'rgba(255,255,255,0.35)',
              fontFamily: '-apple-system, system-ui, sans-serif',
              letterSpacing: '-0.01em',
            }}>
              {hoveredCell.text}
            </div>
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
              marginTop: 2,
            }}>
              {hoveredCell.sub}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
