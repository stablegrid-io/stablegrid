'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import type {
  GridOpsCampaignScenarioProgress,
  GridOpsCampaignView,
  GridOpsScenarioId
} from '@/lib/grid-ops/types';

interface CampaignResponse {
  data: GridOpsCampaignView;
}

const STATE_CONFIG = {
  locked: {
    cardBorder: 'border-[#1a1f1a]',
    cardBg: 'bg-[#09090a]',
    cardOpacity: 'opacity-40',
    cardHover: '',
    badgeText: 'LOCKED',
    badgeBorder: 'border-[#2a2f2a]',
    badgeBg: 'bg-transparent',
    badgeColor: 'text-[#3a4a3a]',
    accentBar: 'bg-[#1a2a1a]',
    buttonText: null
  },
  available: {
    cardBorder: 'border-[#f0a030]/30',
    cardBg: 'bg-[#0a0b08]',
    cardOpacity: '',
    cardHover: 'hover:border-[#f0a030]/55 hover:shadow-[0_0_32px_-10px_rgba(240,160,48,0.2)] cursor-pointer transition-all duration-200',
    badgeText: 'AVAILABLE',
    badgeBorder: 'border-[#f0a030]/40',
    badgeBg: 'bg-transparent',
    badgeColor: 'text-[#f0a030]',
    accentBar: 'bg-[#f0a030]',
    buttonText: 'DEPLOY'
  },
  in_progress: {
    cardBorder: 'border-[#f0a030]/50',
    cardBg: 'bg-[#0b0c08]',
    cardOpacity: '',
    cardHover: 'hover:border-[#f0a030]/75 hover:shadow-[0_0_40px_-10px_rgba(240,160,48,0.3)] cursor-pointer transition-all duration-200',
    badgeText: 'ACTIVE OPS',
    badgeBorder: 'border-[#f0a030]/60',
    badgeBg: 'bg-[#f0a030]/8',
    badgeColor: 'text-[#f0a030]',
    accentBar: 'bg-[#f0a030]',
    buttonText: 'CONTINUE'
  },
  completed: {
    cardBorder: 'border-[#4a9a6a]/35',
    cardBg: 'bg-[#09100c]',
    cardOpacity: '',
    cardHover: 'hover:border-[#4a9a6a]/55 hover:shadow-[0_0_32px_-10px_rgba(74,154,106,0.15)] cursor-pointer transition-all duration-200',
    badgeText: 'NEUTRALIZED',
    badgeBorder: 'border-[#4a9a6a]/40',
    badgeBg: 'bg-transparent',
    badgeColor: 'text-[#4a9a6a]',
    accentBar: 'bg-[#4a9a6a]',
    buttonText: 'REVIEW'
  }
};

