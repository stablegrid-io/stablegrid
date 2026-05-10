'use client';

/**
 * Wraps the landing-page specimen-lesson card in a mouse-tracked 3D tilt.
 *
 * The article inside stays server-rendered — only the perspective/transform
 * shell is client-side. Tilt is bounded to ±4° on X and ±6° on Y so the
 * editorial structure (sharp borders, prose proportions) reads as itself
 * just lifted off the page, not as a gimmick.
 *
 * Disabled under prefers-reduced-motion: the wrapper renders flat and skips
 * pointer-tracking entirely so vestibular-sensitive users see a still card.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface Lesson3DCardProps {
  children: React.ReactNode;
}

const MAX_ROTATE_X_DEG = 4;
const MAX_ROTATE_Y_DEG = 6;
const HOVER_LIFT_PX = 6;

export function Lesson3DCard({ children }: Lesson3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const handleMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 2 * MAX_ROTATE_X_DEG,
      ry: (px - 0.5) * 2 * MAX_ROTATE_Y_DEG,
    });
  }, [reducedMotion]);

  const handleLeave = useCallback(() => {
    setHovered(false);
    setTilt({ rx: 0, ry: 0 });
  }, []);

  if (reducedMotion) {
    return <div className="transform-none">{children}</div>;
  }

  return (
    <div style={{ perspective: '1400px' }}>
      <div
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleLeave}
        onMouseMove={handleMove}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(${hovered ? HOVER_LIFT_PX : 0}px)`,
          transition: 'transform 220ms ease-out',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}
