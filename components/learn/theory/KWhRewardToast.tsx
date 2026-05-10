'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Check, Zap, Trophy, Crown } from 'lucide-react';
import {
  CAPABILITIES,
  CAPABILITY_AREAS,
  type CapabilityTier,
} from '@/lib/learn/capabilityTaxonomy';

/* ── Types ──────────────────────────────────────────────────────────────────── */

export type RewardTier = 'lesson' | 'module' | 'track';

export interface KWhReward {
  id: string;
  tier: RewardTier;
  kwh: number;
  label: string;
  trackLevel?: string;
}

interface Props {
  reward: KWhReward | null;
  onDismiss: () => void;
}

/* ── Animated Counter ───────────────────────────────────────────────────────── */

function AnimatedCounter({ target, duration = 800 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return <>{value.toLocaleString()}</>;
}

/* ── Lesson Toast (corner flag) ─────────────────────────────────────────────── */

function LessonToast({ reward, onDismiss }: { reward: KWhReward; onDismiss: () => void }) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    const t = setTimeout(() => dismissRef.current(), 2500);
    return () => clearTimeout(t);
  }, [reward.id]);

  return (
    <div
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6 right-3 lg:right-6 z-[60] pointer-events-auto"
      style={{
        opacity: 0,
        transform: 'translateY(12px)',
        animation: 'kwhRingIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div
        className="relative flex items-stretch border border-on-surface/15 bg-surface"
        style={{
          boxShadow: '0 16px 36px -20px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* Primary left accent strip */}
        <span aria-hidden className="w-[3px] bg-primary" />

        <div className="flex items-baseline gap-3 px-5 py-4">
          <span className="font-serif text-[28px] leading-none tabular-nums text-primary">
            +<AnimatedCounter target={reward.kwh} duration={700} />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-data-mono text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface">
              kWh
            </span>
            <span className="font-data-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">
              Lesson read
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Module Toast (centered card) ───────────────────────────────────────────── */

function ModuleToast({ reward, onDismiss }: { reward: KWhReward; onDismiss: () => void }) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    const t = setTimeout(() => dismissRef.current(), 5000);
    return () => clearTimeout(t);
  }, [reward.id]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      onClick={onDismiss}
      style={{ opacity: 0, animation: 'kwhFadeIn 0.3s ease forwards' }}
    >
      {/* Backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />

      {/* Card */}
      <div
        className="relative w-[calc(100vw-2rem)] max-w-[380px] border border-on-surface/15 bg-surface flex flex-col"
        style={{
          boxShadow: '0 24px 60px -30px rgba(0, 0, 0, 0.4)',
          opacity: 0,
          transform: 'scale(0.95)',
          animation: 'kwhCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent */}
        <div aria-hidden className="h-[2px] w-full bg-primary" />

        <div className="flex flex-col items-center text-center px-9 pt-10 pb-9">
          {/* Trophy */}
          <span className="flex h-12 w-12 items-center justify-center border border-on-surface/15 mb-6">
            <Trophy className="h-5 w-5 text-on-surface" strokeWidth={1.5} />
          </span>

          {/* Eyebrow */}
          <div className="font-data-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-4">
            Module Complete
          </div>

          {/* kWh value */}
          <div className="font-serif text-[44px] leading-none tabular-nums text-primary mb-3">
            +<AnimatedCounter target={reward.kwh} duration={1000} />
            <span className="text-[18px] text-on-surface-variant ml-2">kWh</span>
          </div>

          {/* Label */}
          <p className="font-body text-[13px] leading-relaxed text-on-surface-variant mt-2">
            {reward.label}
          </p>

          {/* Dismiss hint */}
          <div className="mt-7 font-data-mono text-[9px] uppercase tracking-[0.18em] text-on-surface-variant/60">
            tap to dismiss
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Track Toast (celebration) ──────────────────────────────────────────────── */

function TrackToast({ reward, onDismiss }: { reward: KWhReward; onDismiss: () => void }) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    // Track-completion is a celebration moment; give it long enough to read
    // the capability list before auto-dismiss takes it away.
    const t = setTimeout(() => dismissRef.current(), 14000);
    return () => clearTimeout(t);
  }, [reward.id]);

  const tierLabel = reward.trackLevel
    ? reward.trackLevel.charAt(0).toUpperCase() + reward.trackLevel.slice(1)
    : '';

  const multiplier =
    reward.trackLevel === 'senior'
      ? '3.0'
      : reward.trackLevel === 'mid'
        ? '1.5'
        : '1.0';

  // Pull the capability statements for this tier from the taxonomy and
  // pair each with its area label, so the celebration reads as "here's
  // what you can now do" rather than just "here's a kWh number." Areas
  // with `null` statements (tier gaps in the curriculum, e.g. plans at
  // junior) are filtered out.
  const tierCapabilities = useMemo(() => {
    const tier = reward.trackLevel as CapabilityTier | undefined;
    if (!tier) return [];
    const byArea = new Map(CAPABILITY_AREAS.map((a) => [a.id, a.label]));
    return CAPABILITIES.filter((c) => c.tier === tier && c.statement)
      .map((c) => ({
        area: byArea.get(c.area) ?? c.area,
        statement: c.statement,
      }));
  }, [reward.trackLevel]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      onClick={onDismiss}
      style={{ opacity: 0, animation: 'kwhFadeIn 0.3s ease forwards' }}
    >
      {/* Backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-on-surface/50 backdrop-blur-md"
      />

      {/* Card — wider when we render the capability list so each line
          breathes. Falls back to the original 440px when there's no list. */}
      <div
        className={`relative w-[calc(100vw-2rem)] ${
          tierCapabilities.length > 0 ? 'max-w-[520px]' : 'max-w-[440px]'
        } max-h-[90vh] overflow-y-auto border border-on-surface/15 bg-surface flex flex-col`}
        style={{
          boxShadow: '0 32px 80px -36px rgba(0, 0, 0, 0.5)',
          opacity: 0,
          transform: 'scale(0.9)',
          animation: 'kwhCardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent (thicker for track) */}
        <div aria-hidden className="h-[3px] w-full bg-primary" />

        <div className="flex flex-col items-center text-center px-8 sm:px-12 pt-10 sm:pt-12 pb-8 sm:pb-10">
          {/* Crown */}
          <span className="flex h-14 w-14 items-center justify-center border border-on-surface/15 mb-6 sm:mb-7">
            <Crown className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </span>

          {/* Eyebrow */}
          <div className="font-data-mono text-[10px] font-bold uppercase tracking-[0.24em] text-primary mb-3">
            {tierLabel} Track Complete
          </div>

          {/* kWh value */}
          <div className="font-serif text-[44px] sm:text-[56px] leading-none tabular-nums text-primary mb-4">
            +<AnimatedCounter target={reward.kwh} duration={1500} />
            <span className="text-[18px] sm:text-[20px] text-on-surface-variant ml-2">kWh</span>
          </div>

          {/* Label */}
          <p className="font-body text-[14px] leading-relaxed text-on-surface-variant max-w-[28ch]">
            {reward.label}
          </p>

          {/* Multiplier */}
          {reward.trackLevel && (
            <div className="inline-flex items-center gap-1.5 mt-5 px-3 py-1.5 border border-primary/30 bg-primary/[0.06]">
              <Zap className="w-3 h-3 text-primary" strokeWidth={2} />
              <span className="font-data-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary tabular-nums">
                {multiplier}× multiplier
              </span>
            </div>
          )}

          {/* Capability summary — what the operator can now do, drawn
              from the same taxonomy /stats reads. Only shown when the
              tier resolves to actual statements. */}
          {tierCapabilities.length > 0 && (
            <div className="w-full mt-8 pt-6 border-t border-surface-dim text-left">
              <p className="font-data-mono uppercase text-[10px] tracking-[0.22em] text-on-surface-variant text-center mb-4">
                You can now
              </p>
              <ul className="flex flex-col gap-3">
                {tierCapabilities.map((cap) => (
                  <li key={`${cap.area}-${cap.statement}`} className="flex items-start gap-2.5">
                    <span
                      aria-hidden
                      className="flex h-4 w-4 shrink-0 items-center justify-center border border-primary bg-primary/10 mt-0.5"
                    >
                      <Check className="h-3 w-3 text-primary" strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <span className="font-data-mono uppercase text-[9px] tracking-[0.18em] text-on-surface-variant">
                        {cap.area}
                      </span>
                      <span className="font-body text-[13px] leading-snug text-on-surface">
                        {cap.statement}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dismiss */}
          <div className="mt-8 font-data-mono text-[9px] uppercase tracking-[0.18em] text-on-surface-variant/60">
            tap to continue
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────────── */

export function KWhRewardToast({ reward, onDismiss }: Props) {
  const handleDismiss = useCallback(() => onDismiss(), [onDismiss]);

  if (!reward) return null;

  return (
    <>
      <style>{`
        @keyframes kwhFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes kwhCardIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes kwhRingIn {
          from { opacity: 0; transform: translateY(12px) scale(.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes kwhRingFill {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      {reward.tier === 'lesson' && <LessonToast reward={reward} onDismiss={handleDismiss} />}
      {reward.tier === 'module' && <ModuleToast reward={reward} onDismiss={handleDismiss} />}
      {reward.tier === 'track' && <TrackToast reward={reward} onDismiss={handleDismiss} />}
    </>
  );
}
