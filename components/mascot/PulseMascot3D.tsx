'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PulseAction, PulseMood, PulseMotion } from '@/types/mascot';

interface PulseMascot3DProps {
  mood?: PulseMood;
  motion?: PulseMotion;
  action?: PulseAction;
  className?: string;
  height?: number;
  interactive?: boolean;
  title?: string;
  showLabel?: boolean;
  modelUrl?: string;
}

const SPEED_BY_MOTION: Record<PulseMotion, number> = {
  steady: 0.7,
  flow: 1,
  surge: 1.35
};

const ACTION_MULTIPLIER: Record<PulseAction, number> = {
  idle: 1,
  wave: 1.2,
  celebrate: 1.45
};

const MOUTH_SWAY_BY_MOOD: Record<PulseMood, number> = {
  calm: 0.2,
  focused: 0.35,
  happy: 0.55,
  alert: 1.2
};

const VIEWBOX_WIDTH = 180;
const VIEWBOX_HEIGHT = 240;
const FIGURE_RATIO = VIEWBOX_WIDTH / VIEWBOX_HEIGHT;

function pathFromPoints(points: Array<[number, number]>) {
  return points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
}

function buildMouthPath(mood: PulseMood, t: number) {
  const baseNeutral: Array<[number, number]> = [
    [78, 102],
    [82, 99],
    [86, 104],
    [90, 100],
    [94, 104],
    [98, 99],
    [102, 102]
  ];

  const baseHappy: Array<[number, number]> = [
    [78, 102],
    [81, 98],
    [84, 106],
    [87, 100],
    [90, 108],
    [93, 100],
    [96, 106],
    [99, 98],
    [102, 102]
  ];

  const selected = mood === 'happy' ? baseHappy : baseNeutral;
  const sway = MOUTH_SWAY_BY_MOOD[mood];

  const adjusted = selected.map(([x, y], index) => {
    const extraAlert = mood === 'alert' ? Math.sin(index * 1.6 + t * 7.5) * 0.7 : 0;
    const offset = Math.sin(index * 1.1 + t * 4.5) * sway + extraAlert;
    return [x, y + offset] as [number, number];
  });

  return pathFromPoints(adjusted);
}

