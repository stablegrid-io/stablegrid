import type { ComponentCategory } from '@/types/grid';

// Editorial Engineering palette — DARK canvas. Hex values mirror the tailwind
// config so inline styles, 3D canvas materials, and analytics annotations stay
// in sync with utility classes.
// Note: legacy const names kept (PAPER_*, INK, VERMILLION) so existing imports
// don't break — values now point at the dark editorial palette.
export const PAPER_CREAM = '#14140f'; // bg-surface (dark canvas)
export const PAPER_LOW = '#1c1c16'; // surface-container-low
export const PAPER = '#20201a'; // surface-container
export const PAPER_HIGH = '#2b2a24'; // surface-container-high
export const PAPER_DIM = '#36352f'; // surface-dim / surface-variant
export const INK = '#e6e2d9'; // on-surface (cream)
export const INK_VARIANT = '#e1bfb4'; // on-surface-variant
export const INK_OUTLINE = '#a88a80'; // outline (warm taupe, lifted for dark)
export const VERMILLION = '#e25a1c'; // Spark accent

// Legacy aliases kept so existing imports keep working — values now point at
// editorial neutrals instead of the old dark-cyan dispatch palette.
export const PANEL_BG = PAPER_LOW;
export const PANEL_BORDER = PAPER_DIM;
export const PANEL_BORDER_HOVER = INK;
export const TEXT_PRIMARY = INK;
export const TEXT_SECONDARY = INK_VARIANT;
export const TEXT_TERTIARY = INK_OUTLINE;
export const TEXT_DISABLED = PAPER_DIM;
// Re-routed from cyan to vermillion so any remaining BRAND_CYAN sites are
// editorial-correct without a sweep.
export const BRAND_CYAN = VERMILLION;

// Component category colors — muted printing-ink hues that stay editorial on
// cream paper but are clearly distinguishable from one another. Each category
// gets a different *family* (red / green / blue / yellow / brown / black)
// rather than six shades of the same brown, so the legend reads at a glance.
export const CATEGORY_COLOR: Record<ComponentCategory, string> = {
  command: '#e6e2d9',    // cream — authority / control center (was ink black)
  backbone: '#c97a6e',   // lifted oxblood — heavy structural infrastructure
  protection: '#e25a1c', // Spark — alarm / safety (the primary accent)
  generation: '#7a9fc7', // lifted prussian blue — generation (sun/wind)
  storage: '#d4a83a',    // lifted mustard ochre — stored energy reserves
  balancing: '#8aaf85'   // lifted forest green — equilibrium / balancing
};
