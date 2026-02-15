export type MissionDifficulty = 'Medium' | 'Hard' | 'Expert';

export interface MissionDefinition {
  slug: string;
  codename: string;
  icon: string;
  status: 'available' | 'locked';
  completed: boolean;
  difficulty: MissionDifficulty;
  duration: string;
  location: string;
  xp: number;
  tagline: string;
  accentColor: string;
  accentRgb: string;
  stakes: string;
  summary: string;
  skills: string[];
  rewardBadge: string;
  rewardTitle: string;
  workspaceTaskId?: string;
}

export const MISSIONS: MissionDefinition[] = [
  {
    slug: 'blackout-berlin',
    codename: 'BLACKOUT BERLIN',
    icon: '⚡',
    status: 'available',
    completed: false,
    difficulty: 'Hard',
    duration: '90 min',
    location: 'Berlin',
    xp: 2400,
    tagline: '340,000 households. 6 hours to prevent the second wave.',
    accentColor: '#ef4444',
    accentRgb: '239,68,68',
    stakes: '847M ghost events, partition skew, 340k households affected.',
    summary:
      'A rogue transformer floods the platform with ghost events. You identify the hot partition, apply salting, and stabilize real-time visibility before the second cascade.',
    skills: ['Data skew', 'Salting', 'Kafka filtering'],
    rewardBadge: 'Grid Guardian',
    rewardTitle: 'Senior Grid Analyst',
    workspaceTaskId: 'wind-farm-downtime'
  },
  {
    slug: 'solar-surge',
    codename: 'SOLAR SURGE',
    icon: '☀️',
    status: 'available',
    completed: true,
    difficulty: 'Medium',
    duration: '75 min',
    location: 'Spain',
    xp: 1800,
    tagline: "Overproduction in a clear-sky event. The grid can't absorb it.",
    accentColor: '#f59e0b',
    accentRgb: '245,158,11',
    stakes: 'Overproduction risk and export threshold trip window under 2h.',
    summary:
      'A solar site is overproducing past grid export limits. You investigate historical irradiance and issue a load-shedding recommendation before breaker trip.',
    skills: ['Windowing', 'Pandas vectorization', 'SQL aggregates'],
    rewardBadge: 'Grid Sentinel',
    rewardTitle: 'Data Engineer'
  },
  {
    slug: 'battery-arbitrage-texas',
    codename: 'BATTERY ARBITRAGE',
    icon: '🔋',
    status: 'available',
    completed: true,
    difficulty: 'Medium',
    duration: '60 min',
    location: 'Texas',
    xp: 1400,
    tagline: '$5,000/MWh. 12 battery sites. 90 minutes to decide.',
    accentColor: '#10b981',
    accentRgb: '16,185,129',
    stakes: '$5,000/MWh spike with 12 battery sites and 90-minute decision horizon.',
    summary:
      'Market prices spike and storage dispatch windows collapse. You rank discharge plans and optimize expected revenue with hard operational constraints.',
    skills: ['Ranking windows', 'SQL optimization', 'Dispatch logic'],
    rewardBadge: 'Dispatch Specialist',
    rewardTitle: 'Data Engineer'
  },
  {
    slug: 'data-tsunami-tokyo',
    codename: 'DATA TSUNAMI',
    icon: '🌊',
    status: 'available',
    completed: false,
    difficulty: 'Hard',
    duration: '90 min',
    location: 'Tokyo',
    xp: 2200,
    tagline: '65M events per minute. The consumer group is drowning.',
    accentColor: '#6b7fff',
    accentRgb: '107,127,255',
    stakes: '65M events/minute, lag climbing, operations visibility at risk.',
    summary:
      'A typhoon-triggered telemetry storm overloads ingestion. You redesign consumer topology and streaming watermarking to recover acceptable lag.',
    skills: ['Consumer groups', 'Watermarking', 'Checkpoint recovery'],
    rewardBadge: 'Stream Stabilizer',
    rewardTitle: 'Senior Data Engineer'
  },
  {
    slug: 'wind-drought',
    codename: 'WIND DROUGHT',
    icon: '💨',
    status: 'available',
    completed: false,
    difficulty: 'Expert',
    duration: '120 min',
    location: 'North Sea / UK',
    xp: 3200,
    tagline: 'Two weeks of still air. 43% of UK supply at risk.',
    accentColor: '#8b5cf6',
    accentRgb: '139,92,246',
    stakes: 'Two-week low wind period threatens 43% supply dependency.',
    summary:
      'Extended low-wind conditions stress UK balancing capacity. You model storage coverage and compute discharge sequencing across a multi-site battery fleet.',
    skills: ['Optimization', 'Delta MERGE', 'Spark streaming'],
    rewardBadge: 'Grid Strategist',
    rewardTitle: 'Grid Analyst'
  },
  {
    slug: 'missing-megawatts',
    codename: 'MISSING MEGAWATTS',
    icon: '🌍',
    status: 'locked',
    completed: false,
    difficulty: 'Hard',
    duration: '105 min',
    location: 'Germany',
    xp: 2600,
    tagline: '3.2 GW unaccounted for. One bad schema migration.',
    accentColor: '#ec4899',
    accentRgb: '236,72,153',
    stakes: '3.2GW reporting gap tied to a long-tail schema migration defect.',
    summary:
      'A generation-consumption gap appears in production metrics. You eliminate false causes and trace the mismatch to a unit-conversion regression.',
    skills: ['Data quality', 'Schema evolution', 'Delta time travel'],
    rewardBadge: 'Forensic Operator',
    rewardTitle: 'Senior Grid Analyst'
  },
  {
    slug: 'winter-demand-shock',
    codename: 'WINTER DEMAND SHOCK',
    icon: '❄️',
    status: 'locked',
    completed: false,
    difficulty: 'Expert',
    duration: '120 min',
    location: 'Norway',
    xp: 3400,
    tagline: 'Cold snap hit two weeks early. Rebuild the forecast now.',
    accentColor: '#60a5fa',
    accentRgb: '96,165,250',
    stakes: '40% overnight demand spike and hydro dispatch recalculation.',
    summary:
      'Unexpected cold weather invalidates demand planning. You rebuild a 72-hour forecast and produce a revised hydro dispatch schedule.',
    skills: ['Spark ML', 'Feature engineering', 'Time series'],
    rewardBadge: 'Winter Command',
    rewardTitle: 'Grid Intelligence Lead'
  },
  {
    slug: 'phantom-load',
    codename: 'PHANTOM LOAD',
    icon: '👻',
    status: 'locked',
    completed: false,
    difficulty: 'Medium',
    duration: '70 min',
    location: 'São Paulo',
    xp: 1600,
    tagline: '14,000 kWh appear every night. Nobody scheduled them.',
    accentColor: '#a3e635',
    accentRgb: '163,230,53',
    stakes: 'Nightly phantom consumption appears with no dispatch schedule.',
    summary:
      'A recurring load signature appears outside any known schedule. You isolate anomalies and confirm whether telemetry drift or fraud is responsible.',
    skills: ['SQL', 'Python', 'Anomaly detection'],
    rewardBadge: 'Night Shift Detective',
    rewardTitle: 'Grid Analyst'
  }
];
