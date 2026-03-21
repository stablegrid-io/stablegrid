interface GameBadgeProps {
  amount: number | string;
  color?: string;
  prefix?: string;
  unit?: string;
  size?: 's' | 'm';
}

export function GameBadge({
  amount,
  color = '#20c0d0',
  prefix = '',
  unit = '',
  size = 'm',
}: GameBadgeProps) {
  const isSmall = size === 's';
  return (
    <span
      className="inline-flex items-center font-mono font-bold"
      style={{
        gap: isSmall ? 3 : 5,
        padding: isSmall ? '2px 6px' : '3px 10px',
        background: `${color}10`,
        border: `1px solid ${color}30`,
        fontSize: isSmall ? 9 : 11,
        color,
      }}
    >
      {prefix}
      {amount}
      {unit && (
        <span style={{ fontSize: isSmall ? 7 : 8, opacity: 0.7 }}>{unit}</span>
      )}
    </span>
  );
}
