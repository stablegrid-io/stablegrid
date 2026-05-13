'use client';

import { motion } from 'framer-motion';

// Dark editorial palette — cream hairlines on near-black canvas,
// Spark orange for the live energized path.
const LINE = 'rgba(232,228,214,0.16)';
const LINE_ACTIVE = 'rgba(226,90,28,0.62)';
const LABEL = 'rgba(232,228,214,0.42)';
const NODE_ENERGIZED = '#e25a1c';
const NODE_OFF = 'rgba(168,138,128,0.55)';

const Breaker = ({ x, y }: { x: number; y: number }) => (
  <rect
    x={x - 5}
    y={y - 5}
    width={10}
    height={10}
    fill="none"
    stroke={LINE}
    strokeWidth={1}
  />
);

const Disconnect = ({ x, y }: { x: number; y: number }) => (
  <g stroke={LINE} strokeWidth={1} fill="none">
    <line x1={x} y1={y - 8} x2={x + 6} y2={y + 8} />
    <circle cx={x} cy={y - 8} r={1.6} fill={LINE} />
    <circle cx={x + 6} cy={y + 8} r={1.6} fill={LINE} />
  </g>
);

const Transformer = ({ x, y }: { x: number; y: number }) => (
  <g stroke={LINE} strokeWidth={1.2} fill="none">
    <circle cx={x} cy={y - 8} r={9} />
    <circle cx={x} cy={y + 8} r={9} />
  </g>
);

const GenIcon = ({ x, y, letter }: { x: number; y: number; letter: string }) => (
  <g>
    <circle cx={x} cy={y} r={14} fill="none" stroke={LINE} strokeWidth={1.2} />
    <text
      x={x}
      y={y + 4}
      fontFamily="var(--font-jetbrains-mono), monospace"
      fontSize={11}
      fill={LABEL}
      textAnchor="middle"
    >
      {letter}
    </text>
  </g>
);

const BatterySym = ({ x, y }: { x: number; y: number }) => (
  <g stroke={LINE} strokeWidth={1} fill="none">
    <rect x={x - 18} y={y - 9} width={36} height={18} />
    <line x1={x - 6} y1={y - 9} x2={x - 6} y2={y + 9} />
    <line x1={x + 6} y1={y - 9} x2={x + 6} y2={y + 9} />
  </g>
);

const Label = ({
  x,
  y,
  children,
  anchor = 'start',
  size = 9
}: {
  x: number;
  y: number;
  children: string;
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
}) => (
  <text
    x={x}
    y={y}
    fontFamily="var(--font-jetbrains-mono), ui-monospace, monospace"
    fontSize={size}
    fill={LABEL}
    textAnchor={anchor}
    letterSpacing="0.08em"
  >
    {children}
  </text>
);

