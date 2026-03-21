'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ChevronRight, Lock, Zap, Shield, Radio, Cpu } from 'lucide-react';
import { useOperationsStore } from '@/lib/stores/useOperationsStore';
import { MISSIONS, TIERS, LEVELS, getLevelInfo } from '@/data/operations';

const TIER_COLORS: Record<number, string> = {
  1: '#22b99a',
  2: '#f0c040',
  3: '#f07030',
  4: '#b060e0',
};

const TIER_RGB: Record<number, string> = {
  1: '34,185,154',
  2: '240,192,64',
  3: '240,112,48',
  4: '176,96,224',
};

const TIER_ICONS = {
  1: Zap,
  2: Shield,
  3: Radio,
  4: Cpu,
} as const;

const TIER_CLASSIFICATION: Record<number, string> = {
  1: 'FOUNDATION',
  2: 'TACTICAL',
  3: 'ADVANCED',
  4: 'SPECIALIST',
};

export function OperationsSelect() {
  const credits = useOperationsStore((s) => s.credits);
  const completedOperations = useOperationsStore((s) => s.completedOperations);

  const totalEarned = Object.values(completedOperations)
    .filter((r) => r.correct)
    .reduce((sum, r) => sum + r.creditsPaid, 0);
  const levelInfo = getLevelInfo(totalEarned);
  const maxTier = levelInfo.unlocksTier;
  const clearedCount = Object.values(completedOperations).filter((r) => r.correct).length;

  return (
    <main className="min-h-screen bg-[#06080a] pb-24 pt-8 lg:pb-10">
      {/* Scanline grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
          backgroundSize: '100% 3px',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4">
        {/* Page header */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#1a2420]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#2e4a40]">
              OPS-BOARD · MISSION-SELECT
            </span>
            <div className="h-px flex-1 bg-[#1a2420]" />
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="font-mono text-3xl font-black uppercase tracking-[0.06em] text-[#deeee6]">
                Operations
              </h1>
              <p className="mt-1 font-mono text-xs tracking-[0.12em] text-[#3a5a4a]">
                Solve power grid scenarios · Earn credits
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#2e4a40]">Balance</span>
              <span className="font-mono text-xl font-black text-[#f0c040]">€{credits}</span>
              <span className="font-mono text-[9px] tracking-[0.15em] text-[#2e4a40]">
                {clearedCount}/{MISSIONS.length} cleared
              </span>
            </div>
          </div>
        </div>

        {/* Tier unlock strip */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          {Object.entries(TIERS).map(([tierNum, tier]) => {
            const num = parseInt(tierNum);
            const unlocked = num <= maxTier;
            const rgb = TIER_RGB[num] ?? '34,185,154';
            const requiredLevel = LEVELS.find((l) => l.unlocksTier >= num);
            return (
              <div
                key={tierNum}
                className="flex shrink-0 items-center gap-2 border px-3 py-1.5"
                style={{
                  borderColor: unlocked ? `rgba(${rgb},0.3)` : '#1a2e26',
                  background: unlocked ? `rgba(${rgb},0.06)` : '#080e0c',
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: unlocked ? `rgba(${rgb},1)` : '#1a2e26' }}
                />
                <span
                  className="font-mono text-[9px] font-bold uppercase tracking-[0.25em]"
                  style={{ color: unlocked ? `rgba(${rgb},1)` : '#2a4038' }}
                >
                  {tier.name}
                </span>
                {!unlocked && (
                  <span className="font-mono text-[9px] text-[#2a4038]">
                    · Lv {requiredLevel?.level ?? '?'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Mission cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MISSIONS.map((mission) => {
            const tierNum = mission.tier;
            const accentRgb = TIER_RGB[tierNum] ?? '34,185,154';
            const accent = `rgb(${accentRgb})`;
            const accentDim = `rgba(${accentRgb},0.15)`;
            const accentGlow = `rgba(${accentRgb},0.35)`;
            const locked = tierNum > maxTier;
            const result = completedOperations[mission.id];
            const passed = result?.correct ?? false;
            const attempted = !!result;

            // For locked missions use muted palette
            const dimRgb = '38,60,50';
            const displayRgb = locked ? dimRgb : accentRgb;
            const displayAccent = locked ? `rgba(${dimRgb},1)` : accent;
            const displayDim = locked ? `rgba(${dimRgb},0.5)` : accentDim;
            const displayGlow = locked ? `rgba(${dimRgb},0.2)` : accentGlow;

            const Icon = TIER_ICONS[tierNum as 1 | 2 | 3 | 4] ?? Radio;
            const classification = TIER_CLASSIFICATION[tierNum] ?? 'TIER';

            // Progress: single mission — 1 block if passed, 0 if not
            const filledBlocks = passed ? 10 : attempted ? 2 : 0;
            const progressPct = passed ? 100 : attempted ? 20 : 0;

            const ctaLabel = locked ? 'Tier Locked' : passed ? 'Review mission' : 'Begin mission';

            const href = `/operations/${mission.id}`;

            if (locked) {
              return (
                <div
                  key={mission.id}
                  className="relative flex flex-col overflow-hidden rounded-none opacity-50"
                >
                  <div
                    className="relative flex flex-1 flex-col overflow-hidden border bg-[#080e0c]"
                    style={{ borderColor: '#1a2420' }}
                  >
                    <div className="h-[3px] w-full bg-[#1a2420]" />
                    <div className="flex items-center justify-between px-4 pt-4">
                      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-[#2a4038]">
                        ▶ {classification}
                      </span>
                      <span className="font-mono text-[8px] tracking-[0.2em] text-[#1a2e26]">
                        {mission.id}
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center px-6 py-7">
                      <div className="relative flex h-20 w-20 items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-[#1a2420]" />
                        <div className="absolute inset-2 rounded-full border border-[#141e1a]" />
                        <Lock className="relative h-8 w-8 text-[#2a4038]" />
                      </div>
                      <span className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-[#1e3028]">
                        TIER LOCKED
                      </span>
                    </div>
                    <div className="px-5 pb-3">
                      <h2 className="font-mono text-xl font-black uppercase tracking-[0.06em] text-[#1e3028]">
                        {mission.name}
                      </h2>
                      <p className="mt-2 font-mono text-[11px] leading-5 tracking-[0.02em] text-[#1a2820]">
                        {mission.brief.length > 110 ? `${mission.brief.slice(0, 110)}…` : mission.brief}
                      </p>
                    </div>
                    <div className="mx-5 my-3 h-px bg-[#141e1a]" />
                    <div className="px-5 pb-5">
                      <div className="flex gap-[3px]">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div key={i} className="h-1.5 flex-1 bg-[#141e1a]" />
                        ))}
                      </div>
                      <p className="mt-1.5 font-mono text-[9px] tracking-[0.1em] text-[#1a2820]">
                        Unlock {TIERS[tierNum]?.name} tier to access
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={mission.id}
                href={href}
                className="group relative flex flex-col overflow-hidden rounded-none transition-all duration-300 hover:-translate-y-1"
                style={{ '--accent': accent } as CSSProperties}
              >
                <div
                  className="relative flex flex-1 flex-col overflow-hidden border bg-[#0c0f0e]"
                  style={{
                    borderColor: `rgba(${accentRgb},0.22)`,
                    boxShadow: `0 0 0 1px rgba(${accentRgb},0.08), 0 24px 60px -20px rgba(${accentRgb},0.18), inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}
                >
                  {/* Top accent stripe */}
                  <div
                    className="h-[3px] w-full"
                    style={{ background: `linear-gradient(90deg, ${accent}, transparent 80%)` }}
                  />

                  {/* Corner targeting brackets */}
                  <span
                    className="absolute left-2.5 top-2.5 h-5 w-5 border-l-2 border-t-2 transition-all duration-300 group-hover:h-6 group-hover:w-6"
                    style={{ borderColor: accent }}
                  />
                  <span
                    className="absolute right-2.5 top-2.5 h-5 w-5 border-r-2 border-t-2 transition-all duration-300 group-hover:h-6 group-hover:w-6"
                    style={{ borderColor: accent }}
                  />
                  <span
                    className="absolute bottom-2.5 left-2.5 h-5 w-5 border-b-2 border-l-2 transition-all duration-300 group-hover:h-6 group-hover:w-6"
                    style={{ borderColor: accent }}
                  />
                  <span
                    className="absolute bottom-2.5 right-2.5 h-5 w-5 border-b-2 border-r-2 transition-all duration-300 group-hover:h-6 group-hover:w-6"
                    style={{ borderColor: accent }}
                  />

                  {/* Inner glow bg */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(ellipse at 50% 30%, rgba(${accentRgb},0.07), transparent 65%)`,
                    }}
                  />

                  {/* Classification + serial row */}
                  <div className="flex items-center justify-between px-4 pt-4">
                    <span
                      className="font-mono text-[8px] font-bold uppercase tracking-[0.3em]"
                      style={{ color: accent }}
                    >
                      ▶ {classification}
                    </span>
                    <span className="font-mono text-[8px] tracking-[0.2em] text-[#2e4a40]">
                      {mission.id}
                    </span>
                  </div>

                  {/* Icon hero */}
                  <div className="flex flex-col items-center justify-center px-6 py-7">
                    <div className="relative flex h-20 w-20 items-center justify-center">
                      <div
                        className="absolute inset-0 rounded-full blur-xl transition-all duration-300 group-hover:scale-125"
                        style={{ backgroundColor: accentGlow }}
                      />
                      <div
                        className="absolute inset-0 rounded-full border-2"
                        style={{ borderColor: `rgba(${accentRgb},0.3)` }}
                      />
                      <div
                        className="absolute inset-2 rounded-full border"
                        style={{ borderColor: `rgba(${accentRgb},0.15)` }}
                      />
                      <Icon className="relative h-9 w-9" style={{ color: accent }} />
                    </div>
                    <span
                      className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.35em]"
                      style={{ color: `rgba(${accentRgb},0.6)` }}
                    >
                      {passed ? 'MISSION CLEARED' : attempted ? 'ATTEMPT FAILED' : 'AWAITING BRIEFING'}
                    </span>
                  </div>

                  {/* Title + description */}
                  <div className="px-5 pb-3">
                    <h2 className="font-mono text-xl font-black uppercase tracking-[0.06em] text-[#deeee6]">
                      {mission.name}
                    </h2>
                    <p className="mt-2 font-mono text-[11px] leading-5 tracking-[0.02em] text-[#3a5a4a]">
                      {mission.brief.length > 110 ? `${mission.brief.slice(0, 110)}…` : mission.brief}
                    </p>
                  </div>

                  {/* Divider */}
                  <div
                    className="mx-5 my-3 h-px"
                    style={{ background: `linear-gradient(90deg, ${accent}30, transparent)` }}
                  />

                  {/* Segmented progress bar */}
                  <div className="px-5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-[#2e4a40]">
                        Completion
                      </span>
                      <span
                        className="font-mono text-[10px] font-bold tabular-nums"
                        style={{ color: accent }}
                      >
                        {progressPct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-2" style={{ backgroundColor: `rgba(${accentRgb},0.3)` }} />
                      <div className="flex-1 flex gap-0.5 p-0.5" style={{ border: `1.5px solid rgba(${accentRgb},0.2)`, backgroundColor: 'rgba(0,0,0,0.3)' }}>
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className="h-2 flex-1 transition-all duration-500"
                            style={{
                              backgroundColor:
                                i < filledBlocks ? accent : `rgba(${accentRgb},0.08)`,
                              border: i >= filledBlocks ? `1px solid rgba(${accentRgb},0.1)` : 'none',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1.5 font-mono text-[9px] tracking-[0.1em] text-[#2a4038]">
                      {passed
                        ? `Cleared · €${mission.payout} earned`
                        : attempted
                        ? 'Incorrect answer · Retry allowed'
                        : `€${mission.payout} payout on success`}
                    </p>
                  </div>

                  {/* CTA button */}
                  <div className="p-5 pt-4">
                    <div
                      className="relative flex w-full items-center justify-between overflow-hidden px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-200 group-hover:tracking-[0.24em]"
                      style={{
                        border: `1px solid rgba(${accentRgb},0.4)`,
                        color: accent,
                        background: accentDim,
                      }}
                    >
                      <span className="relative z-10">{ctaLabel}</span>
                      <ChevronRight className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      <div
                        className="absolute inset-0 -translate-x-full transition-transform duration-300 group-hover:translate-x-0"
                        style={{
                          background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.1))`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer serial line */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#111a16]" />
          <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-[#1e3028]">
            GRID-FLUX · OPS-CONSOLE · MISSION-BOARD
          </span>
          <div className="h-px flex-1 bg-[#111a16]" />
        </div>
      </div>
    </main>
  );
}
