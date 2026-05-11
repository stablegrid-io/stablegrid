import { forwardRef, type SVGProps } from 'react';

interface GridLogoIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

/**
 * Stablegrid brand mark for the nav rail — mirrors the BrandCell pattern
 * (3×3 grid, L-quadrant lit, smaller inner block per lit cell) but rendered
 * monochrome via `currentColor` so it inherits the nav item's active/inactive
 * text colour. Shape and proportions match the editorial BrandCell used on
 * landing/footer/favicon; this keeps a single recognisable mark across
 * marketing, app chrome, and the bottom nav.
 */
export const GridLogoIcon = forwardRef<SVGSVGElement, GridLogoIconProps>(
  ({ size = 24, color = 'currentColor', className, ...rest }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {/* Lit cells — top row + mid-left. Outline + inner filled block,
          matching BrandCell mono. */}
      {[
        { x: 12, y: 12 },
        { x: 39, y: 12 },
        { x: 66, y: 12 },
        { x: 12, y: 39 },
      ].map((pos) => (
        <g key={`${pos.x}-${pos.y}`}>
          <rect
            x={pos.x}
            y={pos.y}
            width={22}
            height={22}
            stroke={color}
            strokeWidth={2}
            fill="none"
          />
          <rect
            x={pos.x + 5}
            y={pos.y + 5}
            width={12}
            height={12}
            fill={color}
          />
        </g>
      ))}
      {/* Muted cells — outline only at 35% opacity */}
      <g stroke={color} strokeWidth={2} strokeOpacity={0.35} fill="none">
        <rect x={39} y={39} width={22} height={22} />
        <rect x={66} y={39} width={22} height={22} />
        <rect x={12} y={66} width={22} height={22} />
        <rect x={39} y={66} width={22} height={22} />
        <rect x={66} y={66} width={22} height={22} />
      </g>
    </svg>
  ),
);

GridLogoIcon.displayName = 'GridLogoIcon';
