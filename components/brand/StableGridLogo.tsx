interface StableGridBrandProps {
  className?: string;
}

export function StableGridBrand({ className = '' }: StableGridBrandProps) {
  return (
    <span className={`font-headline font-black text-[#99f7ff] tracking-widest ${className}`}>
      stableGrid
    </span>
  );
}

// Backward-compatible exports for existing code

interface StableGridIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StableGridIcon({ size = 'md', className = '' }: StableGridIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 bg-surface-container border border-primary/30 text-primary ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M2.5 12h4.2l1.7-4.5 3.2 9 1.7-4.5h8.2"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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