export const ScadaMimicBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* ───── GENERATION SOURCES (top) ───── */}
        <GenIcon x={140} y={70} letter="G" />
        <Label x={140} y={42} anchor="middle">GRID INTERTIE</Label>

        <GenIcon x={340} y={70} letter="W" />
        <Label x={340} y={42} anchor="middle">WIND · 48 MW</Label>

        <GenIcon x={540} y={70} letter="PV" />
        <Label x={540} y={42} anchor="middle">SOLAR · 22 MW</Label>

        {/* Drop-down lines from generators to 330kV bus */}
        <line x1={140} y1={84} x2={140} y2={195} stroke={LINE} strokeWidth={1} />
        <line x1={340} y1={84} x2={340} y2={195} stroke={LINE_ACTIVE} strokeWidth={1.2} />
        <line x1={540} y1={84} x2={540} y2={195} stroke={LINE_ACTIVE} strokeWidth={1.2} />

        <Disconnect x={140} y={130} />
        <Breaker x={340} y={140} />
        <Breaker x={540} y={140} />

        {/* ───── 330 kV BUS ───── */}
        <line x1={80} y1={200} x2={1120} y2={200} stroke={LINE_ACTIVE} strokeWidth={2.4} />
        <Label x={1130} y={203} size={10}>330 kV</Label>
        <Label x={80} y={188} size={8}>BUS A-01</Label>

        {/* Status dots on bus */}
        <circle cx={140} cy={200} r={2.2} fill={NODE_OFF} />
        <circle cx={340} cy={200} r={2.2} fill={NODE_ENERGIZED} />
        <circle cx={540} cy={200} r={2.2} fill={NODE_ENERGIZED} />
        <circle cx={780} cy={200} r={2.2} fill={NODE_ENERGIZED} />

        {/* Drop to step-down transformer */}
        <line x1={780} y1={200} x2={780} y2={285} stroke={LINE_ACTIVE} strokeWidth={1.2} />
        <Breaker x={780} y={240} />
        <Transformer x={780} y={305} />
        <Label x={800} y={308} size={8}>T-12 · 330/110</Label>
        <line x1={780} y1={325} x2={780} y2={400} stroke={LINE_ACTIVE} strokeWidth={1.2} />

        {/* ───── 110 kV BUS ───── */}
        <line x1={240} y1={405} x2={1040} y2={405} stroke={LINE_ACTIVE} strokeWidth={1.8} />
        <Label x={1050} y={408} size={10}>110 kV</Label>
        <Label x={240} y={393} size={8}>BUS B-02</Label>

        <circle cx={420} cy={405} r={2} fill={NODE_ENERGIZED} />
        <circle cx={620} cy={405} r={2} fill={NODE_ENERGIZED} />
        <circle cx={780} cy={405} r={2} fill={NODE_ENERGIZED} />

        {/* Branch left → step-down to distribution */}
        <line x1={420} y1={405} x2={420} y2={490} stroke={LINE} strokeWidth={1} />
        <Breaker x={420} y={445} />
        <Transformer x={420} y={510} />
        <Label x={440} y={513} size={8}>T-08 · 110/10</Label>
        <line x1={420} y1={530} x2={420} y2={605} stroke={LINE} strokeWidth={1} />

        {/* Branch middle → BESS */}
        <line x1={620} y1={405} x2={620} y2={500} stroke={LINE_ACTIVE} strokeWidth={1.2} />
        <Breaker x={620} y={450} />
        <BatterySym x={620} y={515} />
        <Label x={620} y={545} anchor="middle" size={9}>BESS · 40 MWh</Label>
        <Label x={620} y={557} anchor="middle" size={8}>DISCHARGE → 18:00–19:00</Label>

        {/* ───── 10 kV DISTRIBUTION BUS ───── */}
        <line x1={180} y1={610} x2={680} y2={610} stroke={LINE} strokeWidth={1.4} />
        <Label x={690} y={613} size={10}>10 kV</Label>
        <Label x={180} y={598} size={8}>FEEDER F-04</Label>

        {/* Loads from distribution bus */}
        <line x1={260} y1={610} x2={260} y2={685} stroke={LINE} strokeWidth={1} />
        <Breaker x={260} y={645} />
        <polygon points="252,690 268,690 260,705" fill="none" stroke={LINE} strokeWidth={1} />
        <Label x={260} y={725} anchor="middle" size={9}>EV · 6.4 MW</Label>

        <line x1={420} y1={610} x2={420} y2={685} stroke={LINE} strokeWidth={1} />
        <Breaker x={420} y={645} />
        <polygon points="412,690 428,690 420,705" fill="none" stroke={LINE} strokeWidth={1} />
        <Label x={420} y={725} anchor="middle" size={9}>RES · 3.1 MW</Label>

        <line x1={600} y1={610} x2={600} y2={685} stroke={LINE} strokeWidth={1} />
        <Breaker x={600} y={645} />
        <polygon points="592,690 608,690 600,705" fill="none" stroke={LINE} strokeWidth={1} />
        <Label x={600} y={725} anchor="middle" size={9}>IND · 11.2 MW</Label>

        {/* ───── Coordinate annotations (newspaper-style margin notes) ───── */}
        <Label x={40} y={780} size={7}>SCADA MIMIC · STABLEGRID NODE-04 · 2026-05-13T18:14:22Z</Label>
        <Label x={1160} y={780} anchor="end" size={7}>FREQ 50.02 Hz · PF 0.97 · NORMAL</Label>

        {/* ───── Animated current-flow dot along active path ───── */}
        <motion.circle
          r={2.6}
          fill={NODE_ENERGIZED}
          initial={{ offsetDistance: '0%' }}
          animate={{ offsetDistance: '100%' }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{
            offsetPath:
              "path('M 340,84 L 340,200 L 780,200 L 780,285 L 780,325 L 780,405 L 620,405 L 620,500')",
            offsetRotate: '0deg'
          }}
        />
      </svg>

      {/* Dark vignette so center headline stays readable on the schematic */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(20,20,15,0) 0%, rgba(20,20,15,0.55) 55%, rgba(20,20,15,0.88) 100%)'
        }}
      />
    </div>
  );
};
