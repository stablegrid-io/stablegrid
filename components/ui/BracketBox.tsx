'use client';

import type { ReactNode, CSSProperties } from 'react';

interface BracketBoxProps {
  color?: string;
  children: ReactNode;
  active?: boolean;
  locked?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function BracketBox({
  color = '#20c0d0',
  children,
  active = false,
  locked = false,
  className = '',
  style = {},
}: BracketBoxProps) {
  const borderColor = locked ? '#141e28' : color;
  return (
    <div
      className={`relative ${locked ? 'opacity-40' : ''} ${className}`}
      style={{
        border: `1px solid ${borderColor}18`,
        background: locked ? 'rgba(8,12,18,0.5)' : active ? `${borderColor}07` : '#0a0f18',
        padding: '20px 24px',
        ...style,
      }}
    >
      {/* Corner brackets */}
      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => {
        const isTop = corner.startsWith('top');
        const isLeft = corner.endsWith('left');
        return (
          <span
            key={corner}
            aria-hidden
            style={{
              position: 'absolute',
              [isTop ? 'top' : 'bottom']: -1,
              [isLeft ? 'left' : 'right']: -1,
              width: 14,
              height: 14,
              borderTop: isTop ? `2px solid ${borderColor}` : 'none',
              borderBottom: !isTop ? `2px solid ${borderColor}` : 'none',
              borderLeft: isLeft ? `2px solid ${borderColor}` : 'none',
              borderRight: !isLeft ? `2px solid ${borderColor}` : 'none',
            }}
          />
        );
      })}

      {locked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#1a2530]">
            LOCKED
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
