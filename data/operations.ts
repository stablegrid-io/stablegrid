export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'generator' | 'load' | 'junction';
  value?: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  annotation?: string;
}

export interface Mission {
  id: string;
  tier: number;
  name: string;
  brief: string;
  question: string;
  diagram: DiagramData;
  options: string[];
  correctIndex: number;
  explanation: string;
  payout: number;
}

export interface TierConfig {
  name: string;
  color: string;
  payout: number;
}

export interface LevelDefinition {
  level: number;
  xpRequired: number;
  title: string;
  unlocksTier: number;
}

export interface LevelInfo extends LevelDefinition {
  next: LevelDefinition | null;
  progress: number;
}

export const TIERS: Record<number, TierConfig> = {
  1: { name: 'FOUNDATION', color: '#20c0d0', payout: 80 },
  2: { name: 'TACTICAL',   color: '#f0c040', payout: 200 },
  3: { name: 'ADVANCED',   color: '#f07030', payout: 400 },
  4: { name: 'SPECIALIST', color: '#d040e0', payout: 800 },
};

export const LEVELS: LevelDefinition[] = [
  { level: 1, xpRequired: 0,    title: 'Apprentice Operator',  unlocksTier: 1 },
  { level: 2, xpRequired: 80,   title: 'Grid Technician',      unlocksTier: 1 },
  { level: 3, xpRequired: 200,  title: 'Control Engineer',     unlocksTier: 2 },
  { level: 4, xpRequired: 400,  title: 'Senior Analyst',       unlocksTier: 2 },
  { level: 5, xpRequired: 700,  title: 'Dispatch Commander',   unlocksTier: 3 },
  { level: 6, xpRequired: 1100, title: 'Grid Architect',       unlocksTier: 3 },
  { level: 7, xpRequired: 1600, title: 'Chief Strategist',     unlocksTier: 4 },
];

export function getLevelInfo(credits: number): LevelInfo {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (credits >= l.xpRequired) current = l;
    else break;
  }
  const next = LEVELS.find((l) => l.xpRequired > credits) ?? null;
  const progress = next
    ? (credits - current.xpRequired) / (next.xpRequired - current.xpRequired)
    : 1;
  return { ...current, next, progress };
}

