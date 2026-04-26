'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import type { TrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';
import { BATTERY_CAPACITY_KWH } from '@/lib/energy';

/* ── Types ── */
interface HomeDashboardProps {
  user: User;
  displayName: string | null;
  topicProgress: TopicProgress[];
  recentSessions: ReadingSession[];
  completedSessions: ReadingSession[];
  latestTheorySession: ReadingSession | null;
  lastClockedInAt: string | null;
  latestTaskAction: {
    title: string; summary: string; statLine: string;
    actionLabel: string; actionHref: string; topicId: Topic;
    accentRgb?: string; progressPct?: number;
  };
  readingSignals: ReadingSignal[];
  trackMetaByTopic: TrackMetaByTopic;
  stats: { totalXp: number; currentStreak: number; questionsCompleted: number; overallAccuracy: number };
  resumeContext?: { chapterTitle: string; lessonTitle: string } | null;
  learnHref: string;
  learnLabel: string;
  practiceHref: string;
  practiceLabel: string;
  gridHint: { componentName: string; costKwh: number } | null;
}

/* ── Dashboard ── */
export const HomeDashboard = ({
  user,
  displayName,
  topicProgress: _topicProgress,
  recentSessions: _recentSessions,
  completedSessions: _completedSessions,
  latestTheorySession: _latestTheorySession,
  lastClockedInAt: _lastClockedInAt,
  latestTaskAction: _latestTaskAction,
  readingSignals: _readingSignals,
  trackMetaByTopic: _trackMetaByTopic,
  stats,
  resumeContext: _resumeContext,
  learnHref,
  learnLabel,
  practiceHref,
  practiceLabel,
  gridHint,
}: HomeDashboardProps) => {

  const firstName = (
    displayName ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ?? 'Operator'
  ).split(' ')[0];

  // Live balance: seed from server prop, refetch on mount + window focus so
  // returning from /grid after a purchase shows the updated reserve.
  const [availableKwh, setAvailableKwh] = useState(stats.totalXp);

  useEffect(() => {
    let cancelled = false;
    const refetch = async () => {
      try {
        const r = await fetch('/api/user/balance', { cache: 'no-store' });
        if (!r.ok || cancelled) return;
        const json = await r.json();
        if (typeof json?.balance === 'number') setAvailableKwh(json.balance);
      } catch { /* keep prior value */ }
    };
    refetch();
    window.addEventListener('focus', refetch);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refetch);
    };
  }, []);

  const capacityKwh = BATTERY_CAPACITY_KWH;
  const batteryFill = Math.min(1, availableKwh / capacityKwh);
  const chargePct = Math.round(batteryFill * 100);
  const headroomKwh = Math.max(0, capacityKwh - availableKwh);
  const kWh = availableKwh.toLocaleString();

  const anim = (delay: number) =>
    ({ opacity: 0, animation: `homeFadeUp .7s cubic-bezier(.16,1,.3,1) ${delay}ms forwards` }) as const;

  // Random greeting picked after hydration so server + client render the same
  // initial variant (index 0). Picking randomly during SSR causes a hydration
  // mismatch — server and client get different Math.random() values.
  const [defaultVariantIdx, setDefaultVariantIdx] = useState(0);
  useEffect(() => {
    setDefaultVariantIdx(Math.floor(Math.random() * 5));
  }, []);

  const greetingLine = useMemo(() => {
    const name = <span style={{ color: '#99f7ff' }}>{firstName}</span>;
    const streak = stats.currentStreak;
    const lifetime = stats.totalXp;

    // Streak — most specific signal
    if (streak >= 3) return <>Day {streak}, {name}.</>;

    // Tier proximity — within the last 1,000 kWh before an unlock
    if (lifetime >= 9000 && lifetime < 10000) {
      return <>{(10000 - lifetime).toLocaleString()} kWh from Mid, {name}.</>;
    }
    if (lifetime >= 29000 && lifetime < 30000) {
      return <>{(30000 - lifetime).toLocaleString()} kWh from Senior, {name}.</>;
    }

    // First-time vibe
    if (lifetime < 100) return <>Welcome, {name}.</>;

    // Default — random per page load, stable within session
    const variants = [
      <>Welcome back, {name}.</>,
      <>Back at it, {name}.</>,
      <>Good to see you, {name}.</>,
      <>Right where you left off, {name}.</>,
      <>Ready when you are, {name}.</>,
    ];
    return variants[defaultVariantIdx];
  }, [firstName, stats.currentStreak, stats.totalXp, defaultVariantIdx]);

  return (
    <div
      className="relative overflow-hidden h-[calc(100dvh-3.5rem)]"
      style={{
        backgroundImage: 'url(/home-hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Bottom fade — darkens the gravel/foreground band so the hero stack reads cleanly */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '38%',
          background:
            'linear-gradient(to bottom, rgba(8,10,12,0) 0%, rgba(8,10,12,0.55) 55%, rgba(8,10,12,0.92) 100%)',
        }}
      />

      {/* ── Hero stack: headline · metadata · text-link ── */}
      <div className="relative h-full mx-auto flex flex-col items-center justify-center text-center px-6">
        <h1
          style={{
            opacity: 0,
            overflow: 'hidden',
            willChange: 'opacity, transform, max-height, filter',
            animation: 'homeGreetingLifecycle 4.6s linear 0ms forwards',
            fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
            fontSize: 'clamp(2.75rem, 7vw, 5.5rem)',
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.03,
            color: 'rgba(255,255,255,0.97)',
            maxWidth: '14ch',
          }}
        >
          {greetingLine}
        </h1>

        <div
          className="relative flex flex-col items-center overflow-hidden"
          style={{
            ...anim(180),
            marginBottom: 40,
            gap: 14,
            padding: '32px 56px 28px',
            borderRadius: 24,
            background:
              'radial-gradient(120% 80% at 50% -10%, rgba(153,247,255,0.08) 0%, rgba(153,247,255,0) 55%), linear-gradient(180deg, rgba(18,22,24,0.72) 0%, rgba(14,17,19,0.72) 100%)',
            backdropFilter: 'blur(28px) saturate(150%)',
            WebkitBackdropFilter: 'blur(28px) saturate(150%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow:
              '0 30px 80px -20px rgba(0,0,0,0.55), 0 8px 24px -8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.25)',
          }}
        >
          {/* Top accent hairline — cyan fade, Apple-style */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: 1,
              background:
                'linear-gradient(90deg, transparent 0%, rgba(153,247,255,0.55) 50%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
          {/* Soft inner vignette — subtle depth */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background:
                'radial-gradient(120% 60% at 50% 110%, rgba(0,0,0,0.35) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />

          {/* Hero stat — balance / capacity, Apple fraction style */}
          <div
            className="flex items-baseline tabular-nums"
            style={{
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              color: 'rgba(255,255,255,0.97)',
            }}
          >
            <span
              style={{
                fontSize: 'clamp(2.25rem, 3.6vw, 3rem)',
                fontWeight: 500,
                letterSpacing: '-0.035em',
                lineHeight: 1,
              }}
            >
              {kWh}
            </span>
            <span
              aria-hidden
              style={{
                margin: '0 6px 0 10px',
                fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.22)',
                lineHeight: 1,
              }}
            >
              /
            </span>
            <span
              style={{
                fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: 'rgba(255,255,255,0.42)',
                lineHeight: 1,
              }}
            >
              {capacityKwh.toLocaleString()}
            </span>
            <span
              style={{
                marginLeft: 8,
                fontSize: 14,
                fontWeight: 400,
                letterSpacing: '0.02em',
                color: 'rgba(255,255,255,0.38)',
              }}
            >
              kWh
            </span>
          </div>

          {/* Sub-label: what the fraction means */}
          <div
            className="font-mono"
            style={{
              marginTop: -4,
              fontSize: 9,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.22)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span>Balance</span>
            <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
            <span>Capacity</span>
          </div>

          {/* Status label — small caps, muted, cyan when full */}
          <div
            className="font-mono tabular-nums"
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: chargePct >= 100 ? 'rgba(153,247,255,0.7)' : 'rgba(255,255,255,0.32)',
              transition: 'color 400ms ease',
            }}
          >
            {chargePct >= 100 ? 'Battery fully charged' : `${headroomKwh.toLocaleString()} kWh to full charge`}
          </div>

          {/* Battery progress — hairline */}
          {(() => {
            const isFull = chargePct >= 100;
            return (
              <div
                style={{
                  width: 'clamp(220px, 24vw, 320px)',
                  height: 2,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 100,
                  overflow: 'hidden',
                  position: 'relative',
                  marginTop: 2,
                }}
              >
                <div
                  style={{
                    width: `${Math.max(chargePct, 1)}%`,
                    height: '100%',
                    borderRadius: 100,
                    position: 'relative',
                    background: isFull
                      ? 'linear-gradient(90deg, rgba(153,247,255,0.5) 0%, #99f7ff 50%, rgba(153,247,255,0.5) 100%)'
                      : '#99f7ff',
                    backgroundSize: isFull ? '200% 100%' : undefined,
                    animation: isFull
                      ? 'kwhFlow 2.6s linear infinite, kwhPulse 2s ease-in-out infinite'
                      : undefined,
                    boxShadow: isFull
                      ? '0 0 8px rgba(153,247,255,0.5)'
                      : '0 0 4px rgba(153,247,255,0.3)',
                    transition: 'width 1.5s cubic-bezier(.16,1,.3,1), box-shadow 400ms ease',
                  }}
                >
                  {isFull && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 100,
                        background:
                          'linear-gradient(90deg, transparent 0%, transparent 35%, rgba(255,255,255,0.9) 50%, transparent 65%, transparent 100%)',
                        backgroundSize: '220% 100%',
                        mixBlendMode: 'screen',
                        animation: 'kwhShimmer 2s linear infinite',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        <div
          className="flex items-center justify-center flex-wrap"
          style={{ ...anim(280), gap: 0, rowGap: 12 }}
        >
          <Link
            href={learnHref}
            className="home-hero-link"
            style={{
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: 'rgba(255,255,255,0.92)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 18px',
            }}
          >
            <span className="home-hero-link__label">{learnLabel}</span>
            <span
              aria-hidden
              className="home-hero-link__arrow"
              style={{ display: 'inline-block', transition: 'transform 300ms cubic-bezier(.16,1,.3,1)' }}
            >
              ↗
            </span>
          </Link>

          <span
            aria-hidden
            style={{
              width: 1,
              height: 14,
              background: 'rgba(255,255,255,0.12)',
            }}
          />

          <Link
            href={practiceHref}
            className="home-hero-link"
            style={{
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: 'rgba(255,255,255,0.92)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 18px',
            }}
          >
            <span className="home-hero-link__label">{practiceLabel}</span>
            <span
              aria-hidden
              className="home-hero-link__arrow"
              style={{ display: 'inline-block', transition: 'transform 300ms cubic-bezier(.16,1,.3,1)' }}
            >
              ↗
            </span>
          </Link>
        </div>

        {gridHint && (
          <Link
            href="/grid"
            className="home-hero-hint"
            style={{
              ...anim(420),
              marginTop: 22,
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: '-0.005em',
              color: 'rgba(255,255,255,0.48)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'color 300ms cubic-bezier(.16,1,.3,1)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#99f7ff',
                boxShadow: '0 0 6px rgba(153,247,255,0.7), 0 0 2px #99f7ff',
                animation: 'hintPulse 2.4s ease-in-out infinite',
              }}
            />
            <span>
              You have enough power to deploy{' '}
              <span style={{ color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>
                {gridHint.componentName}
              </span>
            </span>
            <span
              aria-hidden
              className="home-hero-hint__arrow"
              style={{ transition: 'transform 300ms cubic-bezier(.16,1,.3,1)' }}
            >
              →
            </span>
          </Link>
        )}
      </div>

      <style jsx global>{`
        @keyframes homeFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Apple-style greeting: enter (spring-out) → hold → fade+rise (ease-in) → collapse (soft ease-in-out).
           Per-segment animation-timing-function overrides the top-level linear so each phase gets its own curve. */
        @keyframes homeGreetingLifecycle {
          /* Enter — rises into place with a soft blur-to-clarity, Apple spring-out */
          0%   { opacity: 0; transform: translateY(22px); filter: blur(6px); max-height: 400px; margin-bottom: 32px; animation-timing-function: cubic-bezier(.16, 1, .3, 1); }
          22%  { opacity: 1; transform: translateY(0);    filter: blur(0);   max-height: 400px; margin-bottom: 32px; animation-timing-function: linear; }
          /* Hold — read time */
          63%  { opacity: 1; transform: translateY(0);    filter: blur(0);   max-height: 400px; margin-bottom: 32px; animation-timing-function: cubic-bezier(.32, 0, .67, 0); }
          /* Exit — accelerates upward while softening out with a touch of blur */
          82%  { opacity: 0; transform: translateY(-14px); filter: blur(3px); max-height: 400px; margin-bottom: 32px; animation-timing-function: cubic-bezier(.32, .72, 0, 1); }
          /* Collapse — height + margin dissolve with Apple standard easing, balance block glides up */
          100% { opacity: 0; transform: translateY(-14px); filter: blur(3px); max-height: 0;     margin-bottom: 0;    padding: 0; border: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="homeGreetingLifecycle"] {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            max-height: 400px !important;
            margin-bottom: 32px !important;
          }
        }
        @keyframes kwhFlow {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes kwhPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(153,247,255,0.4); }
          50%      { box-shadow: 0 0 14px rgba(153,247,255,0.8), 0 0 2px rgba(153,247,255,1); }
        }
        @keyframes kwhShimmer {
          0%   { background-position: 130% 0; }
          100% { background-position: -130% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="kwhFlow"], [style*="kwhPulse"], [style*="kwhShimmer"] {
            animation: none !important;
          }
        }
        .home-hero-link__label {
          position: relative;
        }
        .home-hero-link__label::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: -2px;
          height: 1px;
          background: currentColor;
          opacity: 0;
          transform: translateY(2px);
          transition: opacity 300ms cubic-bezier(.16,1,.3,1), transform 300ms cubic-bezier(.16,1,.3,1);
        }
        .home-hero-link:hover .home-hero-link__label::after {
          opacity: 0.6;
          transform: translateY(0);
        }
        .home-hero-link:hover .home-hero-link__arrow {
          transform: translate(2px, -2px);
        }
        @keyframes hintPulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        .home-hero-hint:hover {
          color: rgba(255,255,255,0.78) !important;
        }
        .home-hero-hint:hover .home-hero-hint__arrow {
          transform: translateX(3px);
        }
      `}</style>
    </div>
  );
};
