'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import type { PulseAction, PulseMood, PulseMotion } from '@/types/mascot';
import { PulseMascot3D } from '@/components/mascot/PulseMascot3D';

interface PulseCompanionOverlayProps {
  targetSelector?: string;
  mood?: PulseMood;
  motion?: PulseMotion;
  action?: PulseAction;
  className?: string;
  size?: number;
  modelUrl?: string;
  hiddenOnMobile?: boolean;
}

const VIEWPORT_MARGIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function PulseCompanionOverlay({
  targetSelector,
  mood = 'focused',
  motion = 'flow',
  action = 'idle',
  className,
  size = 164,
  modelUrl,
  hiddenOnMobile = true
}: PulseCompanionOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const isLight = resolvedTheme === 'light';

  const fallbackPosition = useCallback(() => {
    if (typeof window === 'undefined') return { x: VIEWPORT_MARGIN, y: 72 };
    const centeredY = (window.innerHeight - size) / 2;
    return {
      x: Math.max(VIEWPORT_MARGIN, window.innerWidth - size - 10),
      y: clamp(centeredY, 72, window.innerHeight - size - VIEWPORT_MARGIN)
    };
  }, [size]);

  const resolvePosition = useCallback(() => {
    const fallback = fallbackPosition();

    if (!targetSelector) {
      setPosition(fallback);
      return;
    }

    const target = document.querySelector(targetSelector);
    if (!target || typeof target.getBoundingClientRect !== 'function') {
      setPosition(fallback);
      return;
    }

    const rect = target.getBoundingClientRect();
    const x = clamp(
      rect.right - size * 0.3,
      VIEWPORT_MARGIN,
      window.innerWidth - size - VIEWPORT_MARGIN
    );
    const y = clamp(
      rect.top - size * 0.58,
      72,
      window.innerHeight - size - VIEWPORT_MARGIN
    );

    setPosition({ x, y });
  }, [fallbackPosition, size, targetSelector]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    setPosition(fallbackPosition());
    resolvePosition();

    const onViewportUpdate = () => resolvePosition();

    window.addEventListener('resize', onViewportUpdate);
    window.addEventListener('scroll', onViewportUpdate, true);

    const intervalId = window.setInterval(resolvePosition, 700);

    return () => {
      window.removeEventListener('resize', onViewportUpdate);
      window.removeEventListener('scroll', onViewportUpdate, true);
      window.clearInterval(intervalId);
    };
  }, [fallbackPosition, mounted, resolvePosition]);

  if (!mounted) return null;

  return (
    <aside
      className={`pointer-events-none fixed left-0 top-0 z-[70] ${
        hiddenOnMobile ? 'hidden xl:block' : ''
      } ${className ?? ''}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        opacity: 1,
        transition: 'transform 0.34s cubic-bezier(0.22, 0.8, 0.24, 1), opacity 0.2s ease'
      }}
      aria-hidden
    >
      <div className="pointer-events-auto relative animate-[pulseCompanionFloat_4.2s_ease-in-out_infinite]">
        {isLight ? (
          <>
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 rounded-[42%] border border-[#9dcab7]/45"
              style={{
                width: size * 0.78,
                height: size * 0.9,
                transform: 'translate(-50%, -50%)',
                background:
                  'linear-gradient(180deg, rgba(249,255,252,0.94) 0%, rgba(229,247,238,0.82) 100%)',
                boxShadow:
                  '0 12px 24px rgba(22, 82, 61, 0.16), inset 0 1px 0 rgba(255,255,255,0.7)'
              }}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 rounded-full"
              style={{
                width: size * 0.56,
                height: size * 0.56,
                transform: 'translate(-50%, -48%)',
                background:
                  'radial-gradient(circle, rgba(16,185,129,0.14), rgba(16,185,129,0) 70%)'
              }}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-full -z-10 rounded-full"
              style={{
                width: size * 0.38,
                height: size * 0.08,
                transform: 'translate(-50%, -18px)',
                background:
                  'radial-gradient(circle, rgba(14, 70, 52, 0.24), rgba(14, 70, 52, 0) 72%)'
              }}
            />
          </>
        ) : null}
        <div className="relative">
          <PulseMascot3D
            mood={mood}
            motion={motion}
            action={action}
            interactive
            height={size}
            showLabel={false}
            modelUrl={modelUrl}
            title="Pulse companion"
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes pulseCompanionFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </aside>
  );
}
