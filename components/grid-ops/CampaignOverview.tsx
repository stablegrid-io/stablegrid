'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, CheckCircle2, ChevronRight, Loader2, Zap } from 'lucide-react';
import type {
  GridOpsCampaignScenarioProgress,
  GridOpsCampaignView,
  GridOpsScenarioId
} from '@/lib/grid-ops/types';

interface CampaignResponse {
  data: GridOpsCampaignView;
}

const STATE_STYLES = {
  locked: {
    card: 'border-white/6 bg-[rgba(12,16,22,0.6)] opacity-55',
    badge: 'border-white/10 bg-white/5 text-[#4a5f75]',
    badgeText: 'LOCKED',
    button: null
  },
  available: {
    card: 'border-brand-500/25 bg-[rgba(0,180,120,0.04)] hover:border-brand-500/45 hover:bg-[rgba(0,180,120,0.07)] transition-all cursor-pointer',
    badge: 'border-brand-500/40 bg-brand-500/12 text-brand-300',
    badgeText: 'AVAILABLE',
    button: 'Deploy'
  },
  in_progress: {
    card: 'border-amber-400/30 bg-[rgba(245,185,66,0.04)] hover:border-amber-400/50 hover:bg-[rgba(245,185,66,0.07)] transition-all cursor-pointer',
    badge: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    badgeText: 'IN PROGRESS',
    button: 'Continue'
  },
  completed: {
    card: 'border-emerald-500/30 bg-[rgba(0,208,132,0.04)] hover:border-emerald-500/50 hover:bg-[rgba(0,208,132,0.07)] transition-all cursor-pointer',
    badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    badgeText: 'COMPLETED',
    button: 'Review'
  }
};

function ScenarioCard({
  progress,
  onPlay
}: {
  progress: GridOpsCampaignScenarioProgress;
  onPlay: (id: GridOpsScenarioId) => void;
}) {
  const { scenario, state, stability_pct, deployed_count } = progress;
  const styles = STATE_STYLES[state];
  const isPlayable = state !== 'locked';

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-[22px] border p-5 ${styles.card}`}
      onClick={() => isPlayable && onPlay(scenario.id)}
      onKeyDown={(e) => { if (isPlayable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPlay(scenario.id); } }}
      role={isPlayable ? 'button' : undefined}
      tabIndex={isPlayable ? 0 : undefined}
      aria-disabled={!isPlayable}
    >
      {/* Mission order + flag */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">{scenario.flag}</span>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#4a5f75]">
              Mission {scenario.order}
            </p>
            <h3 className="text-[1.05rem] font-bold leading-tight text-[#e0eaf5]">
              {scenario.name}
            </h3>
          </div>
        </div>

        {/* State badge */}
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.10em] ${styles.badge}`}
        >
          {styles.badgeText}
        </span>
      </div>

      {/* Subtitle */}
      <p className="text-[0.78rem] font-semibold text-[#7a9ab8]">{scenario.subtitle}</p>

      {/* Description */}
      {state !== 'locked' && (
        <p className="text-[0.74rem] leading-relaxed text-[#5a7090]">{scenario.description}</p>
      )}

      {/* Progress bar (in_progress / completed) */}
      {(state === 'in_progress' || state === 'completed') && stability_pct !== null && (
        <div className="mt-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] text-[#5a7090]">Grid Stability</span>
            <span
              className={`text-[0.72rem] font-bold ${
                state === 'completed' ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {stability_pct}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className={`h-full rounded-full transition-all ${
                state === 'completed' ? 'bg-emerald-500/70' : 'bg-amber-400/70'
              }`}
              style={{ width: `${Math.min(stability_pct, 100)}%` }}
            />
          </div>
          <p className="text-[0.66rem] text-[#4a5f75]">{deployed_count} asset{deployed_count !== 1 ? 's' : ''} deployed</p>
        </div>
      )}

      {/* Completed check */}
      {state === 'completed' && (
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-[0.72rem] font-semibold">Mission complete — next region unlocked</span>
        </div>
      )}

      {/* Lock icon */}
      {state === 'locked' && (
        <div className="flex items-center gap-1.5 text-[#3a4f63]">
          <Lock className="h-3.5 w-3.5" />
          <span className="text-[0.72rem]">Complete the previous mission to unlock</span>
        </div>
      )}

      {/* CTA */}
      {styles.button && (
        <div className="mt-auto flex items-center justify-end">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.72rem] font-semibold ${
              state === 'completed'
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : state === 'in_progress'
                  ? 'border border-amber-400/30 bg-amber-400/10 text-amber-300'
                  : 'border border-brand-500/30 bg-brand-500/12 text-brand-300'
            }`}
          >
            {styles.button}
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectorArrow() {
  return (
    <div className="hidden items-center justify-center xl:flex">
      <ChevronRight className="h-5 w-5 text-[#2a3f53]" />
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
    <main className="relative min-h-screen overflow-hidden bg-transparent px-4 pb-16 pt-12 text-[#e6ebf2] sm:px-6">
      {/* Background grid lines */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(144,216,196,0.10),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(126,170,255,0.08),transparent_24%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--app-grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--app-grid-line) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          backgroundPosition: '-1px -1px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.15))'
        }}
      />

      <div className="relative mx-auto max-w-[1280px]">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/8 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-brand-400" />
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brand-300">
              stableGrid.io
            </span>
          </div>
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-[#e0eaf5] sm:text-[2.4rem]">
            Grid Campaign
          </h1>
          <p className="mt-2 text-[0.9rem] text-[#5a7090]">
            Restore stability across 5 European power grids — from the Baltics to the Continental Interconnect.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-auto max-w-md rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center">
            <p className="text-sm text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => void fetchCampaign()}
              className="mt-2 text-[0.8rem] text-rose-300 underline underline-offset-2 hover:text-rose-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Campaign grid */}
        {campaign && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr]">
            {campaign.scenarios.flatMap((progress, index) => {
              const items = [
                <ScenarioCard
                  key={progress.scenario.id}
                  progress={progress}
                  onPlay={handlePlay}
                />
              ];
              if (index < campaign.scenarios.length - 1) {
                items.push(<ConnectorArrow key={`arrow-${progress.scenario.id}`} />);
              }
              return items;
            })}
          </div>
        )}

        {/* Footer hint */}
        {campaign && (
          <p className="mt-8 text-center text-[0.72rem] text-[#3a4f63]">
            Complete each mission by reaching 100% grid stability to unlock the next region.
          </p>
        )}
      </div>
    </main>
  );
}
