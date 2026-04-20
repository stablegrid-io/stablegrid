import { forwardRef, type SVGProps } from 'react';

interface SubstationIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

/**
 * High-voltage transmission pylon — reads as "330 kV substation".
 * Matches the shape API of lucide-react icons so it can drop into navigation-config.ts.
 */
export const SubstationIcon = forwardRef<SVGSVGElement, SubstationIconProps>(
  ({ size = 24, strokeWidth = 1.8, color = 'currentColor', className, ...rest }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {/* Top cross-arm with three insulator drops */}
      <path d="M4 6h16" />
      <path d="M8 6v2.5" />
      <path d="M12 6v2.5" />
      <path d="M16 6v2.5" />
      {/* Pylon frame — widening toward the base */}
      <path d="M10 6 L6 21" />
      <path d="M14 6 L18 21" />
      {/* Mid lattice brace */}
      <path d="M8 13 L16 13" />
      {/* Base rail */}
      <path d="M5 21h14" />
    </svg>
  ),
);

SubstationIcon.displayName = 'SubstationIcon';
