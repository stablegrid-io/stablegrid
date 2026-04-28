'use client';

import type { CSSProperties } from 'react';
import { Check, Lock } from 'lucide-react';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { StableGridMark } from '@/components/brand/StableGridLogo';
import { getUserTier, getTierProgressReport, type TierContext } from '@/lib/tiers';

/**
 * Hero-sized character-tier card for the /progress page. Mirrors the
 * landing pricing-card aesthetic: portrait banner, L-bracket corners,
 * accent-tinted surface, multi-criterion checklist with per-row progress
 * bars. Keeps the same data model as the old settings CharacterTierCard —
 * only the visual is "dialed up" for the dashboard.
 */

const TIER_META: Record<
  'junior' | 'mid' | 'senior',
  { label: string; accent: string; rgb: string; headline: string }
> = {
  junior: {
    label: 'Junior',
    accent: '#99f7ff',
    rgb: '153,247,255',
    headline: 'Grid apprentice.'
  },
  mid: {
    label: 'Mid',
    accent: '#ffc965',
    rgb: '255,201,101',
    headline: 'Keeping the lights on.'
  },
  senior: {
    label: 'Senior',
    accent: '#ff716c',
    rgb: '255,113,108',
    headline: 'Architecting the build.'
  }
};

export function CharacterTierHero() {
  const xp = useProgressStore((state) => state.xp);
  const completedTracks = useProgressStore((state) => state.completedTracks);

  const ctx: TierContext = { kwh: xp, completedTracks };
  const tier = getUserTier(ctx);
  const meta = TIER_META[tier];

  const nextTier: 'mid' | 'senior' | null =
    tier === 'junior' ? 'mid' : tier === 'mid' ? 'senior' : null;
  const report = nextTier ? getTierProgressReport(ctx, nextTier) : null;
  const nextMeta = nextTier ? TIER_META[nextTier] : null;

  const accentRgb = nextMeta?.rgb ?? meta.rgb;
  const accent = nextMeta?.accent ?? meta.accent;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: '#0f1215',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
        opacity: 0,
        animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) forwards'
      }}
    >
      <Corner position="top-left" accentRgb={accentRgb} />
      <Corner position="top-right" accentRgb={accentRgb} />
      <Corner position="bottom-left" accentRgb={accentRgb} />
      <Corner position="bottom-right" accentRgb={accentRgb} />

      <div className="grid gap-10 p-8 lg:grid-cols-[320px_1fr] lg:gap-14 lg:p-10">
        {/* ── Left: portrait + identity ── */}
        <div className="relative flex flex-col">
          <div
            className="relative mx-auto h-48 w-48 shrink-0 lg:mx-0 lg:h-56 lg:w-56 flex items-center justify-center"
            aria-label={`${meta.label} tier`}
          >
            <StableGridMark
              className="h-24 w-24 lg:h-28 lg:w-28"
              style={{ color: meta.accent }}
            />
          </div>

          <div className="mt-6 text-center lg:text-left">
            <h2
              style={{
                fontSize: 'clamp(2.5rem, 4.5vw, 3.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 0.95,
                color: meta.accent
              }}
            >
              {meta.label}
            </h2>

            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
              <StatPill label="kWh" value={xp.toLocaleString()} />
              <StatPill
                label={completedTracks.length === 1 ? 'track' : 'tracks'}
                value={completedTracks.length.toString()}
              />
            </div>
          </div>
        </div>

        {/* ── Right: criteria checklist or max-tier state ── */}
        <div className="relative flex flex-col">
          {report && nextMeta ? (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p
                    className="font-mono"
                    style={{
                      fontSize: 10.5,
                      letterSpacing: '0.26em',
                      color: 'rgba(255,255,255,0.35)',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}
                  >
                    To unlock
                  </p>
                  <h3
                    className="mt-1"
                    style={{
                      fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                      color: nextMeta.accent
                    }}
                  >
                    {nextMeta.label}
                  </h3>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {report.criteria.map((c, i) => {
                  const pct = Math.min(100, Math.round((c.current / c.target) * 100));
                  return (
                    <div
                      key={c.id}
                      className="relative overflow-hidden rounded-[14px] border px-4 py-3.5"
                      style={{
                        borderColor: c.met ? `rgba(${nextMeta.rgb},0.35)` : 'rgba(255,255,255,0.06)',
                        background: c.met
                          ? `linear-gradient(120deg, rgba(${nextMeta.rgb},0.08), rgba(${nextMeta.rgb},0.02))`
                          : 'rgba(255,255,255,0.015)',
                        opacity: 0,
                        animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${120 + i * 70}ms forwards`
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
                            style={{
                              background: c.met ? `rgba(${nextMeta.rgb},0.18)` : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${c.met ? `rgba(${nextMeta.rgb},0.45)` : 'rgba(255,255,255,0.08)'}`
                            }}
                          >
                            {c.met ? (
                              <Check className="h-3 w-3" strokeWidth={3} style={{ color: nextMeta.accent }} />
                            ) : (
                              <Lock className="h-3 w-3" strokeWidth={2.5} style={{ color: 'rgba(255,255,255,0.4)' }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="leading-snug"
                              style={{
                                fontSize: 14.5,
                                fontWeight: 600,
                                color: 'rgba(255,255,255,0.92)',
                                letterSpacing: '-0.005em'
                              }}
                            >
                              {c.label}
                            </p>
                            {c.detail && (
                              <p
                                className="mt-1 truncate"
                                style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}
                              >
                                {c.detail}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className="font-mono tabular-nums shrink-0"
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: c.met ? nextMeta.accent : 'rgba(255,255,255,0.6)',
                            letterSpacing: '0.01em'
                          }}
                        >
                          {c.display}
                        </span>
                      </div>
                      <div
                        className="mt-3 h-[3px] w-full overflow-hidden rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: c.met
                              ? nextMeta.accent
                              : `linear-gradient(90deg, rgba(255,255,255,0.18), ${nextMeta.accent}cc)`,
                            boxShadow: c.met ? `0 0 12px rgba(${nextMeta.rgb},0.5)` : undefined
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {report.metAll && (
                <div
                  className="mt-5 rounded-[12px] px-4 py-3 text-center"
                  style={{
                    background: `linear-gradient(120deg, rgba(${nextMeta.rgb},0.14), rgba(${nextMeta.rgb},0.04))`,
                    border: `1px solid rgba(${nextMeta.rgb},0.4)`
                  }}
                >
                  <p
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.22em',
                      color: nextMeta.accent,
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    Promotion ready — sync triggers the tier change
                  </p>
                </div>
              )}

              {/* ── Tier ladder footer ── */}
              <div
                className="mt-6 grid grid-cols-3 gap-2 pt-5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                {(['junior', 'mid', 'senior'] as const).map((t) => {
                  const isCurrent = t === tier;
                  const m = TIER_META[t];
                  return (
                    <div
                      key={t}
                      className="rounded-[12px] px-3 py-2.5 text-center transition-colors"
                      style={{
                        backgroundColor: isCurrent ? 'rgba(255,255,255,0.04)' : 'transparent',
                        border: `1px solid ${
                          isCurrent ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'
                        }`
                      }}
                    >
                      <p
                        className="font-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.22em',
                          color: isCurrent ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      >
                        {m.label}
                      </p>
                      <p
                        className="mt-1 font-mono tabular-nums"
                        style={{
                          fontSize: 11.5,
                          color: 'rgba(255,255,255,0.45)',
                          fontWeight: 500
                        }}
                      >
                        {m.label === 'Junior' ? 'Start' : `${t === 'mid' ? '10,000' : '30,000'}+ kWh`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <MaxTierState />
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="inline-flex items-baseline gap-1.5 rounded-full px-3 py-1.5"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <span
        className="font-mono tabular-nums"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.97)',
          letterSpacing: '-0.01em'
        }}
      >
        {value}
      </span>
      <span
        className="font-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.16em',
          color: 'rgba(255,255,255,0.95)',
          textTransform: 'uppercase',
          fontWeight: 700
        }}
      >
        {label}
      </span>
    </div>
  );
}

function MaxTierState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p
        className="font-mono"
        style={{
          fontSize: 10.5,
          letterSpacing: '0.26em',
          color: 'rgba(255,113,108,0.85)',
          textTransform: 'uppercase',
          fontWeight: 700
        }}
      >
        Maximum tier
      </p>
      <h3
        style={{
          fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          color: 'rgba(255,255,255,0.95)'
        }}
      >
        You&apos;ve cleared every gate.
      </h3>
      <p
        style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.5)',
          maxWidth: 380,
          lineHeight: 1.55
        }}
      >
        There&apos;s no tier above Senior. Keep finishing tracks — your kWh still compounds and
        funds the Grid.
      </p>
    </div>
  );
}

function Corner({
  position,
  accentRgb
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  accentRgb: string;
}) {
  const isTop = position.startsWith('top');
  const isLeft = position.endsWith('left');
  const color = `rgba(${accentRgb},0.55)`;
  const size = 22;

  const containerStyle: CSSProperties = {
    position: 'absolute',
    [isTop ? 'top' : 'bottom']: 0,
    [isLeft ? 'left' : 'right']: 0,
    width: size,
    height: size,
    zIndex: 10,
    pointerEvents: 'none'
  };

  return (
    <div aria-hidden style={containerStyle}>
      <div
        style={{
          position: 'absolute',
          [isTop ? 'top' : 'bottom']: 0,
          [isLeft ? 'left' : 'right']: 0,
          width: '100%',
          height: 1,
          background: color
        }}
      />
      <div
        style={{
          position: 'absolute',
          [isTop ? 'top' : 'bottom']: 0,
          [isLeft ? 'left' : 'right']: 0,
          width: 1,
          height: '100%',
          background: color
        }}
      />
    </div>
  );
}
