'use client';

import { useProgressStore } from '@/lib/stores/useProgressStore';
import {
  getLevelProgress,
  getAvailableBudgetUnits,
  getSpentInfrastructureUnits,
  formatUnitsAsKwh,
  TIER_COLORS,
  INFRASTRUCTURE_NODES
} from '@/lib/energy';
import { CharacterHeroCard } from '@/components/progress/CharacterHeroCard';

interface ServerProps {
  serverXp: number;
  serverStreak: number;
  serverQuestionsCompleted: number;
  serverTopicProgress: {
    pyspark: { correct: number; total: number };
    fabric: { correct: number; total: number };
  };
}

// ── Battery widget ───────────────────────────────────────────────────────────

function BatteryWidget({
  availableUnits,
  spentUnits,
  color
}: {
  availableUnits: number;
  spentUnits: number;
  color: string;
}) {
  const total = availableUnits + spentUnits;
  const pct = total > 0 ? Math.round((availableUnits / total) * 100) : 0;
  const batteryColor = pct > 60 ? '#22c55e' : pct > 25 ? '#f0a030' : '#ef4444';
  const segments = 8;
  const filledSegments = Math.round((pct / 100) * segments);

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[10px] border p-5"
      style={{ background: 'rgba(8,10,9,0.9)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <span className="absolute left-3 top-3 h-3 w-3 border-l border-t border-white/10" />
      <span className="absolute right-3 top-3 h-3 w-3 border-r border-t border-white/10" />
      <span className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/10" />
      <span className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/10" />

      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-white/30 mb-4">
        Energy Reserve
      </p>

      <div className="flex items-center gap-5">
        {/* Battery shape */}
        <div className="relative flex flex-col items-center gap-0.5">
          {/* terminal nub */}
          <div
            className="h-[5px] w-5 rounded-[2px]"
            style={{ background: batteryColor, opacity: 0.7 }}
          />
          {/* battery body */}
          <div
            className="relative flex flex-col-reverse gap-[3px] overflow-hidden rounded-[5px] border-2 p-1.5"
            style={{ borderColor: batteryColor, width: 36, height: 100 }}
          >
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className="h-[7px] w-full flex-shrink-0 rounded-[2px] transition-all duration-500"
                style={{
                  background: i < filledSegments ? batteryColor : 'rgba(255,255,255,0.05)',
                  boxShadow: i < filledSegments ? `0 0 4px ${batteryColor}60` : 'none'
                }}
              />
            ))}
          </div>
          {/* % label */}
          <p
            className="mt-1.5 font-mono text-[11px] font-bold tabular-nums"
            style={{ color: batteryColor }}
          >
            {pct}%
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-3 flex-1">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/25 mb-0.5">Available</p>
            <p className="font-mono text-lg font-bold text-white tabular-nums">
              {formatUnitsAsKwh(availableUnits)}
            </p>
          </div>
          <div className="h-px bg-white/[0.05]" />
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/25 mb-0.5">Deployed</p>
            <p className="font-mono text-sm font-bold tabular-nums" style={{ color: color }}>
              {formatUnitsAsKwh(spentUnits)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/25 mb-0.5">Total Earned</p>
            <p className="font-mono text-[11px] text-white/50 tabular-nums">
              {formatUnitsAsKwh(availableUnits + spentUnits)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Wallet widget ────────────────────────────────────────────────────────────

function WalletWidget({ xp, color }: { xp: number; color: string }) {
  const bills = Math.floor(xp / 1000);
  const remainder = xp % 1000;

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[10px] border p-5"
      style={{ background: 'rgba(8,10,9,0.9)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <span className="absolute left-3 top-3 h-3 w-3 border-l border-t border-white/10" />
      <span className="absolute right-3 top-3 h-3 w-3 border-r border-t border-white/10" />
      <span className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/10" />
      <span className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/10" />

      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-white/30 mb-4">
        XP Currency
      </p>

      <div className="flex items-start gap-5">
        {/* Wallet shape */}
        <div className="relative flex-shrink-0" style={{ width: 52, height: 100 }}>
          {/* wallet body */}
          <div
            className="absolute inset-0 rounded-[6px] border-2"
            style={{ borderColor: `${color}60`, background: 'rgba(255,255,255,0.04)' }}
          />
          {/* wallet fold line */}
          <div
            className="absolute left-0 right-0 top-1/2 h-[1px]"
            style={{ background: `${color}30` }}
          />
          {/* card slot */}
          <div
            className="absolute left-2 top-[10px] right-2 h-[18px] rounded-[3px] border"
            style={{ borderColor: `${color}35`, background: 'rgba(0,0,0,0.3)' }}
          />
          {/* card chip */}
          <div
            className="absolute left-3.5 top-[14px] h-2.5 w-4 rounded-[2px]"
            style={{ background: `${color}50` }}
          />
          {/* bills sticking out */}
          <div
            className="absolute bottom-[22px] left-1.5 right-1.5 h-[6px] rounded-[1px]"
            style={{ background: `${color}25`, borderTop: `1px solid ${color}40` }}
          />
          <div
            className="absolute bottom-[16px] left-2 right-2 h-[6px] rounded-[1px]"
            style={{ background: `${color}35`, borderTop: `1px solid ${color}50` }}
          />
          <div
            className="absolute bottom-[10px] left-1.5 right-1.5 h-[6px] rounded-[1px]"
            style={{ background: `${color}20`, borderTop: `1px solid ${color}30` }}
          />
          {/* clasp dot */}
          <div
            className="absolute right-2 top-[calc(50%-5px)] h-2.5 w-2.5 rounded-full border"
            style={{ borderColor: `${color}60`, background: 'rgba(0,0,0,0.4)' }}
          />
          {/* glow */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[6px] opacity-10 blur-[8px]"
            style={{ background: color }}
          />
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-3 flex-1">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/25 mb-0.5">Total XP</p>
            <p className="font-mono text-xl font-bold text-white tabular-nums">
              {xp.toLocaleString()}
            </p>
          </div>
          <div className="h-px bg-white/[0.05]" />
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/25 mb-0.5">Thousands</p>
            <p className="font-mono text-sm font-bold tabular-nums" style={{ color }}>
              {bills}k<span className="text-[10px] text-white/30"> + {remainder}</span>
            </p>
          </div>
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/25 mb-0.5">Rank Value</p>
            <div className="flex gap-[3px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[4px] w-4 rounded-[1px]"
                  style={{
                    background: i < Math.min(5, Math.floor(xp / 2000)) ? color : 'rgba(255,255,255,0.06)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div
      className="relative flex flex-col gap-2 overflow-hidden rounded-[10px] border p-4"
      style={{ background: 'rgba(8,10,9,0.9)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div
        className="h-[1.5px] w-full"
        style={{ background: `linear-gradient(90deg, ${color}70, transparent 70%)`, marginTop: -16, marginLeft: -16, width: 'calc(100% + 32px)', marginBottom: 8 }}
      />
      <p className="font-mono text-2xl font-bold text-white tabular-nums">{value}</p>
      <div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color }}>{sub}</p>
        <p className="mt-0.5 text-[11px] text-white/30">{label}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProgressDashboard({
  serverXp,
  serverStreak,
  serverQuestionsCompleted,
  serverTopicProgress
}: ServerProps) {
  const storeXp = useProgressStore((s) => s.xp);
  const storeStreak = useProgressStore((s) => s.streak);
  const deployedNodeIds = useProgressStore((s) => s.deployedNodeIds);
  const topicProgress = useProgressStore((s) => s.topicProgress);

  const xp = storeXp > 0 ? storeXp : serverXp;
  const streak = storeStreak > 0 ? storeStreak : serverStreak;

  const pysparkStats = topicProgress.pyspark.total > 0 ? topicProgress.pyspark : serverTopicProgress.pyspark;
  const fabricStats = topicProgress.fabric.total > 0 ? topicProgress.fabric : serverTopicProgress.fabric;

  const { current } = getLevelProgress(xp);
  const tierColor = TIER_COLORS[current.tier];

  const availableUnits = getAvailableBudgetUnits(xp, deployedNodeIds);
  const spentUnits = getSpentInfrastructureUnits(deployedNodeIds);

  const totalCorrect = pysparkStats.correct + fabricStats.correct;
  const totalAttempted = pysparkStats.total + fabricStats.total;
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const questionsAnswered = totalAttempted > 0 ? totalAttempted : serverQuestionsCompleted;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* CSS keyframes */}
      <style>{`
        @keyframes levelPulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* Page header */}
      <div className="pb-1">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.45em] text-white/25">
          // Operator Profile
        </p>
        <h1 className="mt-1 font-mono text-[2rem] font-black uppercase tracking-[0.12em] text-white">
          Progress
        </h1>
        <div className="mt-2 h-px w-20 bg-gradient-to-r from-white/30 to-transparent" />
      </div>

      {/* Hero card: 3D character + level */}
      <CharacterHeroCard serverXp={serverXp} />

      {/* Battery + Wallet */}
      <div className="grid grid-cols-2 gap-4">
        <BatteryWidget
          availableUnits={availableUnits}
          spentUnits={spentUnits}
          color={tierColor.primary}
        />
        <WalletWidget xp={xp} color={tierColor.primary} />
      </div>

      {/* 4-stat grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip
          label="Active streak"
          value={streak.toString()}
          sub="Days"
          color="#f97316"
        />
        <StatChip
          label="Total answered"
          value={questionsAnswered.toLocaleString()}
          sub="Questions"
          color="#22b99a"
        />
        <StatChip
          label="Overall"
          value={totalAttempted > 0 ? `${accuracy}%` : '—'}
          sub="Accuracy"
          color="#5ba3f5"
        />
        <StatChip
          label="Active nodes"
          value={`${deployedNodeIds.length}/${INFRASTRUCTURE_NODES.length}`}
          sub="Grid"
          color={tierColor.primary}
        />
      </div>

    </div>
  );
}
