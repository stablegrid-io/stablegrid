type LogoSize = 'sm' | 'md' | 'lg';

interface StableGridIconProps {
  size?: LogoSize;
  className?: string;
}

interface StableGridWordmarkProps {
  size?: LogoSize;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
}

const iconSizeClassMap: Record<LogoSize, string> = {
  sm: 'h-7 w-7 rounded-2xl',
  md: 'h-9 w-9 rounded-2xl',
  lg: 'h-10 w-10 rounded-2xl'
};

const glyphSizeClassMap: Record<LogoSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-5 w-5'
};

const titleSizeClassMap: Record<LogoSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-[28px]'
};

export function StableGridIcon({ size = 'md', className = '' }: StableGridIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center bg-gradient-to-br from-[#1d2634] to-[#121924] text-brand-300 shadow-[0_0_0_1px_rgba(148,163,184,0.28),0_10px_22px_-14px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] ${iconSizeClassMap[size]} ${className}`.trim()}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={glyphSizeClassMap[size]}
      >
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
  size = 'md',
  className = '',
  iconClassName = '',
  titleClassName = '',
  subtitle,
  subtitleClassName = ''
}: StableGridWordmarkProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <StableGridIcon size={size} className={iconClassName} />
      <span className="leading-none">
        <span
          className={`block font-semibold tracking-tight ${titleSizeClassMap[size]} ${titleClassName}`.trim()}
        >
          stableGrid.io
        </span>
        {subtitle ? (
          <span className={`mt-1 block text-xs ${subtitleClassName}`.trim()}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