export function PulseMascot3D({
  mood = 'focused',
  motion = 'flow',
  action = 'idle',
  className,
  height = 220,
  interactive = true,
  title = 'Pulse mascot',
  showLabel = false
}: PulseMascot3DProps) {
  const [t, setT] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const speed = SPEED_BY_MOTION[motion] * ACTION_MULTIPLIER[action];

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setT((value) => value + 0.024 * speed);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [speed]);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;

      setTilt({
        x: Math.max(-8, Math.min(8, -ny * 20)),
        y: Math.max(-10, Math.min(10, nx * 24))
      });
    },
    [interactive]
  );

  const resetTilt = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const mouthPath = buildMouthPath(mood, t);
  const rings = [14, 22, 30, 40, 52];

  const stageHeight = showLabel ? Math.max(120, height - 34) : height;
  const stageWidth = Math.round(stageHeight * FIGURE_RATIO);
  const verticalDrift = Math.sin(t * 0.9) * -2.2;
  const figureStyle = useMemo(
    () => ({
      transform: `perspective(900px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) translateY(${verticalDrift.toFixed(2)}px)`,
      transition: 'transform 90ms linear'
    }),
    [tilt.x, tilt.y, verticalDrift]
  );

  return (
    <div
      className={`relative w-full overflow-visible ${className ?? ''}`}
      style={{ height }}
      onPointerMove={onPointerMove}
      onPointerLeave={resetTilt}
      onPointerUp={resetTilt}
      onPointerCancel={resetTilt}
      role="img"
      aria-label={title}
      title={title}
    >
      <div className="relative mx-auto flex h-full items-center justify-center" style={figureStyle}>
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          width={stageWidth}
          height={stageHeight}
          style={{ overflow: 'visible' }}
        >
          {[82, 90, 98].map((x) => (
            <ellipse
              key={x}
              cx={x}
              cy={12}
              rx="3.4"
              ry="3.4"
              fill="rgba(45,212,191,0.9)"
              opacity={0.72 + Math.sin(t * 3 + x) * 0.25}
            />
          ))}

          {rings.map((r, i) => (
            <ellipse
              key={r}
              cx="90"
              cy="148"
              rx={r * 1.5}
              ry={r * 0.8}
              fill="none"
              stroke={`rgba(45,212,191,${Math.max(0.05, 0.35 - i * 0.06).toFixed(3)})`}
              strokeWidth={2.5 - i * 0.3}
              opacity={0.3 + Math.sin(t * 1.2 - i * 0.6) * 0.3}
            />
          ))}

          <ellipse cx="90" cy="148" rx="28" ry="38" fill="rgba(10,40,38,0.26)" />
          <ellipse cx="90" cy="148" rx="18" ry="26" fill="rgba(20,90,80,0.24)" />
          <ellipse cx="90" cy="148" rx="10" ry="16" fill="rgba(45,212,191,0.18)" />

          {[-18, -10, 0, 10, 18].map((dy, i) => {
            const amp = 12 - Math.abs(dy) * 0.3;
            const pts = Array.from({ length: 24 }, (_, j) => {
              const x = 62 + j * 2.4;
              const y = 148 + dy + Math.sin(j * 0.8 + t * 2 + i) * amp;
              return `${j === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            }).join(' ');
            return (
              <path
                key={dy}
                d={pts}
                fill="none"
                stroke={`rgba(45,212,191,${(0.4 - Math.abs(dy) * 0.012).toFixed(3)})`}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}

          <path
            d="M 62 138 Q 50 130 38 138 Q 28 150 40 160 Q 48 164 56 158"
            fill="none"
            stroke="rgba(45,212,191,0.75)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 118 138 Q 130 130 142 138 Q 152 150 140 160 Q 132 164 124 158"
            fill="none"
            stroke="rgba(45,212,191,0.75)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {[36, 148].map((cx) => (
            <g key={cx}>
              <ellipse
                cx={cx}
                cy="162"
                rx="10"
                ry="10"
                fill="rgba(10,40,38,0.6)"
                stroke="rgba(45,212,191,0.5)"
                strokeWidth="1.5"
              />
              <ellipse cx={cx} cy="162" rx="5" ry="5" fill="rgba(45,212,191,0.35)" />
              <ellipse cx={cx} cy="162" rx="2" ry="2" fill="rgba(45,212,191,0.8)" />
            </g>
          ))}

          <path
            d="M 80 184 Q 76 206 78 222"
            stroke="rgba(30,160,140,0.55)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 100 184 Q 104 206 102 222"
            stroke="rgba(30,160,140,0.55)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="78" cy="223" rx="9" ry="4" fill="rgba(45,212,191,0.25)" />
          <ellipse cx="102" cy="223" rx="9" ry="4" fill="rgba(45,212,191,0.25)" />

          <ellipse cx="90" cy="88" rx="25" ry="25" fill="rgba(10,40,38,0.42)" />
          <ellipse cx="90" cy="88" rx="18" ry="18" fill="rgba(20,90,80,0.4)" />
          <ellipse cx="90" cy="86" rx="10" ry="10" fill="rgba(45,212,191,0.3)" />

          {[32, 26, 20].map((r, i) => (
            <ellipse
              key={r}
              cx="90"
              cy="88"
              rx={r}
              ry={r}
              fill="none"
              stroke={`rgba(45,212,191,${(0.12 + i * 0.04).toFixed(3)})`}
              strokeWidth="1"
              opacity={0.5 + Math.sin(t + i) * 0.3}
            />
          ))}

          {[-16, -8, 0, 8, 16].map((dx) => (
            <g key={dx}>
              <path
                d={`M ${90 + dx * 0.3} 62 Q ${90 + dx * 0.7} ${54 - Math.abs(dx) * 0.4} ${90 + dx} ${46 - Math.abs(dx) * 0.5}`}
                fill="none"
                stroke="rgba(45,212,191,0.7)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <ellipse
                cx={90 + dx}
                cy={44 - Math.abs(dx) * 0.5}
                rx="2"
                ry="2"
                fill="rgba(45,212,191,0.9)"
              />
            </g>
          ))}

          <ellipse cx="78" cy="86" rx="9" ry="9" fill="rgba(10,40,38,0.8)" />
          <ellipse cx="102" cy="86" rx="9" ry="9" fill="rgba(10,40,38,0.8)" />
          {[8, 6, 4, 2].map((r, i) => (
            <g key={r}>
              <ellipse
                cx="78"
                cy="86"
                rx={r}
                ry={r}
                fill="none"
                stroke={`rgba(45,212,191,${(0.3 + i * 0.15).toFixed(3)})`}
                strokeWidth="1"
              />
              <ellipse
                cx="102"
                cy="86"
                rx={r}
                ry={r}
                fill="none"
                stroke={`rgba(45,212,191,${(0.3 + i * 0.15).toFixed(3)})`}
                strokeWidth="1"
              />
            </g>
          ))}
          <ellipse cx="78" cy="86" rx="2" ry="2" fill="rgba(45,212,191,0.95)" />
          <ellipse cx="102" cy="86" rx="2" ry="2" fill="rgba(45,212,191,0.95)" />

          <path
            d={mouthPath}
            fill="none"
            stroke="rgba(45,212,191,0.8)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <text
            x="90"
            y="77"
            textAnchor="middle"
            fontSize="7"
            fontWeight="900"
            fill="rgba(45,212,191,0.7)"
            fontFamily="'Courier New', monospace"
          >
            50.0
          </text>
        </svg>
      </div>

      {showLabel ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-center">
          <div className="text-[34px] leading-none text-teal-100">Pulse</div>
          <div className="text-[12px] font-medium tracking-[0.05em] text-cyan-300/75">Frequency Entity</div>
        </div>
      ) : null}
    </div>
  );
}
