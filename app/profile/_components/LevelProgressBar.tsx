'use client';

import { motion } from 'framer-motion';
import { TIER_COLORS, type LevelDefinition } from '@/lib/energy';

interface Props {
  current: LevelDefinition;
  next: LevelDefinition | null;
  progressPct: number;
  unitsNeededForNext: number;
}

export function LevelProgressBar({ current, next, progressPct, unitsNeededForNext }: Props) {
  const { primary: color } = TIER_COLORS[current.tier];
  const isMaxLevel = !next;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px] text-brand-200/60">
        <span>Level {current.level}</span>
        {next ? <span>Level {next.level}</span> : <span>MAX</span>}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0f1e18]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          initial={{ width: 0 }}
          animate={{ width: `${isMaxLevel ? 100 : progressPct}%` }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </div>
      {!isMaxLevel && (
        <p className="text-[10px] text-brand-200/50">
          {unitsNeededForNext.toLocaleString()} units to {next!.title}
        </p>
      )}
    </div>
  );
}
