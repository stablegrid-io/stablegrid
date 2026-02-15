'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  xp: number;
  streak: number;
}

export function ProgressBar({ current, total, xp, streak }: ProgressBarProps) {
  const percentage = total ? Math.round((current / total) * 100) : 0;

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-text-light-tertiary dark:text-text-dark-tertiary">
        <span>
          Question {current}/{total}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-brand-600 dark:text-brand-400">
            XP {xp.toLocaleString()}
          </span>
          <span className="text-success-600 dark:text-success-400">
            Streak {streak}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-light-hover dark:bg-dark-hover">
        <div
          className="h-2 rounded-full bg-brand-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
