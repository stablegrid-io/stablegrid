import type { GridScore } from '@/data/gridAssets';

interface GridStatsProps {
  score: GridScore;
}

const STABILITY_COLOR: Record<string, string> = {
  FRAGILE:   '#f04060',
  MODERATE:  '#f0c040',
  RESILIENT: '#22b99a',
  FORTIFIED: '#40e080',
};

export function GridStats({ score }: GridStatsProps) {
  const stabilityColor = STABILITY_COLOR[score.stabilityRating] ?? '#f0c040';
  const stats = [
    {
      label: 'Output',
      value: `${score.totalOutput} MW`,
      sub: `of ${score.totalLoad} MW load`,
      color: '#22b99a',
    },
    {
      label: 'Coverage',
      value: `${score.coverage}%`,
      sub: score.coverage >= 100 ? 'Full coverage' : 'Partial coverage',
      color: score.coverage >= 100 ? '#40e080' : '#f0c040',
    },
    {
      label: 'Stability',
      value: score.stabilityRating,
      sub: `Score: ${score.totalStability}`,
      color: stabilityColor,
    },
    {
      label: 'Deployed',
      value: `${score.deployed} / ${score.totalSlots}`,
      sub: `€${score.invested} invested`,
      color: '#b060e0',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, sub, color }) => (
        <div
          key={label}
          className="relative overflow-hidden rounded-[4px] border px-4 py-3"
          style={{ borderColor: `${color}30`, background: `${color}07` }}
        >
          {/* Corner brackets */}
          <span
            className="absolute left-2 top-2 h-3 w-3 border-l border-t"
            style={{ borderColor: `${color}40` }}
          />
          <span
            className="absolute right-2 top-2 h-3 w-3 border-r border-t"
            style={{ borderColor: `${color}40` }}
          />
          <span
            className="absolute left-2 bottom-2 h-3 w-3 border-l border-b"
            style={{ borderColor: `${color}40` }}
          />
          <span
            className="absolute right-2 bottom-2 h-3 w-3 border-r border-b"
            style={{ borderColor: `${color}40` }}
          />

          {/* Top accent stripe */}
          <div
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{ background: `${color}80` }}
          />

          {/* Left accent stripe */}
          <div
            className="absolute inset-y-0 left-0 w-[2px]"
            style={{ background: `${color}40` }}
          />

          <p
            className="font-mono text-[9px] font-bold uppercase tracking-[0.35em]"
            style={{ color: `${color}70` }}
          >
            {label}
          </p>
          <p className="mt-1 font-mono text-lg font-bold" style={{ color }}>
            {value}
          </p>
          <p className="mt-0.5 font-mono text-[10px]" style={{ color: `${color}60` }}>
            {sub}
          </p>
        </div>
      ))}
    </div>
  );
}
