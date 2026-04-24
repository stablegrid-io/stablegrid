'use client';

// Note: metadata export is intentionally omitted — 'use client' forbids it.
// The root layout + nested pages still set useful titles where needed.
// When Practice ships, delete this file and the normal route layout returns.

import Link from 'next/link';
import { ArrowLeft, Wrench } from 'lucide-react';

/**
 * Temporary layout that replaces every /practice/* route with an
 * under-construction screen. Any children (the nested page.tsx files) are
 * intentionally ignored — when we're ready to ship Practice again, delete this
 * file and the nested routes light back up automatically.
 */
export default function PracticeLayout() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: '#0a0c0e',
        color: 'rgba(255,255,255,0.92)',
        fontFamily:
          '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif'
      }}
    >
      {/* Background image — BESS racks */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/practice-under-construction.png)',
          backgroundPosition: 'center center',
          filter: 'brightness(0.38) saturate(1.05)'
        }}
      />

      {/* Amber tint overlay */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 55%, rgba(255,201,101,0.18) 0%, transparent 55%)'
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.75) 100%)'
        }}
      />

      {/* Top gradient to help the eyebrow legibility */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-64"
        style={{ background: 'linear-gradient(to bottom, rgba(10,12,14,0.7), transparent)' }}
      />

      {/* L-bracket corner markers */}
      <Corner position="top-left" />
      <Corner position="top-right" />
      <Corner position="bottom-left" />
      <Corner position="bottom-right" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes ucFadeUp {
              from { opacity: 0; transform: translateY(14px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes ucPulse {
              0%, 100% { opacity: 0.55; }
              50%      { opacity: 1; }
            }
          `
          }}
        />

        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
          style={{
            border: '1px solid rgba(255,201,101,0.4)',
            background: 'rgba(255,201,101,0.1)',
            opacity: 0,
            animation: 'ucFadeUp 600ms cubic-bezier(.16,1,.3,1) 100ms forwards'
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: '#ffc965',
              animation: 'ucPulse 1.6s ease-in-out infinite'
            }}
          />
          <Wrench className="h-3.5 w-3.5" style={{ color: '#ffc965' }} strokeWidth={2.5} />
          <span
            className="font-mono"
            style={{
              fontSize: 10.5,
              letterSpacing: '0.22em',
              color: '#ffc965',
              textTransform: 'uppercase',
              fontWeight: 700
            }}
          >
            Maintenance · Practice section
          </span>
        </div>

        <h1
          style={{
            marginTop: 28,
            fontSize: 'clamp(2.5rem, 9vw, 7rem)',
            fontWeight: 900,
            letterSpacing: '-0.055em',
            lineHeight: 0.95,
            color: 'rgba(255,255,255,0.98)',
            textTransform: 'uppercase',
            textShadow: '0 4px 40px rgba(0,0,0,0.6)',
            maxWidth: '18ch',
            opacity: 0,
            animation: 'ucFadeUp 700ms cubic-bezier(.16,1,.3,1) 200ms forwards'
          }}
        >
          Sorry,<br />
          <span style={{ color: '#ffc965' }}>it&apos;s under<br />construction.</span>
        </h1>

        <p
          style={{
            marginTop: 28,
            fontSize: 16,
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.55)',
            maxWidth: 520,
            opacity: 0,
            animation: 'ucFadeUp 700ms cubic-bezier(.16,1,.3,1) 320ms forwards'
          }}
        >
          We&apos;re rebuilding Practice from the ground up so it actually earns its place next to the
          Grid. Theory is live, the Grid is live — this one&apos;s worth the wait.
        </p>

        <Link
          href="/home"
          className="group mt-10 inline-flex items-center gap-2 transition-all"
          style={{
            padding: '13px 22px',
            borderRadius: 14,
            background: '#ffc965',
            color: '#0a0c0e',
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            boxShadow: '0 8px 30px rgba(255,201,101,0.25)',
            opacity: 0,
            animation: 'ucFadeUp 700ms cubic-bezier(.16,1,.3,1) 440ms forwards'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 14px 40px rgba(255,201,101,0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,201,101,0.25)';
          }}
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          Back to home
        </Link>
      </div>
    </div>
  );
}

function Corner({
  position
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const isTop = position.startsWith('top');
  const isLeft = position.endsWith('left');
  const color = 'rgba(255,201,101,0.6)';

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        [isTop ? 'top' : 'bottom']: 24,
        [isLeft ? 'left' : 'right']: 24,
        width: 28,
        height: 28,
        zIndex: 20,
        pointerEvents: 'none'
      }}
    >
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
