'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
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
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const isDark = resolvedTheme !== 'light';

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
  const rings = isDark ? [14, 22, 30, 40, 52] : [16, 26, 36];
  const pulseWaveOffsets = isDark ? [-18, -10, 0, 10, 18] : [-12, 0, 12];
  const energyRgb = isDark ? '45,212,191' : '13,148,136';
  const coreDarkRgb = isDark ? '10,40,38' : '12,53,47';
  const coreMidRgb = isDark ? '20,90,80' : '18,117,103';
  const limbRgb = isDark ? '30,160,140' : '15,131,116';
  const alphaBoost = isDark ? 1 : 1.24;
  const bodyOuterAlpha = isDark ? 0.26 : 0.56;
  const bodyMidAlpha = isDark ? 0.24 : 0.44;
  const bodyInnerAlpha = isDark ? 0.18 : 0.34;
  const headOuterAlpha = isDark ? 0.42 : 0.7;
  const headMidAlpha = isDark ? 0.4 : 0.58;
  const headInnerAlpha = isDark ? 0.3 : 0.45;
  const motionStrength = motion === 'steady' ? 0.72 : motion === 'flow' ? 1 : 1.5;
  const actionStrength = action === 'idle' ? 0.7 : action === 'wave' ? 1.15 : 1.5;
  const armSwing = Math.sin(t * (action === 'idle' ? 1.3 : action === 'wave' ? 4 : 5.2)) *
    (action === 'idle' ? 2.2 : action === 'wave' ? 8.5 : 11.5);
  const armLift =
    action === 'idle' ? 0 : action === 'wave' ? -4 : -9 + Math.sin(t * 5.4) * 1.8;
  const wheelOffset = action === 'idle' ? 0 : armSwing * 0.34;
  const leftWheelX = 36 - wheelOffset;
  const rightWheelX = 148 + wheelOffset;
  const legSway = action === 'celebrate' ? Math.sin(t * 4.6) * 2.4 : Math.sin(t * 2.1) * 0.8;
  const antennaSway = Math.sin(t * (action === 'celebrate' ? 6.4 : 3.2)) *
    (action === 'idle' ? 0.7 : action === 'wave' ? 1.8 : 2.6);
  const leftArmPath = `M 62 138 Q ${(50 - armSwing * 0.28).toFixed(1)} ${(130 + armLift).toFixed(1)} ${(38 - armSwing * 0.52).toFixed(1)} ${(138 + armLift * 0.42).toFixed(1)} Q ${(28 - armSwing * 0.22).toFixed(1)} ${(150 + armLift * 0.22).toFixed(1)} ${(40 + armSwing * 0.22).toFixed(1)} ${(160 - armLift * 0.18).toFixed(1)} Q ${(48 + armSwing * 0.24).toFixed(1)} ${(164 - armLift * 0.08).toFixed(1)} 56 158`;
  const rightArmPath = `M 118 138 Q ${(130 + armSwing * 0.28).toFixed(1)} ${(130 + armLift).toFixed(1)} ${(142 + armSwing * 0.52).toFixed(1)} ${(138 + armLift * 0.42).toFixed(1)} Q ${(152 + armSwing * 0.22).toFixed(1)} ${(150 + armLift * 0.22).toFixed(1)} ${(140 - armSwing * 0.22).toFixed(1)} ${(160 - armLift * 0.18).toFixed(1)} Q ${(132 - armSwing * 0.24).toFixed(1)} ${(164 - armLift * 0.08).toFixed(1)} 124 158`;
  const withAlpha = (rgb: string, alpha: number) =>
    `rgba(${rgb},${Math.min(1, alpha * alphaBoost).toFixed(3)})`;
  const energy = (alpha: number) => withAlpha(energyRgb, alpha);
  const coreDark = (alpha: number) => withAlpha(coreDarkRgb, alpha);
  const coreMid = (alpha: number) => withAlpha(coreMidRgb, alpha);
  const limb = (alpha: number) => withAlpha(limbRgb, alpha);

  const stageHeight = showLabel ? Math.max(120, height - 34) : height;
  const stageWidth = Math.round(stageHeight * FIGURE_RATIO);
  const verticalDrift =
    Math.sin(t * (0.9 + motionStrength * 0.2)) *
    -(1.5 + motionStrength * 1.4 + (action === 'celebrate' ? 1.2 : 0));
  const figureRoll =
    action === 'celebrate'
      ? Math.sin(t * 3.6) * 2.4
      : action === 'wave'
        ? Math.sin(t * 2.6) * 1.1
        : Math.sin(t * 1.6) * 0.35;
  const figureScale = 1 + Math.sin(t * (1.4 + motionStrength * 0.6)) * 0.004 * actionStrength;
  const figureStyle = useMemo(
    () => ({
      transform: `perspective(900px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) rotate(${figureRoll.toFixed(2)}deg) translateY(${verticalDrift.toFixed(2)}px) scale(${figureScale.toFixed(3)})`,
      transition: 'transform 90ms linear'
    }),
    [figureRoll, figureScale, tilt.x, tilt.y, verticalDrift]
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
        {!isDark ? (
          <div
            className="pointer-events-none absolute rounded-full"
            style={{
              width: stageWidth * 0.78,
              height: stageHeight * 0.72,
              background:
                'radial-gradient(circle, rgba(16,185,129,0.14) 0%, rgba(255,255,255,0.0) 72%)',
              filter: 'blur(1px)'
            }}
          />
        ) : null}
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          width={stageWidth}
          height={stageHeight}
          style={{
            overflow: 'visible',
            filter: isDark
              ? 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.28))'
              : 'drop-shadow(0 10px 20px rgba(11, 66, 56, 0.24))'
          }}
        >
          {[82, 90, 98].map((x) => (
            <ellipse
              key={x}
              cx={x}
              cy={12}
              rx="3.4"
              ry="3.4"
              fill={energy(0.9)}
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
              stroke={energy(
                isDark
                  ? Math.max(0.05, (0.35 - i * 0.06) * motionStrength)
                  : Math.max(0.03, (0.14 - i * 0.03) * motionStrength)
              )}
              strokeWidth={isDark ? 2.5 - i * 0.3 : 1.4 - i * 0.16}
              opacity={
                isDark
                  ? 0.28 + Math.sin(t * (1.2 + motionStrength * 0.22) - i * 0.6) * (0.22 + actionStrength * 0.07)
                  : 0.1 + Math.sin(t * (1.05 + motionStrength * 0.2) - i * 0.5) * (0.05 + actionStrength * 0.03)
              }
            />
          ))}

          {!isDark ? (
            <ellipse
              cx="90"
              cy="148"
              rx="29"
              ry="39"
              fill="rgba(19,78,69,0.42)"
              stroke="rgba(12,58,51,0.45)"
              strokeWidth="1.4"
            />
          ) : null}
          <ellipse cx="90" cy="148" rx="28" ry="38" fill={coreDark(bodyOuterAlpha)} />
          <ellipse cx="90" cy="148" rx="18" ry="26" fill={coreMid(bodyMidAlpha)} />
          <ellipse cx="90" cy="148" rx="10" ry="16" fill={energy(bodyInnerAlpha)} />

          {pulseWaveOffsets.map((dy, i) => {
            const amp = (12 - Math.abs(dy) * 0.3) * motionStrength * (action === 'celebrate' ? 1.12 : 1);
            const pts = Array.from({ length: 24 }, (_, j) => {
              const x = 62 + j * 2.4;
              const y = 148 + dy + Math.sin(j * 0.8 + t * (2 + motionStrength * 0.3) + i) * amp;
              return `${j === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            }).join(' ');
            return (
              <path
                key={dy}
                d={pts}
                fill="none"
                stroke={energy((isDark ? 0.4 : 0.26) - Math.abs(dy) * (isDark ? 0.012 : 0.009))}
                strokeWidth={(isDark ? 1.5 : 1.8) * (action === 'celebrate' ? 1.08 : 1)}
                strokeLinecap="round"
              />
            );
          })}

          <path
            d={leftArmPath}
            fill="none"
            stroke={energy(0.75)}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d={rightArmPath}
            fill="none"
            stroke={energy(0.75)}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {[leftWheelX, rightWheelX].map((cx, index) => (
            <g key={`wheel-${index}`}>
              <ellipse
                cx={cx}
                cy="162"
                rx="10"
                ry="10"
                fill={coreDark(0.6)}
                stroke={energy(0.5)}
                strokeWidth="1.5"
              />
              <ellipse cx={cx} cy="162" rx="5" ry="5" fill={energy(0.35)} />
              <ellipse cx={cx} cy="162" rx="2" ry="2" fill={energy(0.8)} />
            </g>
          ))}

          <path
            d={`M 80 184 Q ${(76 - legSway).toFixed(1)} 206 ${(78 - legSway * 0.35).toFixed(1)} 222`}
            stroke={limb(0.55)}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M 100 184 Q ${(104 + legSway).toFixed(1)} 206 ${(102 + legSway * 0.35).toFixed(1)} 222`}
            stroke={limb(0.55)}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx={78 - legSway * 0.35} cy="223" rx="9" ry="4" fill={energy(0.25)} />
          <ellipse cx={102 + legSway * 0.35} cy="223" rx="9" ry="4" fill={energy(0.25)} />

          {!isDark ? (
            <ellipse
              cx="90"
              cy="88"
              rx="26"
              ry="26"
              fill="rgba(18,72,64,0.48)"
              stroke="rgba(10,54,47,0.42)"
              strokeWidth="1.2"
            />
          ) : null}
          <ellipse cx="90" cy="88" rx="25" ry="25" fill={coreDark(headOuterAlpha)} />
          <ellipse cx="90" cy="88" rx="18" ry="18" fill={coreMid(headMidAlpha)} />
          <ellipse cx="90" cy="86" rx="10" ry="10" fill={energy(headInnerAlpha)} />

          {[32, 26, 20].map((r, i) => (
            <ellipse
              key={r}
              cx="90"
              cy="88"
              rx={r}
              ry={r}
              fill="none"
              stroke={energy(0.12 + i * 0.04)}
              strokeWidth="1"
              opacity={0.5 + Math.sin(t + i) * 0.3}
            />
          ))}

          {[-16, -8, 0, 8, 16].map((dx) => (
            <g key={dx}>
              <path
                d={`M ${(90 + dx * 0.3 + antennaSway * 0.25).toFixed(1)} 62 Q ${(90 + dx * 0.7 + antennaSway * Math.sign(dx || 1) * 0.4).toFixed(1)} ${(54 - Math.abs(dx) * 0.4).toFixed(1)} ${(90 + dx + antennaSway * Math.sign(dx || 1) * 0.65).toFixed(1)} ${(46 - Math.abs(dx) * 0.5).toFixed(1)}`}
                fill="none"
                stroke={energy(0.7)}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <ellipse
                cx={90 + dx + antennaSway * Math.sign(dx || 1) * 0.65}
                cy={44 - Math.abs(dx) * 0.5}
                rx="2"
                ry="2"
                fill={energy(0.9)}
              />
            </g>
          ))}

          <ellipse cx="78" cy="86" rx="9" ry="9" fill={coreDark(0.8)} />
          <ellipse cx="102" cy="86" rx="9" ry="9" fill={coreDark(0.8)} />
          {[8, 6, 4, 2].map((r, i) => (
            <g key={r}>
              <ellipse
                cx="78"
                cy="86"
                rx={r}
                ry={r}
                fill="none"
                stroke={energy(0.3 + i * 0.15)}
                strokeWidth="1"
              />
              <ellipse
                cx="102"
                cy="86"
                rx={r}
                ry={r}
                fill="none"
                stroke={energy(0.3 + i * 0.15)}
                strokeWidth="1"
              />
            </g>
          ))}
          <ellipse cx="78" cy="86" rx="2" ry="2" fill={energy(0.95)} />
          <ellipse cx="102" cy="86" rx="2" ry="2" fill={energy(0.95)} />

          <path
            d={mouthPath}
            fill="none"
            stroke={energy(0.8)}
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
            fill={energy(0.7)}
            fontFamily="'Courier New', monospace"
          >
            50.0
          </text>
        </svg>
      </div>

      {showLabel ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-center">
          <div className="text-[34px] leading-none text-teal-700 dark:text-teal-100">Pulse</div>
          <div className="text-[12px] font-medium tracking-[0.05em] text-cyan-700/80 dark:text-cyan-300/75">
            Frequency Entity
          </div>
        </div>
      ) : null}
    </div>
  );
}
