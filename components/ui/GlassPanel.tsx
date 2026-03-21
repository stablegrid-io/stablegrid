import type { ReactNode } from 'react';

type AccentColor = 'primary' | 'secondary' | 'tertiary' | 'error';

const borderColorMap: Record<AccentColor, string> = {
  primary: 'border-primary/10 hover:border-primary/30',
  secondary: 'border-secondary/10 hover:border-secondary/30',
  tertiary: 'border-tertiary/10 hover:border-tertiary/30',
  error: 'border-error/10 hover:border-error/30',
};

interface GlassPanelProps {
  accentColor?: AccentColor;
  hover?: boolean;
  className?: string;
  children: ReactNode;
}

export function GlassPanel({
  accentColor = 'primary',
  hover = true,
  className = '',
  children,
}: GlassPanelProps) {
  const borderClasses = borderColorMap[accentColor];
  const appliedBorder = hover ? borderClasses : borderClasses.split(' ')[0];

  return (
    <div className={`glass-panel border ${appliedBorder} p-8 relative overflow-hidden transition-all ${className}`}>
      {children}
    </div>
  );
}
