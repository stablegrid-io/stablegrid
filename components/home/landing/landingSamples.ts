/**
 * Landing-page sample data — kept in one place so the desktop and mobile
 * landings render the same task preview and grid-component asset list
 * without drifting. Both landings import from here.
 */

// Mid-tier sample practice task — investigative ("diagnose the bug") rather
// than transformative, which reads better as a 30-second MCQ preview than a
// step-by-step coding recipe.
export const SAMPLE_TASK = {
  setTitle: 'Practice Set 5 — Delta Lake for Data Engineering',
  tier: 'MID · DELTA LAKE',
  taskNumber: '03 / 06',
  title: 'Diagnose Missing Data Using Time Travel',
  context:
    "NordGrid's billing team reports yesterday's Gold summary shows 15% lower total consumption for NORTH_COAST. Engineers suspect a MERGE corrupted the Silver Delta table.",
  task:
    "Find the version number to compare against, then read the table as it was before yesterday's MERGE.",
  question:
    'Which command surfaces the version numbers and operation history you need to pick a comparison point?',
  options: [
    { id: 'a', label: 'DESCRIBE EXTENDED silver.meter_readings' },
    { id: 'b', label: 'DESCRIBE HISTORY silver.meter_readings', isCorrect: true },
    { id: 'c', label: 'SHOW TBLPROPERTIES silver.meter_readings' },
    { id: 'd', label: 'DESCRIBE silver.meter_readings VERSION AS OF YESTERDAY' }
  ],
  explanation:
    "DESCRIBE HISTORY is the Delta-native way to list every commit on a table with its version, timestamp, and the operation that produced it — exactly what you need before reading versionAsOf."
} as const;

// Grid game asset gallery — mirrors the in-game Component Catalog so the
// landing visitor sees the actual rendered substations they'll deploy.
// Each entry binds the asset to the chapter that teaches the engineering
// idea behind it — hovering a card reveals that bind on the landing page.
export const GRID_COMPONENTS = [
  {
    src: '/grid/components/primary-substation.jpg',
    name: 'Primary Substation',
    category: 'BACKBONE',
    cost: 250,
    chapter: 'PS3 · DataFrames & Schemas',
    blurb:
      "Where high-voltage transmission steps down to a district feeder. In code, where raw landing rows acquire a schema and become a DataFrame you can actually query."
  },
  {
    src: '/grid/components/power-transformer.jpg',
    name: 'Power Transformer',
    category: 'BACKBONE',
    cost: 375,
    chapter: 'PS4 · Selecting & Filtering',
    blurb:
      "Voltage matched to local load. In code, columns matched to questions — the operator you reach for to shrink, shape, and route data toward whoever needs it."
  },
  {
    src: '/grid/components/protective-relay.jpg',
    name: 'Protective Relay',
    category: 'PROTECTION',
    cost: 800,
    chapter: 'PM4 · Validation & Bad Data',
    blurb:
      "Trips faulted lines before damage cascades. In code, the schema enforcement and null/dup guards that stop one bad CSV from corrupting the whole pipeline."
  },
  {
    src: '/grid/components/battery-storage-unit.jpg',
    name: 'Battery Storage',
    category: 'STORAGE',
    cost: 1200,
    chapter: 'PM5 · Delta Lake',
    blurb:
      "Holds energy until peak demand. Delta holds state — ACID writes, time travel, MERGE — so yesterday's pipeline run is still queryable tomorrow."
  },
  {
    src: '/grid/components/capacitor-bank.jpg',
    name: 'Capacitor Bank',
    category: 'BALANCING',
    cost: 450,
    chapter: 'PM2 · Window Functions',
    blurb:
      "Corrects reactive power so the grid stays in phase. Window functions correct row-by-row context so totals, ranks, and rolling sums stay in step with the data."
  },
  {
    src: '/grid/components/circuit-breaker-bank.jpg',
    name: 'Circuit Breaker',
    category: 'PROTECTION',
    cost: 320,
    chapter: 'PS9 · Error Handling',
    blurb:
      "Opens the moment a fault is detected. In code, the try/except, checkpoint, and dead-letter routing that isolate one bad batch from the next."
  },
  {
    src: '/grid/components/control-center.jpg',
    name: 'Control Center',
    category: 'COMMAND',
    cost: 2400,
    chapter: 'PX3 · Spark UI & Tuning',
    blurb:
      "The mimic board operators read in real time. The Spark UI is yours — stage timelines, executor heatmaps, SQL DAGs — once you know how to read it."
  },
  {
    src: '/grid/components/smart-inverter.jpg',
    name: 'Smart Inverter',
    category: 'BALANCING',
    cost: 680,
    chapter: 'PX1 · Catalyst & AQE',
    blurb:
      "Converts DC to AC on the fly, optimising for whatever the grid needs. Adaptive Query Execution rewrites your plan at runtime for the data it actually sees."
  },
  {
    src: '/grid/components/solar-array.jpg',
    name: 'Solar Array',
    category: 'GENERATION',
    cost: 950,
    chapter: 'PM7 · Streaming',
    blurb:
      "Generates power as long as the source flows. Structured Streaming treats the source the same way — every micro-batch a new arrival on the same pipeline."
  },
  {
    src: '/grid/components/wind-turbine-cluster.jpg',
    name: 'Wind Cluster',
    category: 'GENERATION',
    cost: 1100,
    chapter: 'PX5 · Partitioning & Skew',
    blurb:
      "Many small generators, one combined output. Many small partitions, one combined job — but only if the wind is even. Skew is what wrecks both."
  }
] as const;
