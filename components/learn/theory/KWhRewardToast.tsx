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

/* ── Lesson Toast (subtle bottom-right) ─────────────────────────────────────── */

function LessonToast({ reward, onDismiss }: { reward: KWhReward; onDismiss: () => void }) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    const t = setTimeout(() => dismissRef.current(), 2500);
    return () => clearTimeout(t);
  }, [reward.id]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3"
      style={{
        background: 'rgba(17, 20, 22, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(153, 247, 255, 0.15)',
        borderRadius: '16px',
        boxShadow: '0 0 30px rgba(153, 247, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.4)',
        opacity: 0,
        transform: 'translateY(12px)',
        animation: 'kwhSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full"
        style={{ background: 'rgba(153, 247, 255, 0.1)' }}
      >
        <Zap className="w-4 h-4" style={{ color: '#99f7ff' }} />
      </div>
      <div>
        <div
          className="text-[13px] font-semibold tabular-nums"
          style={{ color: '#99f7ff', fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif' }}
        >
          +<AnimatedCounter target={reward.kwh} duration={600} /> kWh
        </div>
        <div className="text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
          {reward.label}
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
      className="fixed inset-0 z-[60] flex items-center justify-center"
      onClick={onDismiss}
      style={{ opacity: 0, animation: 'kwhFadeIn 0.3s ease forwards' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
      />

      {/* Card */}
      <div
        className="relative flex flex-col items-center text-center px-10 py-10"
        style={{
          background: '#111416',
          border: '1px solid rgba(153, 247, 255, 0.12)',
          borderRadius: '22px',
          boxShadow: '0 0 60px rgba(153, 247, 255, 0.06), 0 24px 80px rgba(0, 0, 0, 0.5)',
          maxWidth: '360px',
          width: '90vw',
          opacity: 0,
          transform: 'scale(0.95)',
          animation: 'kwhCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center w-14 h-14 rounded-full mb-5"
          style={{
            background: 'rgba(153, 247, 255, 0.08)',
            border: '1px solid rgba(153, 247, 255, 0.15)',
            boxShadow: '0 0 24px rgba(153, 247, 255, 0.1)',
          }}
        >
          <Trophy className="w-6 h-6" style={{ color: '#99f7ff' }} />
        </div>

        {/* Module title */}
        <div
          className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          Module Complete
        </div>

        {/* kWh value */}
        <div
          className="text-4xl font-bold tabular-nums mb-2"
          style={{
            color: '#99f7ff',
            fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          +<AnimatedCounter target={reward.kwh} duration={1000} /> kWh
        </div>

        {/* Label */}
        <div className="text-[13px] leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          {reward.label}
        </div>

        {/* Dismiss hint */}
        <div className="mt-6 text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.15)' }}>
          tap to dismiss
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      onClick={onDismiss}
      style={{ opacity: 0, animation: 'kwhFadeIn 0.3s ease forwards' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(12px)' }}
      />

      {/* Card */}
      <div
        className="relative flex flex-col items-center text-center px-12 py-12"
        style={{
          background: 'linear-gradient(180deg, rgba(153, 247, 255, 0.04) 0%, #111416 40%)',
          border: '1px solid rgba(153, 247, 255, 0.15)',
          borderRadius: '22px',
          boxShadow: '0 0 80px rgba(153, 247, 255, 0.08), 0 32px 100px rgba(0, 0, 0, 0.6)',
          maxWidth: '420px',
          width: '90vw',
          opacity: 0,
          transform: 'scale(0.9)',
          animation: 'kwhCardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Crown icon */}
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{
            background: 'rgba(153, 247, 255, 0.1)',
            border: '1px solid rgba(153, 247, 255, 0.2)',
            boxShadow: '0 0 40px rgba(153, 247, 255, 0.15)',
          }}
        >
          <Crown className="w-7 h-7" style={{ color: '#99f7ff' }} />
        </div>

        {/* Title */}
        <div
          className="text-[11px] font-medium uppercase tracking-[0.18em] mb-2"
          style={{ color: 'rgba(153, 247, 255, 0.6)' }}
        >
          {tierLabel} Track Complete
        </div>

        {/* kWh value */}
        <div
          className="text-5xl font-bold tabular-nums mb-3"
          style={{
            color: '#f0f0f3',
            fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
            letterSpacing: '-0.03em',
          }}
        >
          +<AnimatedCounter target={reward.kwh} duration={1500} /> kWh
        </div>

        {/* Label */}
        <div className="text-[14px] leading-relaxed mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          {reward.label}
        </div>

        {/* Multiplier badge */}
        {reward.trackLevel && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mt-4 text-[11px] font-semibold"
            style={{
              background: 'rgba(153, 247, 255, 0.08)',
              border: '1px solid rgba(153, 247, 255, 0.15)',
              color: '#99f7ff',
            }}
          >
            <Zap className="w-3 h-3" />
            {reward.trackLevel === 'senior' ? '3.0' : reward.trackLevel === 'mid' ? '1.5' : '1.0'}× multiplier
          </div>
        )}

        {/* Dismiss */}
        <div className="mt-8 text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.15)' }}>
          tap to continue
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
        @keyframes kwhSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes kwhFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes kwhCardIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {reward.tier === 'lesson' && <LessonToast reward={reward} onDismiss={handleDismiss} />}
      {reward.tier === 'module' && <ModuleToast reward={reward} onDismiss={handleDismiss} />}
      {reward.tier === 'track' && <TrackToast reward={reward} onDismiss={handleDismiss} />}
    </>
  );
}
