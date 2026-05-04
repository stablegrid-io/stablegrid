/**
 * "How we compare" data for the landing page section that sits just before
 * the FAQ. Compares StableGrid against the four most-recognized data-engineering
 * ed-tech platforms.
 *
 * Authoring rules
 * ────────────────
 * Be conservative. Each cell asserts something verifiable about a competitor's
 * catalog as of 2026-05. If a competitor's product changes, update the row
 * rather than leave a stale claim in front of users.
 *
 * Don't paint StableGrid as universally better. Real differentiators belong
 * here — places where we share ground with competitors should still show
 * their checks. The first two rows below describe basics every credible
 * platform meets; the bottom rows describe what's actually distinctive about
 * StableGrid.
 */

export interface ComparisonCompetitor {
  name: string;
  /** Short pricing label rendered at the bottom of the column. */
  price: string;
  /**
   * Path to a monochrome SVG logo (`fill="currentColor"`) under
   * `/public/brand/`. Rendered next to the competitor's name in the column
   * header; inherits the muted column-header text color so it doesn't fight
   * the design.
   */
  logo: string;
}

export interface ComparisonFeature {
  /** The feature label rendered next to StableGrid's green tick. */
  label: string;
  /** Per-competitor support, in the same order as `COMPARISON_COMPETITORS`. */
  competitors: readonly boolean[];
}

export const COMPARISON_COMPETITORS: readonly ComparisonCompetitor[] = [
  { name: 'DataCamp', price: '€25/mo', logo: '/brand/datacamp-logo.svg' },
  { name: 'Coursera', price: '€59/mo', logo: '/brand/coursera-logo.svg' },
  { name: 'Udemy', price: '€15/course', logo: '/brand/udemy-logo.svg' },
  { name: 'Pluralsight', price: '€29/mo', logo: '/brand/pluralsight-logo.svg' },
];

export const COMPARISON_FEATURES: readonly ComparisonFeature[] = [
  // Baseline — every credible data-engineering platform clears these.
  // All five columns get a tick so the table starts on shared ground.
  {
    label: 'Self-paced lessons',
    competitors: [true, true, true, true],
  },
  {
    label: 'Covers PySpark, SQL & Python',
    competitors: [true, true, true, true],
  },
  {
    label: 'Progress & completion tracking',
    competitors: [true, true, true, true],
  },
  // Where StableGrid actually differs.
  {
    label: 'Junior → Mid → Senior tier ladder',
    competitors: [false, false, false, false],
  },
  {
    label: 'Read-and-diagnose recognition tracks',
    competitors: [false, false, false, false],
  },
  {
    label: 'Saulėgrid simulator · kWh economy',
    competitors: [false, false, false, false],
  },
];

/** StableGrid's price label rendered on the highlighted card. */
export const COMPARISON_STABLEGRID_PRICE = 'Free';
