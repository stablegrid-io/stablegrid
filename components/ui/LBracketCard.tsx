import type { ReactNode } from 'react';

interface LBracketCardProps {
  corners?: 'diagonal' | 'all';
  className?: string;
  children: ReactNode;
}

export function LBracketCard({
  corners = 'diagonal',
  className = '',
  children,
}: LBracketCardProps) {
  if (corners === 'all') {
    return (
      <div className={`bg-surface-container-low/40 backdrop-blur-md p-6 border border-white/5 relative overflow-hidden ${className}`}>
        <span className="l-corner l-corner-tl" />
        <span className="l-corner l-corner-tr" />
        <span className="l-corner l-corner-bl" />
        <span className="l-corner l-corner-br" />
        {children}
      </div>
    );
  }

  return (
    <div className={`bg-surface-container-low/40 backdrop-blur-md p-6 l-bracket border border-white/5 relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
