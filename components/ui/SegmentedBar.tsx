type BarColor = 'primary' | 'secondary' | 'tertiary' | 'error';

const activeColorMap: Record<BarColor, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  error: 'bg-error',
};

const inactiveColorMap: Record<BarColor, string> = {
  primary: 'bg-surface-container-highest/30 border border-primary/10',
  secondary: 'bg-surface-container-highest/30 border border-secondary/10',
  tertiary: 'bg-surface-container-highest/30 border border-tertiary/10',
  error: 'bg-surface-container-highest/30 border border-error/10',
};

interface SegmentedBarProps {
  value: number;
  segments?: number;
  color?: BarColor;
  className?: string;
}

export function SegmentedBar({
  value,
  segments = 10,
  color = 'primary',
  className = '',
}: SegmentedBarProps) {
  const activeCount = Math.round((value / 100) * segments);

  return (
    <div className={`flex gap-1 h-3 ${className}`}>
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={`flex-1 ${i < activeCount ? activeColorMap[color] : inactiveColorMap[color]}`}
        />
      ))}
    </div>
  );
}
