import { forwardRef, type SVGProps } from 'react';

interface GridLogoIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

/**
 * Stablegrid brand mark — 3×3 grid with the L-quadrant lit (top row + mid-left).
 * Mirrors the lucide-react icon API so it can drop into navigation-config.ts.
 */
export const GridLogoIcon = forwardRef<SVGSVGElement, GridLogoIconProps>(
  ({ size = 24, strokeWidth = 7, color = 'currentColor', className, ...rest }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {/* L-quadrant — lit cells: top row + mid-left */}
      <rect x="12" y="12" width="22" height="22" rx="3" />
      <rect x="20" y="20" width="6" height="6" rx="1" fill={color} stroke="none" />
      <rect x="39" y="12" width="22" height="22" rx="3" />
      <rect x="47" y="20" width="6" height="6" rx="1" fill={color} stroke="none" />
      <rect x="66" y="12" width="22" height="22" rx="3" />
      <rect x="74" y="20" width="6" height="6" rx="1" fill={color} stroke="none" />
      <rect x="12" y="39" width="22" height="22" rx="3" />
      <rect x="20" y="47" width="6" height="6" rx="1" fill={color} stroke="none" />
      {/* Muted cells — outline only, lighter */}
      <g opacity="0.4">
        <rect x="39" y="39" width="22" height="22" rx="3" />
        <rect x="66" y="39" width="22" height="22" rx="3" />
        <rect x="12" y="66" width="22" height="22" rx="3" />
        <rect x="39" y="66" width="22" height="22" rx="3" />
        <rect x="66" y="66" width="22" height="22" rx="3" />
      </g>
    </svg>
  ),
);

GridLogoIcon.displayName = 'GridLogoIcon';
