'use client';

interface Props {
  healthPct: number; // 20 | 50 | 75
}

const getBarColor = (healthPct: number): string => {
  if (healthPct <= 20) return '#64748b'; // slate-500 — offline
  if (healthPct <= 50) return '#f43f5e'; // rose-500 — critical
  return '#f59e0b'; // amber-400 — warning
};

export function AssetHealthBar({ healthPct }: Props) {
  const color = getBarColor(healthPct);

  return (
    <div
      className="mt-0.5 h-[3px] w-full overflow-hidden rounded-full bg-white/10"
      title={`Asset health: ${healthPct}%`}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${healthPct}%`,
          backgroundColor: color,
          boxShadow: `0 0 4px ${color}80`
        }}
      />
    </div>
  );
}
