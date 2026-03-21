type BarColor = 'primary' | 'secondary' | 'tertiary' | 'error';

const activeBgMap: Record<BarColor, string> = {
  primary: 'bg-primary/80',
  secondary: 'bg-secondary/80',
  tertiary: 'bg-tertiary/80',
  error: 'bg-error/80',
};

const inactiveBgMap: Record<BarColor, string> = {
  primary: 'bg-surface-container-highest/20 border border-primary/10',
  secondary: 'bg-surface-container-highest/20 border border-secondary/10',
  tertiary: 'bg-surface-container-highest/20 border border-tertiary/10',
  error: 'bg-surface-container-highest/20 border border-error/10',
};

const borderColorMap: Record<BarColor, string> = {
  primary: 'border-primary/20',
  secondary: 'border-secondary/20',
  tertiary: 'border-tertiary/20',
  error: 'border-error/20',
};

const capColorMap: Record<BarColor, string> = {
  primary: 'bg-primary/30',
  secondary: 'bg-secondary/30',
  tertiary: 'bg-tertiary/30',
  error: 'bg-error/30',
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
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`w-1.5 h-3 ${capColorMap[color]}`} />
      <div className={`flex-1 flex gap-0.5 p-1 border-2 ${borderColorMap[color]} bg-black/30`}>
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={`flex-1 h-3 ${i < activeCount ? activeBgMap[color] : inactiveBgMap[color]}`}
          />
        ))}
      </div>
    </div>
  );
}
