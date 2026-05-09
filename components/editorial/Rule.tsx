interface RuleProps {
  variant?: 'hair' | 'thick' | 'double';
  className?: string;
}

/**
 * Editorial divider — replaces decorative borders + drop-shadows. Hairline by
 * default; `thick` for major section breaks; `double` for kicker-style header
 * separators (two stacked hairlines with a gap, mimicking newspaper
 * masthead rules).
 */
export function Rule({ variant = 'hair', className = '' }: RuleProps) {
  if (variant === 'double') {
    return (
      <div role="separator" aria-orientation="horizontal" className={className}>
        <div className="h-px w-full bg-rule" />
        <div className="h-[2px]" />
        <div className="h-px w-full bg-rule" />
      </div>
    );
  }

  return (
    <hr
      role="separator"
      className={`m-0 w-full border-0 ${variant === 'thick' ? 'h-[2px] bg-rule' : 'h-px bg-rule'} ${className}`}
    />
  );
}
