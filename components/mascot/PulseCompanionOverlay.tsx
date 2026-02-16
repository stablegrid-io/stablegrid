'use client';

import { useCallback, useEffect, useState } from 'react';
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
      <div className="pointer-events-auto animate-[pulseCompanionFloat_4.2s_ease-in-out_infinite]">
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
