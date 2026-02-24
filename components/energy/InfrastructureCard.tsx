'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { InfrastructureNode } from '@/lib/energy';
import { formatKwh } from '@/lib/energy';

const MAP_COLORS = {
  textPrimary: '#f0f7f2',
  textSecondary: '#b8d4c4',
  textMuted: '#8fb09d',
  border: 'rgba(74,222,128,0.45)',
  glow: 'rgba(74,222,128,0.25)',
  energyBar: '#34d399',
  energyGlow: 'rgba(74,222,128,0.6)',
  cardBg: 'linear-gradient(165deg, rgba(12,28,20,0.98), rgba(8,18,14,0.99))'
} as const;

export const InfrastructureCard = memo(function InfrastructureCard({
  node,
  compact = false,
  animate = true
}: {
  node: InfrastructureNode;
  compact?: boolean;
  animate?: boolean;
}) {
  const energyPct = Math.min(100, (node.stabilityImpactPct / 25) * 100);

  return (
    <motion.article
      layout
      initial={animate ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative overflow-hidden rounded-xl border-2 shadow-xl"
      style={{
        borderColor: MAP_COLORS.border,
        background: MAP_COLORS.cardBg,
        boxShadow: `0 0 24px ${MAP_COLORS.glow}, 0 12px 32px rgba(0,0,0,0.5)`
      }}
    >
      {/* Top energy bar — battery-like charge indicator */}
      <div
        className="absolute left-0 right-0 top-0 h-1 overflow-hidden"
        style={{ background: 'rgba(15,35,25,0.9)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${energyPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-r-full"
          style={{
            background: `linear-gradient(90deg, ${MAP_COLORS.energyBar}, ${MAP_COLORS.energyGlow})`,
            boxShadow: `0 0 12px ${MAP_COLORS.energyGlow}`
          }}
        />
      </div>

      <div className={`relative p-4 ${compact ? 'py-3' : ''}`}>
        <div className="flex items-start gap-3">
          {/* Icon in a battery-style badge */}
          <div
            className="flex shrink-0 items-center justify-center rounded-lg border-2 text-xl font-black"
            style={{
              width: compact ? 40 : 52,
              height: compact ? 40 : 52,
              borderColor: MAP_COLORS.border,
              background: 'rgba(20,45,32,0.6)',
              color: MAP_COLORS.textPrimary,
              textShadow: `0 0 20px ${MAP_COLORS.glow}`
            }}
          >
            {node.icon}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: MAP_COLORS.textMuted }}
            >
              Infrastructure deployed
            </p>
            <h3
              className={`mt-0.5 font-bold ${compact ? 'text-sm' : 'text-base'}`}
              style={{ color: MAP_COLORS.textPrimary }}
            >
              {node.name}
            </h3>
            <p
              className={`mt-1 ${compact ? 'text-[11px]' : 'text-xs'}`}
              style={{ color: MAP_COLORS.textSecondary }}
            >
              {node.function}
            </p>
            {!compact ? (
              <p className="mt-1 text-[11px]" style={{ color: MAP_COLORS.textMuted }}>
                Unlocks: {node.unlocks}
              </p>
            ) : null}
          </div>
        </div>

        {/* Stats row — cost & stability impact */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className="rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              borderColor: 'rgba(74,222,128,0.35)',
              background: 'rgba(20,45,32,0.5)',
              color: MAP_COLORS.textPrimary
            }}
          >
            {formatKwh(node.kwhRequired, 1)} cost
          </span>
          <span
            className="rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              borderColor: 'rgba(74,222,128,0.35)',
              background: 'rgba(20,45,32,0.5)',
              color: MAP_COLORS.energyBar
            }}
          >
            +{node.stabilityImpactPct}% stability
          </span>
        </div>
      </div>

      {/* Subtle corner accent */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20"
        style={{ background: MAP_COLORS.energyGlow }}
      />
    </motion.article>
  );
});
