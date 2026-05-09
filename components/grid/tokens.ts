import type { ComponentCategory } from '@/types/grid';

// Editorial Engineering palette — cream paper + ink. Hex values mirror the
// tailwind config so inline styles, 3D canvas materials, and analytics
// annotations stay in sync with utility classes.
export const PAPER_CREAM = '#fdf9f0'; // bg-surface
export const PAPER_LOW = '#f7f3ea'; // surface-container-low
export const PAPER = '#f1eee5'; // surface-container
export const PAPER_HIGH = '#ece8df'; // surface-container-high
export const PAPER_DIM = '#dddad1'; // surface-dim
export const INK = '#1c1c16'; // on-surface
export const INK_VARIANT = '#594139'; // on-surface-variant
export const INK_OUTLINE = '#8d7167'; // outline (warm taupe)
export const VERMILLION = '#a33800'; // primary

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

// Component category colors. Each category gets a distinct editorial ink
// shade — readable on cream, distinguishable side-by-side, no neon screams.
export const CATEGORY_COLOR: Record<ComponentCategory, string> = {
  command: '#1c1c16', // ink — top of hierarchy
  backbone: '#594139', // burnt umber
  protection: '#a33800', // vermillion (alarm/safety)
  generation: '#5d5c57', // tertiary brown-grey
  storage: '#8d7167', // outline taupe
  balancing: '#370d00' // deepest ink (on-primary-fixed)
};