export const MISSIONS: Mission[] = [
  // ─── TIER 1: FOUNDATION ───
  {
    id: 'OP-001',
    tier: 1,
    name: 'First Principles',
    payout: 80,
    brief:
      'A 330 kV transmission line connects Generator A to Load Center B. The line has a capacity of 500 MW. Load B demands 320 MW. A second load, C, sits downstream of B needing 150 MW. The B→C line has 200 MW capacity.',
    question: 'What is the minimum generation required at A to satisfy both loads?',
    diagram: {
      nodes: [
        { id: 'A', x: 80,  y: 100, label: 'GEN A',  type: 'generator' },
        { id: 'B', x: 280, y: 100, label: 'LOAD B', type: 'load', value: '320 MW' },
        { id: 'C', x: 480, y: 100, label: 'LOAD C', type: 'load', value: '150 MW' },
      ],
      edges: [
        { from: 'A', to: 'B', label: '500 MW' },
        { from: 'B', to: 'C', label: '200 MW' },
      ],
    },
    options: ['320 MW', '470 MW', '500 MW', '650 MW'],
    correctIndex: 1,
    explanation:
      'Both loads feed through A. Total: 320 + 150 = 470 MW. Line A→B (500 MW cap) and B→C (200 MW cap) both have sufficient capacity.',
  },
  {
    id: 'OP-002',
    tier: 1,
    name: 'Line Loss',
    payout: 80,
    brief:
      'A 200 km transmission line loses 3% per 100 km (compounding per segment). The load requires exactly 400 MW delivered.',
    question: 'How much power must be injected at the source? (nearest MW)',
    diagram: {
      nodes: [
        { id: 'S', x: 80,  y: 100, label: 'SOURCE', type: 'generator' },
        { id: 'L', x: 480, y: 100, label: 'LOAD',   type: 'load', value: '400 MW' },
      ],
      edges: [{ from: 'S', to: 'L', label: '200km · 3%/100km' }],
      annotation: 'Loss compounds per 100 km segment',
    },
    options: ['412 MW', '424 MW', '425 MW', '400 MW'],
    correctIndex: 2,
    explanation:
      'Source × 0.97 × 0.97 = 400 MW → Source = 400 / 0.9409 ≈ 425 MW.',
  },
  {
    id: 'OP-003',
    tier: 1,
    name: 'Load Balance',
    payout: 80,
    brief:
      'Gen X: 180 MW, Gen Y: 220 MW feed a bus. Loads: A = 120 MW, B = 150 MW, C = 90 MW.',
    question: 'What is the surplus or deficit at the bus?',
    diagram: {
      nodes: [
        { id: 'X',   x: 60,  y: 60,  label: 'GEN X',  type: 'generator', value: '180 MW' },
        { id: 'Y',   x: 60,  y: 150, label: 'GEN Y',  type: 'generator', value: '220 MW' },
        { id: 'BUS', x: 260, y: 105, label: 'BUS',    type: 'junction' },
        { id: 'A',   x: 460, y: 40,  label: 'LOAD A', type: 'load', value: '120 MW' },
        { id: 'B',   x: 460, y: 105, label: 'LOAD B', type: 'load', value: '150 MW' },
        { id: 'C',   x: 460, y: 170, label: 'LOAD C', type: 'load', value: '90 MW' },
      ],
      edges: [
        { from: 'X', to: 'BUS' },
        { from: 'Y', to: 'BUS' },
        { from: 'BUS', to: 'A' },
        { from: 'BUS', to: 'B' },
        { from: 'BUS', to: 'C' },
      ],
    },
    options: ['+40 MW surplus', '+60 MW surplus', '−40 MW deficit', 'Balanced (0)'],
    correctIndex: 0,
    explanation:
      'Generation: 180 + 220 = 400 MW. Load: 120 + 150 + 90 = 360 MW. Surplus = +40 MW.',
  },
  // ─── TIER 2: TACTICAL ───
  {
    id: 'OP-004',
    tier: 2,
    name: 'Ring Routing',
    payout: 200,
    brief:
      'Ring network A→B→C→D→A. Power flows A to C via two simultaneous paths. A→B: 300 MW, B→C: 250 MW, A→D: 200 MW, D→C: 350 MW.',
    question: 'Maximum power deliverable from A to C?',
    diagram: {
      nodes: [
        { id: 'A', x: 100, y: 50,  label: 'A (SRC)',  type: 'generator' },
        { id: 'B', x: 460, y: 50,  label: 'B',        type: 'junction' },
        { id: 'C', x: 460, y: 180, label: 'C (SINK)', type: 'load', value: '?' },
        { id: 'D', x: 100, y: 180, label: 'D',        type: 'junction' },
      ],
      edges: [
        { from: 'A', to: 'B', label: '300 MW' },
        { from: 'B', to: 'C', label: '250 MW' },
        { from: 'A', to: 'D', label: '200 MW' },
        { from: 'D', to: 'C', label: '350 MW' },
      ],
    },
    options: ['350 MW', '400 MW', '450 MW', '550 MW'],
    correctIndex: 2,
    explanation:
      'CW path: min(300,250) = 250. CCW path: min(200,350) = 200. Total: 450 MW.',
  },
  {
    id: 'OP-005',
    tier: 2,
    name: 'Transformer Sizing',
    payout: 200,
    brief:
      'Factory needs 2,400 kVA. Available identical transformers: 500, 750, 1000, 1500 kVA. 10% safety margin required (≥ 2,640 kVA).',
    question: 'Minimum configuration using identical units?',
    diagram: {
      nodes: [
        { id: 'G', x: 80,  y: 105, label: 'GRID',      type: 'generator' },
        { id: 'T', x: 280, y: 105, label: 'XFMR BANK', type: 'junction' },
        { id: 'F', x: 480, y: 105, label: 'FACTORY',   type: 'load', value: '2,400 kVA' },
      ],
      edges: [
        { from: 'G', to: 'T' },
        { from: 'T', to: 'F', label: '≥2,640 kVA' },
      ],
    },
    options: ['3 × 1000 kVA', '2 × 1500 kVA', '4 × 750 kVA', '6 × 500 kVA'],
    correctIndex: 1,
    explanation:
      'All options give ≥ 2,640 kVA, but 2 × 1500 = 3,000 kVA uses the fewest units.',
  },
  // ─── TIER 3: ADVANCED ───
  {
    id: 'OP-006',
    tier: 3,
    name: 'Cascade Failure',
    payout: 400,
    brief:
      '5 parallel lines at 100 MW each carry 420 MW (84 MW/line). Line 3 trips. Load redistributes equally. Overloaded lines trip instantly.',
    question: 'What is the final grid state?',
    diagram: {
      nodes: [
        { id: 'S', x: 80,  y: 105, label: 'SOURCE', type: 'generator' },
        { id: 'L', x: 480, y: 105, label: 'LOAD',   type: 'load', value: '420 MW' },
      ],
      edges: [{ from: 'S', to: 'L', label: '5 × 100 MW lines' }],
      annotation: 'Overloaded lines trip instantly · Equal redistribution',
    },
    options: [
      '4 lines hold at 105 MW — stable',
      'Total blackout — all cascade-trip',
      '3 lines at 140 MW — partial',
      '4 lines — 20 MW load shed',
    ],
    correctIndex: 1,
    explanation:
      '420 ÷ 4 = 105 MW each → all exceed 100 MW → all trip → blackout.',
  },
  {
    id: 'OP-007',
    tier: 3,
    name: 'Economic Dispatch',
    payout: 400,
    brief:
      'Dispatch 500 MW at minimum cost. Gen A: $20/MW max 300. Gen B: $35/MW max 250. Gen C: $50/MW max 200.',
    question: 'What is the minimum cost dispatch?',
    diagram: {
      nodes: [
        { id: 'A',   x: 70,  y: 50,  label: 'GEN A', type: 'generator', value: '$20/MW · 300' },
        { id: 'B',   x: 70,  y: 120, label: 'GEN B', type: 'generator', value: '$35/MW · 250' },
        { id: 'C',   x: 70,  y: 190, label: 'GEN C', type: 'generator', value: '$50/MW · 200' },
        { id: 'BUS', x: 300, y: 120, label: 'BUS',   type: 'junction' },
        { id: 'L',   x: 490, y: 120, label: 'LOAD',  type: 'load', value: '500 MW' },
      ],
      edges: [
        { from: 'A', to: 'BUS' },
        { from: 'B', to: 'BUS' },
        { from: 'C', to: 'BUS' },
        { from: 'BUS', to: 'L' },
      ],
    },
    options: ['$13,000', '$17,500', '$15,750', '$13,500'],
    correctIndex: 0,
    explanation:
      'Cheapest first: A = 300 × $20 = $6,000. B = 200 × $35 = $7,000. Total = $13,000.',
  },
  // ─── TIER 4: SPECIALIST ───
  {
    id: 'OP-008',
    tier: 4,
    name: 'N-1 Contingency',
    payout: 800,
    brief:
      '3 transformers at 80 MVA each. N-1 standard: survive loss of any one. Peak load: 200 MVA.',
    question: 'Max safe continuous load under N-1?',
    diagram: {
      nodes: [
        { id: 'T1', x: 70,  y: 50,  label: 'XFMR 1', type: 'generator', value: '80 MVA' },
        { id: 'T2', x: 70,  y: 120, label: 'XFMR 2', type: 'generator', value: '80 MVA' },
        { id: 'T3', x: 70,  y: 190, label: 'XFMR 3', type: 'generator', value: '80 MVA' },
        { id: 'S',  x: 310, y: 120, label: 'SUB',     type: 'junction' },
        { id: 'L',  x: 490, y: 120, label: 'PEAK',    type: 'load', value: '200 MVA' },
      ],
      edges: [
        { from: 'T1', to: 'S' },
        { from: 'T2', to: 'S' },
        { from: 'T3', to: 'S' },
        { from: 'S', to: 'L' },
      ],
    },
    options: [
      '160 MVA — cannot serve peak',
      '240 MVA — can serve peak',
      '80 MVA — cannot serve',
      '200 MVA — exact match',
    ],
    correctIndex: 0,
    explanation:
      'N-1: lose one → 2 × 80 = 160 MVA. Peak 200 exceeds this. Max safe = 160 MVA.',
  },
];
