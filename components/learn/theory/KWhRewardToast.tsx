'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, Trophy, Crown } from 'lucide-react';

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
        className="relative w-full max-w-[380px] border border-on-surface/15 bg-surface flex flex-col"
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
    const t = setTimeout(() => dismissRef.current(), 8000);
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

      {/* Card */}
      <div
        className="relative w-full max-w-[440px] border border-on-surface/15 bg-surface flex flex-col"
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

        <div className="flex flex-col items-center text-center px-12 pt-12 pb-10">
          {/* Crown */}
          <span className="flex h-14 w-14 items-center justify-center border border-on-surface/15 mb-7">
            <Crown className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </span>

          {/* Eyebrow */}
          <div className="font-data-mono text-[10px] font-bold uppercase tracking-[0.24em] text-primary mb-3">
            {tierLabel} Track Complete
          </div>

          {/* kWh value */}
          <div className="font-serif text-[56px] leading-none tabular-nums text-primary mb-4">
            +<AnimatedCounter target={reward.kwh} duration={1500} />
            <span className="text-[20px] text-on-surface-variant ml-2">kWh</span>
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

          {/* Dismiss */}
          <div className="mt-9 font-data-mono text-[9px] uppercase tracking-[0.18em] text-on-surface-variant/60">
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
