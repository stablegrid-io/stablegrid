import type { OrderStatus } from '@/components/admin/orders/types';

const WIDTH = 76;
const HEIGHT = 24;
const PADDING = 3;

const PRIMARY = '#a33800';
const AXIS = '#8d7167';
const FILL = 'rgba(163,56,0,0.08)';

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

const toAreaPath = (values: number[]) => {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const step = values.length > 1 ? (WIDTH - PADDING * 2) / (values.length - 1) : 0;
  const coords = values.map((value, index) => {
    const x = PADDING + index * step;
    const y = HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2);
    return [x, y] as const;
  });
  const first = coords[0];
  const last = coords[coords.length - 1];
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  return `${linePath} L${last[0]} ${HEIGHT - PADDING} L${first[0]} ${HEIGHT - PADDING} Z`;
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
        stroke={AXIS}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path d={toAreaPath(trend)} fill={FILL} stroke="none" />
      <polyline
        points={toPoints(trend)}
        fill="none"
        stroke={PRIMARY}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
