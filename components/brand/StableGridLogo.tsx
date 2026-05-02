import type { CSSProperties } from 'react';

interface StableGridBrandProps {
  className?: string;
}

export function StableGridBrand({ className = '' }: StableGridBrandProps) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold text-on-surface lowercase ${className}`} style={{ letterSpacing: '-0.035em' }}>
      <StableGridMark className="h-[1.2em] w-[1.2em] shrink-0" />
      <span>
        stable<span style={{ color: '#E8B14F' }}>grid</span><span className="text-on-surface-variant">.io</span>
      </span>
    </span>
  );
}

// Backward-compatible exports for existing code

interface StableGridIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ICON_SIZE_MAP: Record<NonNullable<StableGridIconProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function StableGridMark({
  className = '',
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* L-quadrant — active cells: top row + left column */}
      <rect x="15" y="15" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <rect x="19" y="19" width="14" height="14" rx="2" fill="currentColor" />
      <rect x="41" y="15" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <rect x="45" y="19" width="14" height="14" rx="2" fill="currentColor" />
      <rect x="67" y="15" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <rect x="71" y="19" width="14" height="14" rx="2" fill="currentColor" />
      <rect x="15" y="41" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <rect x="19" y="45" width="14" height="14" rx="2" fill="currentColor" />
      {/* Muted cells — outline only */}
      <rect x="41" y="41" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.45" />
      <rect x="67" y="41" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.45" />
      <rect x="15" y="67" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.45" />
      <rect x="41" y="67" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.45" />
      <rect x="67" y="67" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.45" />
    </svg>
  );
}

export function StableGridIcon({ size = 'md', className = '' }: StableGridIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 bg-surface-container border border-primary/30 text-primary ${className}`}
      aria-hidden="true"
    >
      <StableGridMark className={ICON_SIZE_MAP[size]} />
    </span>
  );
}

export function StableGridWordmark({
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
}) {
  return <StableGridBrand className={className} />;
}
