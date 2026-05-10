import type { SVGProps } from 'react';

/**
 * Brand "cell" illustration — a 3×3 grid of separated squares with the
 * L-quadrant lit (top row × 3 + mid-left × 1), each lit cell carrying a
 * small inner dot. Mirrors `GridLogoIcon` but blown up for hero-card use.
 *
 * The `marker` prop chooses which lit cell is rendered in vermillion
 * (the others use ink); the muted cells stay outline-only at 35 %
 * opacity. Use it as a small piece of brand iconography next to a
 * "next up" / "you're here" card.
 *
 *   - `marker="self"` (default) — mid-left, the operator's current spot
 *   - `marker="leader"`         — top-left, the start of a sequence
 *   - `marker="next"`           — top-right, the next milestone ahead
 *
 * Three accent positions cover the editorial-narrative cases without
 * letting callers paint arbitrary cells; the constraint keeps the brand
 * recognisable across surfaces.
 */
export type BrandCellMarker = 'self' | 'leader' | 'next';

interface BrandCellProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number;
  marker?: BrandCellMarker;
  /**
   * Mono mode paints every lit cell in `currentColor` and drops the
   * vermillion accent — for surfaces that already carry a dynamic colour
   * (tier accents, white-on-vermillion mastheads, dark-bg comparison
   * panels) where the brand cell needs to inherit the parent's tone.
   */
  mono?: boolean;
}

// Coordinates for the four "lit" cells in a 100×100 viewBox: top-left,
// top-mid, top-right, mid-left. The marker chooses which gets vermillion.
const LIT_POSITIONS = [
  { id: 'top-left', x: 12, y: 12 },
  { id: 'top-mid', x: 39, y: 12 },
  { id: 'top-right', x: 66, y: 12 },
  { id: 'mid-left', x: 12, y: 39 },
] as const;

const MARKER_TO_LIT_ID: Record<BrandCellMarker, (typeof LIT_POSITIONS)[number]['id']> = {
  self: 'mid-left',
  leader: 'top-left',
  next: 'top-right',
};

// Five outline-only muted cells fill the rest of the 3×3 grid.
const MUTED_POSITIONS = [
  { x: 39, y: 39 },
  { x: 66, y: 39 },
  { x: 12, y: 66 },
  { x: 39, y: 66 },
  { x: 66, y: 66 },
] as const;

export function BrandCell({
  size = 96,
  marker = 'self',
  mono = false,
  className = 'shrink-0',
  ...rest
}: BrandCellProps) {
  const accentId = MARKER_TO_LIT_ID[marker];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {LIT_POSITIONS.map((pos) => {
        const isAccent = pos.id === accentId;
        if (mono) {
          // Mono: outline + inner solid block, all in currentColor — the
          // editorial accent isn't useful when the parent is already
          // tinting the mark (tier accent, white-on-vermillion, etc.).
          return (
            <g key={pos.id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={22}
                height={22}
                stroke="currentColor"
                strokeWidth={2}
                fill="none"
              />
              <rect
                x={pos.x + 5}
                y={pos.y + 5}
                width={12}
                height={12}
                fill="currentColor"
              />
            </g>
          );
        }
        return (
          <g key={pos.id}>
            <rect
              x={pos.x}
              y={pos.y}
              width={22}
              height={22}
              className={
                isAccent
                  ? 'fill-primary stroke-primary'
                  : 'fill-on-surface stroke-on-surface'
              }
              strokeWidth={2}
            />
            <rect
              x={pos.x + 8}
              y={pos.y + 8}
              width={6}
              height={6}
              className="fill-surface"
            />
          </g>
        );
      })}
      <g
        className={mono ? undefined : 'stroke-on-surface'}
        stroke={mono ? 'currentColor' : undefined}
        strokeWidth={2}
        opacity="0.35"
        fill="none"
      >
        {MUTED_POSITIONS.map((pos) => (
          <rect key={`${pos.x}-${pos.y}`} x={pos.x} y={pos.y} width={22} height={22} />
        ))}
      </g>
    </svg>
  );
}
