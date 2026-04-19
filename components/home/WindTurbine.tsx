'use client';

import { useId, type CSSProperties } from 'react';
import styles from './WindTurbine.module.css';

interface WindTurbineProps {
  size?: 'main' | 'compact' | 'custom';
  width?: number;
  height?: number;
  speed?: number;
  scale?: number;
  background?: string;
  showBeacon?: boolean;
  className?: string;
  style?: CSSProperties;
}

const PRESETS = {
  main:    { w: 640, h: 760, speed: 8 },
  compact: { w: 520, h: 760, speed: 9 },
  custom:  { w: 640, h: 760, speed: 8 },
} as const;

export default function WindTurbine({
  size = 'main',
  width,
  height,
  speed,
  scale = 0.78,
  background = 'transparent',
  showBeacon = true,
  className = '',
  style = {},
}: WindTurbineProps) {
  const preset = PRESETS[size] ?? PRESETS.main;
  const W = width ?? preset.w;
  const H = height ?? preset.h;
  const spinSpeed = speed ?? preset.speed;

  const uid = useId().replace(/:/g, '');
  const spinVar = `--wt-spin-${uid}`;

  const P = {
    litPeak:  '#f5f3ee',
    lit:      '#dcd8d0',
    midTone:  '#8a867e',
    shadow:   '#3a3a3b',
    outline:  '#14171c',
    chord:    '#5a5b5f',
    rim:      '#3d5570',
    beacon:   '#ff3b2f',
  };

  const towerH = 360;
  const towerTopHalf = 7;
  const towerBotHalf = 11;
  const rotorR = 155;
  const hubY = -towerH;
  const tiltDeg = 66;
  const yawDeg = -12;
  const iso = Math.cos((tiltDeg * Math.PI) / 180);

  const nacL = 62;
  const nacH = 22;
  const nacOffsetX = -yawDeg * 0.5;

  const bw = 18;
  const root = 12;
  const tip = rotorR;
  const tipTaper = 0.18;
  const leading = `M 0 -${root} C ${bw * 0.85} -${root + 10}, ${bw * 0.52} -${tip * 0.5}, ${bw * tipTaper} -${tip + 2} L 0 -${tip} Z`;
  const trailing = `M 0 -${root} C -${bw * 0.18} -${root + 14}, -${bw * 0.28} -${tip * 0.55}, -${bw * tipTaper * 0.6} -${tip} L 0 -${tip} Z`;
  const rootFairing = `M ${bw * 0.6} -${root + 2} C ${bw * 0.3} -${root - 3}, -${bw * 0.3} -${root - 3}, -${bw * 0.25} -${root + 2} L 0 -${root} Z`;
  const chordPath = `M 0 -${root - 1} C 0 -${tip * 0.4}, ${bw * tipTaper * 0.35} -${tip * 0.7}, ${bw * tipTaper * 0.5} -${tip}`;

  const bladeAngles = [0, 120, 240];

  return (
    <div
      className={`${styles.turbineRoot} ${className}`}
      style={{
        width: W,
        height: H,
        background,
        [spinVar]: `${spinSpeed}s`,
        ...style,
      } as CSSProperties}
      aria-hidden="true"
    >
      {background !== 'transparent' && (
        <>
          <div className={styles.lightSource} />
          <div className={styles.vignette} />
        </>
      )}

      <div className={styles.swayWrap}>
        <svg
          className={styles.svg}
          viewBox="-300 -440 600 640"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`scale(${scale}) translate(0, ${-180 * (1 - scale) / scale})`}>
          <defs>
            <linearGradient id={`tower-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={P.shadow} />
              <stop offset="18%"  stopColor={P.midTone} />
              <stop offset="42%"  stopColor={P.lit} />
              <stop offset="52%"  stopColor={P.litPeak} />
              <stop offset="65%"  stopColor={P.lit} />
              <stop offset="85%"  stopColor={P.midTone} />
              <stop offset="100%" stopColor={P.rim} />
            </linearGradient>

            <linearGradient id={`nac-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={P.litPeak} />
              <stop offset="40%"  stopColor={P.lit} />
              <stop offset="80%"  stopColor={P.midTone} />
              <stop offset="100%" stopColor={P.shadow} />
            </linearGradient>

            <linearGradient id={`bladeLit-${uid}`} x1="0" y1="0" x2="0" y2="-1">
              <stop offset="0%"   stopColor={P.lit} />
              <stop offset="60%"  stopColor={P.litPeak} />
              <stop offset="100%" stopColor={P.lit} />
            </linearGradient>
            <linearGradient id={`bladeShadow-${uid}`} x1="0" y1="0" x2="0" y2="-1">
              <stop offset="0%"   stopColor={P.shadow} />
              <stop offset="60%"  stopColor={P.midTone} />
              <stop offset="100%" stopColor={P.midTone} />
            </linearGradient>

            <radialGradient id={`hub-${uid}`} cx="0.35" cy="0.3" r="0.75">
              <stop offset="0%"   stopColor={P.litPeak} />
              <stop offset="70%"  stopColor={P.lit} />
              <stop offset="100%" stopColor={P.midTone} />
            </radialGradient>
          </defs>

          {/* TOWER */}
          <g>
            <path
              d={`M -${towerTopHalf} ${hubY + 8} L ${towerTopHalf} ${hubY + 8} L ${towerBotHalf} 156 L -${towerBotHalf} 156 Z`}
              fill={`url(#tower-${uid})`}
            />
            <ellipse cx="0" cy={hubY + 8} rx={towerTopHalf} ry={towerTopHalf * 0.32} fill={P.shadow} />
            <ellipse cx="0" cy={hubY + 6} rx={towerTopHalf * 0.95} ry={towerTopHalf * 0.28}
              fill="none" stroke={P.outline} strokeWidth="0.5" opacity="0.6" />
            <path
              d={`M -${towerBotHalf} 156 A ${towerBotHalf} ${towerBotHalf * 0.3} 0 0 0 ${towerBotHalf} 156`}
              fill={P.shadow}
            />
            {[0.35, 0.68].map(t => {
              const y = hubY + 8 + (156 - (hubY + 8)) * t;
              const h = towerTopHalf + (towerBotHalf - towerTopHalf) * t;
              return <ellipse key={t} cx="0" cy={y} rx={h} ry={h * 0.28}
                fill="none" stroke={P.outline} strokeWidth="0.4" opacity="0.35" />;
            })}
            <path d={`M ${towerTopHalf * 0.18} ${hubY + 10} L ${towerBotHalf * 0.18} 154`}
              stroke={P.litPeak} strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
          </g>

          {/* NACELLE */}
          <g transform={`translate(${nacOffsetX}, ${hubY})`}>
            <ellipse cx="0" cy={nacH * 0.35} rx={towerTopHalf * 1.1} ry={towerTopHalf * 0.32}
              fill={P.shadow} opacity="0.8" />
            <rect x={-nacL * 0.35} y={-nacH * 0.55} width={nacL} height={nacH}
              rx={nacH * 0.45} fill={`url(#nac-${uid})`}
              stroke={P.outline} strokeWidth="0.6" />
            <rect x={-nacL * 0.3} y={-nacH * 0.52} width={nacL * 0.92} height="1.2"
              fill={P.litPeak} opacity="0.7" rx="0.5" />
            <rect x={nacL * 0.6} y={-nacH * 0.32} width="4" height={nacH * 0.7}
              fill={P.shadow} rx="0.8" />
            {showBeacon && (
              <g transform={`translate(${nacL * 0.28}, ${-nacH * 0.58})`}>
                <circle r="1.8" fill={P.beacon}>
                  <animate attributeName="opacity" values="1;0.25;1" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle r="4.5" fill={P.beacon} opacity="0.15">
                  <animate attributeName="opacity" values="0.28;0.05;0.28" dur="2.4s" repeatCount="indefinite" />
                </circle>
              </g>
            )}
          </g>

          {/* ROTOR */}
          <g transform={`translate(0, ${hubY}) rotate(${yawDeg}) scale(1, ${iso}) rotate(${-yawDeg})`}>
            <g className={styles.spinner} style={{ animationDuration: `var(${spinVar})` }}>
              {bladeAngles.map(a => (
                <g key={a} transform={`rotate(${a})`}>
                  <path d={trailing} fill={`url(#bladeShadow-${uid})`}
                    stroke={P.outline} strokeWidth="0.8" strokeLinejoin="round" />
                  <path d={leading} fill={`url(#bladeLit-${uid})`}
                    stroke={P.outline} strokeWidth="0.8" strokeLinejoin="round" />
                  <path d={chordPath} fill="none" stroke={P.chord}
                    strokeWidth="0.6" strokeLinecap="round" opacity="0.5" />
                  <path d={rootFairing} fill={`url(#bladeLit-${uid})`}
                    stroke={P.outline} strokeWidth="0.6" strokeLinejoin="round" />
                </g>
              ))}
            </g>
          </g>

          {/* NOSE CONE */}
          <g transform={`translate(${-nacOffsetX * 0.4}, ${hubY})`}>
            <circle r="10" fill={`url(#hub-${uid})`} stroke={P.outline} strokeWidth="0.6" />
            <circle r="5" fill={P.lit} opacity="0.4" />
            <circle r="2" fill={P.shadow} opacity="0.5" />
          </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
