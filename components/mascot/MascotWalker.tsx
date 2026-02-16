'use client';

import { useEffect, useRef, useState } from 'react';
import { PulseMascot } from '@/components/mascot/PulseMascot';
import type { PulseAction, PulseMood, PulseMotion } from '@/types/mascot';

export type MascotWalkBounds = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

interface MascotWalkerProps {
  bounds: MascotWalkBounds;
  mood?: PulseMood;
  motion?: PulseMotion;
  action?: PulseAction;
  size?: number;
  speed?: number;
  className?: string;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduced(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return reduced;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      const rect = element.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    });

    observer.observe(element);
    const rect = element.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

export function MascotWalker({
  bounds,
  mood = 'focused',
  motion = 'flow',
  action = 'wave',
  size = 150,
  speed = 56,
  className
}: MascotWalkerProps) {
  const reducedMotion = useReducedMotion();
  const { ref: stageRef, size: stageSize } = useElementSize<HTMLDivElement>();
  const mascotRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({
    x: 0,
    dir: 1 as 1 | -1,
    lastT: 0,
    elapsed: 0
  });

  useEffect(() => {
    const maxX = Math.max(0, stageSize.width - size);
    stateRef.current.x = Math.min(maxX, maxX * 0.3);
  }, [stageSize.width, size]);

  useEffect(() => {
    let frame = 0;

    const tick = (time: number) => {
      const state = stateRef.current;
      const dt = state.lastT ? (time - state.lastT) / 1000 : 0;
      state.lastT = time;
      state.elapsed += dt;

      const maxX = Math.max(0, stageSize.width - size);

      if (!reducedMotion) {
        state.x += state.dir * speed * dt;
        if (state.x <= 0) {
          state.x = 0;
          state.dir = 1;
        } else if (state.x >= maxX) {
          state.x = maxX;
          state.dir = -1;
        }
      }

      if (mascotRef.current) {
        const facing = state.dir === 1 ? 1 : -1;

        if (reducedMotion) {
          mascotRef.current.style.transform = `translate3d(${state.x}px, 0px, 0px) scaleX(${facing})`;
        } else {
          const bob = Math.sin(state.elapsed * 8.2) * 2.8;
          const roll = Math.sin(state.elapsed * 8.2 + Math.PI / 2) * 1.2;
          mascotRef.current.style.transform = `translate3d(${state.x}px, ${-bob}px, 0px) scaleX(${facing}) rotate(${facing * roll}deg)`;
        }
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reducedMotion, size, speed, stageSize.width]);

  const mascotHeight = Math.round(size * 1.22);

  return (
    <div
      ref={stageRef}
      className={className}
      style={{
        position: 'absolute',
        top: bounds.top,
        left: bounds.left,
        right: bounds.right,
        bottom: bounds.bottom,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
      aria-hidden
    >
      <div
        ref={mascotRef}
        style={{
          position: 'absolute',
          bottom: 0,
          width: size,
          height: mascotHeight,
          transformOrigin: '50% 100%',
          willChange: 'transform',
          filter: 'drop-shadow(0 8px 20px rgba(45,212,191,0.28))'
        }}
      >
        <PulseMascot
          mood={mood}
          motion={motion}
          action={action}
          size={size}
          interactive={false}
        />
      </div>
    </div>
  );
}
