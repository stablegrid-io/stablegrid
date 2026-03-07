'use client';

interface CircularReadinessProgressProps {
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}

const clampReadiness = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function CircularReadinessProgress({
  value,
  label,
  size = 124,
  strokeWidth = 10
}: CircularReadinessProgressProps) {
  const readiness = clampReadiness(value);
  const radius = Math.max(0, (size - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - readiness / 100);

  return (
    <div
      className="relative h-[124px] w-[124px] shrink-0"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={readiness}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-slate-200 dark:stroke-dark-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="fill-none stroke-brand-500 dark:stroke-brand-400 transition-[stroke-dashoffset] duration-500"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Readiness
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{readiness}%</p>
      </div>
    </div>
  );
}
