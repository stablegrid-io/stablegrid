import type { OrderStatus } from '@/components/admin/orders/types';

const WIDTH = 76;
const HEIGHT = 24;
const PADDING = 3;

const toPoints = (values: number[]) => {
  if (values.length === 0) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const step = values.length > 1 ? (WIDTH - PADDING * 2) / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = PADDING + index * step;
      const y = HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2);
      return `${x},${y}`;
    })
    .join(' ');
};

export function OrderTrendSparkline({
  trend,
  status
}: {
  trend: number[];
  status: OrderStatus;
}) {
  const first = trend[0] ?? 0;
  const last = trend[trend.length - 1] ?? first;
  const negative = status === 'Cancelled' || last < first;

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Order trend ${negative ? 'down' : 'up'}`}
      className="overflow-visible"
    >
      <path
        d={`M${PADDING} ${HEIGHT - PADDING} H${WIDTH - PADDING}`}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <polyline
        points={toPoints(trend)}
        fill="none"
        stroke={negative ? 'rgba(251,113,133,0.9)' : 'rgba(52,211,153,0.9)'}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