function ScenarioCard({
  progress,
  index,
  onPlay
}: {
  progress: GridOpsCampaignScenarioProgress;
  index: number;
  onPlay: (id: GridOpsScenarioId) => void;
}) {
  const { scenario, state, stability_pct, deployed_count } = progress;
  const cfg = STATE_CONFIG[state];
  const isPlayable = state !== 'locked';

  return (
    <div
      className={`group relative flex flex-col overflow-hidden border ${cfg.cardBorder} ${cfg.cardBg} ${cfg.cardOpacity} ${cfg.cardHover}`}
      style={{ boxShadow: state === 'in_progress' ? '0 0 0 1px rgba(240,160,48,0.08) inset' : undefined }}
      onClick={() => isPlayable && onPlay(scenario.id)}
      onKeyDown={(e) => { if (isPlayable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPlay(scenario.id); } }}
      role={isPlayable ? 'button' : undefined}
      tabIndex={isPlayable ? 0 : undefined}
      aria-disabled={!isPlayable}
    >
      {/* Top accent stripe */}
      <div className={`h-[2px] w-full ${cfg.accentBar}`}
        style={state === 'in_progress' ? { boxShadow: '0 0 12px rgba(240,160,48,0.6)' } : state === 'completed' ? { boxShadow: '0 0 8px rgba(74,154,106,0.4)' } : undefined}
      />

      {/* Corner brackets (top-left, top-right) */}
      <span aria-hidden className={`pointer-events-none absolute left-0 top-[2px] h-4 w-4 border-l border-t ${state === 'locked' ? 'border-[#2a2f2a]' : state === 'completed' ? 'border-[#4a9a6a]/40' : 'border-[#f0a030]/40'}`} />
      <span aria-hidden className={`pointer-events-none absolute right-0 top-[2px] h-4 w-4 border-r border-t ${state === 'locked' ? 'border-[#2a2f2a]' : state === 'completed' ? 'border-[#4a9a6a]/40' : 'border-[#f0a030]/40'}`} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Mission number + flag + badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xl leading-none">{scenario.flag}</span>
            <div>
              <p className={`font-mono text-[8px] font-bold uppercase tracking-[0.4em] ${state === 'locked' ? 'text-[#2a3a2a]' : state === 'completed' ? 'text-[#4a9a6a]/60' : 'text-[#f0a030]/60'}`}>
                MISSION {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className={`font-mono text-base font-black uppercase tracking-[0.06em] ${state === 'locked' ? 'text-[#3a4a3a]' : 'text-[#f5f0e8]'}`}>
                {scenario.name}
              </h3>
            </div>
          </div>

          {/* State badge */}
          <span className={`shrink-0 border px-2 py-0.5 font-mono text-[8px] font-bold tracking-[0.2em] ${cfg.badgeBorder} ${cfg.badgeBg} ${cfg.badgeColor}`}>
            {cfg.badgeText}
          </span>
        </div>

        {/* Subtitle */}
        <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${state === 'locked' ? 'text-[#2a3a2a]' : state === 'completed' ? 'text-[#4a9a6a]/80' : 'text-[#f0a030]/70'}`}>
          {scenario.subtitle}
        </p>

        {/* Thin separator */}
        <div className={`h-px w-full ${state === 'locked' ? 'bg-[#1a2a1a]' : state === 'completed' ? 'bg-[#4a9a6a]/15' : 'bg-[#f0a030]/12'}`} />

        {/* Description */}
        {state !== 'locked' && (
          <p className="text-[11px] leading-relaxed text-[#6a7a5a]">{scenario.description}</p>
        )}

        {/* Lock message */}
        {state === 'locked' && (
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-[#2a3a2a]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#2a3a2a]">
              Neutralize previous region to unlock
            </span>
          </div>
        )}

        {/* Progress */}
        {(state === 'in_progress' || state === 'completed') && stability_pct !== null && (
          <div className="mt-auto space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5a6a4a]">Grid Stability</span>
              <span className={`font-mono text-[11px] font-bold ${state === 'completed' ? 'text-[#4a9a6a]' : 'text-[#f0a030]'}`}
                style={state === 'in_progress' ? { textShadow: '0 0 8px rgba(240,160,48,0.5)' } : undefined}
              >
                {stability_pct}%
              </span>
            </div>
            <div className="h-[3px] w-full bg-[#1a1f14]">
              <div
                className={`h-full transition-all ${state === 'completed' ? 'bg-[#4a9a6a]' : 'bg-[#f0a030]'}`}
                style={{
                  width: `${Math.min(stability_pct, 100)}%`,
                  boxShadow: state === 'completed' ? '0 0 6px rgba(74,154,106,0.5)' : '0 0 8px rgba(240,160,48,0.5)'
                }}
              />
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#4a5a3a]">
              {deployed_count} asset{deployed_count !== 1 ? 's' : ''} deployed
            </p>
          </div>
        )}

        {/* Completed status */}
        {state === 'completed' && (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-[#4a9a6a]">✓</span>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#4a9a6a]">
              Mission complete — next region unlocked
            </span>
          </div>
        )}

        {/* CTA button */}
        {cfg.buttonText && (
          <div className="mt-auto pt-1 flex items-center justify-end">
            <div className={`flex items-center gap-2 border px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] transition-colors duration-150 ${
              state === 'completed'
                ? 'border-[#4a9a6a]/40 text-[#4a9a6a] group-hover:border-[#4a9a6a]/70 group-hover:text-[#6aba8a]'
                : 'border-[#f0a030]/40 text-[#f0a030] group-hover:border-[#f0a030]/70 group-hover:text-[#f5b84a]'
            }`}>
              {cfg.buttonText}
              <span className="text-[10px]">›</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectorArrow({ completed }: { completed: boolean }) {
  return (
    <div className="hidden items-center justify-center xl:flex">
      <span className={`font-mono text-xs ${completed ? 'text-[#4a9a6a]/60' : 'text-[#f0a030]/30'}`}>
        //
      </span>
    </div>
  );
}

export function CampaignOverview() {
  const router = useRouter();
  const [campaign, setCampaign] = useState<GridOpsCampaignView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/grid-ops/campaign', { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error ?? 'Failed to load campaign.');
      }
      const body = (await res.json()) as CampaignResponse;
      setCampaign(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCampaign();
  }, [fetchCampaign]);

  const handlePlay = useCallback(
    (scenarioId: GridOpsScenarioId) => {
      router.push(`/energy?scenario=${scenarioId}`);
    },
    [router]
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090b] px-4 pb-20 pt-12 text-[#e6ebf2] sm:px-6">
      {/* Tactical grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(240,160,48,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(240,160,48,0.8) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      {/* Ambient orange glow top */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(240,160,48,0.06),transparent_40%)]" />

      <div className="relative mx-auto max-w-[1280px]">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 font-mono text-[9px] font-bold uppercase tracking-[0.6em] text-[#f0a030]/50">
            // STABLEGRID.IO · GRID OPS ·
          </p>
          <h1 className="font-mono text-[clamp(1.8rem,4vw,3rem)] font-black uppercase tracking-[0.18em] text-[#f5f0e8]"
            style={{ textShadow: '0 0 40px rgba(240,160,48,0.18)' }}
          >
            Grid Campaign
          </h1>
          {/* Orange underline */}
          <div aria-hidden className="mx-auto mt-3 h-px w-32 bg-gradient-to-r from-transparent via-[#f0a030]/60 to-transparent"
            style={{ boxShadow: '0 0 10px rgba(240,160,48,0.35)' }}
          />
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5a6a4a]">
            Restore stability across 5 European power grids — Baltics to Continental Interconnect
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-[#f0a030]/60" />
            <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#f0a030]/40">
              Loading campaign data...
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-auto max-w-md border border-rose-500/30 bg-[#0f0808] px-4 py-3 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-rose-400">{error}</p>
            <button
              type="button"
              onClick={() => void fetchCampaign()}
              className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-rose-500/70 underline underline-offset-2 hover:text-rose-400"
            >
              Retry
            </button>
          </div>
        )}

        {/* Campaign grid */}
        {campaign && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_28px_1fr_28px_1fr_28px_1fr_28px_1fr]">
            {campaign.scenarios.flatMap((progress, index) => {
              const items = [
                <ScenarioCard
                  key={progress.scenario.id}
                  progress={progress}
                  index={index}
                  onPlay={handlePlay}
                />
              ];
              if (index < campaign.scenarios.length - 1) {
                items.push(
                  <ConnectorArrow
                    key={`arrow-${progress.scenario.id}`}
                    completed={progress.state === 'completed'}
                  />
                );
              }
              return items;
            })}
          </div>
        )}

        {/* Footer */}
        {campaign && (
          <p className="mt-8 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-[#3a4a3a]">
            ▶ Complete each mission by reaching 100% grid stability to unlock the next region
          </p>
        )}
      </div>
    </main>
  );
}
