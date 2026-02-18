'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Award, Clock, Target, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatUnitsAsKwh } from '@/lib/energy';

interface SessionStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  totalXP: number;
  timeSpent: number;
}

interface SessionCompleteProps {
  stats: SessionStats;
  topic: string;
  onRestart: () => void;
}

type MascotPhase = 'idle' | 'windup' | 'punch' | 'impact' | 'recoil' | 'flow';
type PerformanceState = 'struggling' | 'recovering' | 'steady' | 'strong' | 'elite';

interface ElectricCanvasProps {
  trigger: number;
  width?: number;
  height?: number;
}

interface ShockwaveRingProps {
  active: boolean;
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  delay: number;
  animationCycle: number;
}

interface ElektrainisMascotProps {
  phase: MascotPhase;
  performance: PerformanceState;
}

interface ParticleTrailPoint {
  x: number;
  y: number;
  life: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  decay: number;
  color: 'electric' | 'white';
  trail: ParticleTrailPoint[];
}

interface LightningBolt {
  segments: Array<{ x: number; y: number }>;
  life: number;
  decay: number;
  width: number;
}

const IMPACT_OFFSET_X = 92;
const IMPACT_OFFSET_Y = 18;

interface PerformanceProfile {
  state: PerformanceState;
  label: string;
  heroLine: string;
  syncTitle: string;
  syncBody: string;
  summary: string;
  nextAction: string;
  badgeClassName: string;
  dotClassName: string;
  spinStyle: 'soft' | 'normal' | 'charged';
  shakeStrength: 'low' | 'medium' | 'high';
}

const PERFORMANCE_PROFILES: Record<PerformanceState, Omit<PerformanceProfile, 'state'>> = {
  struggling: {
    label: 'Recovery mode',
    heroLine: 'Tough round. Elektrainis detected unstable answers and switched to recovery support.',
    syncTitle: 'Elektrainis is feeling low but still synced in',
    syncBody: 'No stress. Your grid learns from misses. Run a short retry session and stabilize weak cards.',
    summary: 'Performance dipped this run, but momentum returns fast with a focused replay.',
    nextAction: 'Replay 5 questions, focus on explanations, then run a full set again.',
    badgeClassName:
      'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-700/70 dark:bg-warning-900/30 dark:text-warning-300',
    dotClassName: 'bg-warning-500',
    spinStyle: 'soft',
    shakeStrength: 'low'
  },
  recovering: {
    label: 'Warm-up mode',
    heroLine: 'You are rebuilding consistency. Elektrainis is stabilizing your answer rhythm.',
    syncTitle: 'Elektrainis is refocusing your grid',
    syncBody: 'Accuracy is improving. Keep short focused bursts and close the remaining weak spots.',
    summary: 'You are close to stable. One more precise session should push you into strong territory.',
    nextAction: 'Review your last mistakes, then run one timed session without skips.',
    badgeClassName:
      'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-700/70 dark:bg-brand-900/30 dark:text-brand-300',
    dotClassName: 'bg-brand-500',
    spinStyle: 'soft',
    shakeStrength: 'low'
  },
  steady: {
    label: 'Stable output',
    heroLine: 'Solid session. Elektrainis maintained stable transfer across your grid profile.',
    syncTitle: 'Elektrainis synchronized this session',
    syncBody: 'Reliable execution. Keep this pace to compound learning and unlock stronger missions.',
    summary: 'Consistent performance. You are building durable skill, not lucky streaks.',
    nextAction: 'Push difficulty by one level or reduce solve time while keeping accuracy.',
    badgeClassName:
      'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-700/70 dark:bg-brand-900/30 dark:text-brand-300',
    dotClassName: 'bg-brand-500',
    spinStyle: 'normal',
    shakeStrength: 'medium'
  },
  strong: {
    label: 'High voltage',
    heroLine: 'Strong run. Elektrainis is energized and transferring clean high-output packets.',
    syncTitle: 'Elektrainis delivered a strong sync burst',
    syncBody: 'Excellent answer quality. Your grid profile absorbed this session with minimal loss.',
    summary: 'Great execution. You are operating in high-confidence territory.',
    nextAction: 'Attempt advanced questions next and keep skip rate near zero.',
    badgeClassName:
      'border-success-200 bg-success-50 text-success-700 dark:border-success-700/70 dark:bg-success-900/30 dark:text-success-300',
    dotClassName: 'bg-success-500',
    spinStyle: 'normal',
    shakeStrength: 'medium'
  },
  elite: {
    label: 'Precision surge',
    heroLine: 'Elite run. Elektrainis hit peak synchronization and executed a precision transfer.',
    syncTitle: 'Elektrainis reached peak sync',
    syncBody: 'Near-perfect control. This is mission-grade output ready for the hardest scenarios.',
    summary: 'Top-tier result. You are in Grid Architect form right now.',
    nextAction: 'Take an advanced mission immediately while this precision is hot.',
    badgeClassName:
      'border-brand-300 bg-brand-100 text-brand-700 dark:border-brand-600/80 dark:bg-brand-900/35 dark:text-brand-200',
    dotClassName: 'bg-brand-500',
    spinStyle: 'charged',
    shakeStrength: 'high'
  }
};

function resolvePerformanceState(stats: SessionStats, accuracy: number): PerformanceState {
  const total = Math.max(1, stats.totalQuestions);
  const skipRate = stats.skippedQuestions / total;
  const secPerQuestion = stats.timeSpent / total;

  if (accuracy < 45 || skipRate >= 0.45 || stats.correctAnswers <= 1) return 'struggling';
  if (accuracy < 65 || skipRate >= 0.25) return 'recovering';
  if (accuracy < 85) return 'steady';
  if (accuracy >= 97 && skipRate <= 0.05 && secPerQuestion <= 16) return 'elite';
  return 'strong';
}

function ElectricCanvas({ trigger, width = 420, height = 320 }: ElectricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const boltsRef = useRef<LightningBolt[]>([]);
  const frameRef = useRef<number | null>(null);

  const spawnBurst = useCallback(() => {
    const cx = width / 2 + IMPACT_OFFSET_X;
    const cy = height / 2 + IMPACT_OFFSET_Y;
    const particles: Particle[] = [];
    const bolts: LightningBolt[] = [];

    for (let i = 0; i < 55; i += 1) {
      const angle = (Math.PI * 2 * i) / 55 + (Math.random() - 0.5) * 0.4;
      const speed = 1.2 + Math.random() * 4.5;
      particles.push({
        x: cx + (Math.random() - 0.5) * 14,
        y: cy + (Math.random() - 0.5) * 14,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 1.5,
        size: 1.2 + Math.random() * 3,
        life: 1,
        decay: 0.009 + Math.random() * 0.014,
        color: Math.random() > 0.25 ? 'electric' : 'white',
        trail: []
      });
    }

    for (let i = 0; i < 7; i += 1) {
      const angle = (Math.PI * 2 * i) / 7 + (Math.random() - 0.5) * 0.5;
      const length = 40 + Math.random() * 80;
      const steps = 5 + Math.floor(Math.random() * 5);
      const segments: Array<{ x: number; y: number }> = [];

      for (let j = 0; j <= steps; j += 1) {
        const t = j / steps;
        segments.push({
          x: cx + Math.cos(angle) * length * t + (Math.random() - 0.5) * 18,
          y: cy + Math.sin(angle) * length * t + (Math.random() - 0.5) * 18
        });
      }

      bolts.push({
        segments,
        life: 1,
        decay: 0.025 + Math.random() * 0.02,
        width: 1 + Math.random() * 2
      });
    }

    particlesRef.current = particles;
    boltsRef.current = bolts;
  }, [height, width]);

  useEffect(() => {
    if (trigger > 0) spawnBurst();
  }, [spawnBurst, trigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      boltsRef.current = boltsRef.current.filter((bolt) => bolt.life > 0);
      for (const bolt of boltsRef.current) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(16,185,129,${bolt.life})`;
        ctx.lineWidth = bolt.width * bolt.life;
        ctx.shadowBlur = 12 * bolt.life;
        ctx.shadowColor = 'rgba(16,185,129,0.8)';

        for (let i = 0; i < bolt.segments.length; i += 1) {
          const point = bolt.segments[i];
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${bolt.life * 0.6})`;
        ctx.lineWidth = bolt.width * bolt.life * 0.35;
        for (let i = 0; i < bolt.segments.length; i += 1) {
          const point = bolt.segments[i];
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();

        ctx.shadowBlur = 0;
        bolt.life -= bolt.decay;
      }

      particlesRef.current = particlesRef.current.filter((particle) => particle.life > 0);
      for (const particle of particlesRef.current) {
        particle.trail.push({ x: particle.x, y: particle.y, life: particle.life });
        if (particle.trail.length > 5) particle.trail.shift();

        for (let i = 0; i < particle.trail.length; i += 1) {
          const trailPoint = particle.trail[i];
          const alpha = (i / Math.max(1, particle.trail.length)) * trailPoint.life * 0.4;
          ctx.beginPath();
          ctx.fillStyle =
            particle.color === 'electric'
              ? `rgba(16,185,129,${alpha})`
              : `rgba(255,255,255,${alpha})`;
          ctx.arc(trailPoint.x, trailPoint.y, particle.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        if (particle.color === 'electric') {
          ctx.fillStyle = `rgba(52,211,153,${particle.life})`;
          ctx.shadowBlur = 8 * particle.life;
          ctx.shadowColor = 'rgba(16,185,129,0.6)';
        } else {
          ctx.fillStyle = `rgba(255,255,255,${particle.life})`;
          ctx.shadowBlur = 6 * particle.life;
          ctx.shadowColor = 'rgba(255,255,255,0.5)';
        }
        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.03;
        particle.vx *= 0.99;
        particle.life -= particle.decay;
      }

      frameRef.current = window.requestAnimationFrame(draw);
    };

    frameRef.current = window.requestAnimationFrame(draw);
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [height, width]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
    />
  );
}

function ShockwaveRing({ active }: ShockwaveRingProps) {
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2">
      {[0, 1, 2].map((ring) => (
        <div
          key={ring}
          className="absolute"
          style={{
            left: IMPACT_OFFSET_X,
            top: IMPACT_OFFSET_Y,
            transform: 'translate(-50%, -50%)',
            width: 10,
            height: 10,
            borderRadius: '9999px',
            border: `2px solid rgba(16,185,129,${0.6 - ring * 0.15})`,
            animation: `shockwave 0.8s ${ring * 0.12}s ease-out forwards`
          }}
        />
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, delay, animationCycle }: StatCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [animationCycle, delay]);

  return (
    <div
      className="card flex flex-col items-center p-4 text-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div className="mb-2 flex items-center justify-center gap-2">
        {icon}
        <span className="text-caption">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
        {value}
      </div>
    </div>
  );
}

function ElektrainisMascot({ phase, performance }: ElektrainisMascotProps) {
  const id = useId().replace(/:/g, '');
  const bodyGradientId = `elektrainis-body-${id}`;
  const glowRingId = `elektrainis-glow-${id}`;
  const orbGlowId = `elektrainis-orb-${id}`;
  const fistFlashId = `elektrainis-fistflash-${id}`;
  const softGlowId = `elektrainis-softglow-${id}`;
  const strongGlowId = `elektrainis-strongglow-${id}`;

  const rightArmRotation: Record<MascotPhase, number> = {
    idle: 0,
    windup: -40,
    punch: 25,
    impact: 15,
    recoil: -8,
    flow: -4
  };

  const rightArmTransition: Record<MascotPhase, string> = {
    idle: 'transform 0.5s ease-in-out',
    windup: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    punch: 'transform 0.1s cubic-bezier(0.2, 0, 0.8, 1)',
    impact: 'transform 0.12s ease-out',
    recoil: 'transform 0.3s ease-out',
    flow: 'transform 0.6s ease-in-out'
  };

  const bodyScale: Record<MascotPhase, { sx: number; sy: number; tx: number }> = {
    idle: { sx: 1, sy: 1, tx: 0 },
    windup: { sx: 0.97, sy: 1.02, tx: -3 },
    punch: { sx: 1.04, sy: 0.97, tx: 4 },
    impact: { sx: 1.06, sy: 0.95, tx: 2 },
    recoil: { sx: 0.97, sy: 1.03, tx: -2 },
    flow: { sx: 1.01, sy: 0.995, tx: 1 }
  };

  const openMouth = phase === 'impact' || phase === 'recoil';
  const showFistGlow = phase === 'impact' || phase === 'recoil';
  const showSpeechDots = phase === 'idle';
  const accentPrimary =
    performance === 'struggling'
      ? '#f59e0b'
      : performance === 'recovering'
        ? '#84cc16'
        : performance === 'elite'
          ? '#64a0dc'
          : '#10b981';
  const accentSecondary =
    performance === 'struggling'
      ? '#fbbf24'
      : performance === 'recovering'
        ? '#a3e635'
        : performance === 'elite'
          ? '#93c5fd'
          : '#34d399';
  const speechDotColor = performance === 'struggling' ? '#94a3b8' : '#6b7280';
  const eyeScaleY =
    performance === 'struggling' ? 0.72 : performance === 'recovering' ? 0.88 : 1;

  return (
    <svg viewBox="0 0 220 280" width="220" height="260" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={bodyGradientId} cx="46%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#2a3544" />
          <stop offset="100%" stopColor="#1a2332" />
        </radialGradient>

        <radialGradient id={glowRingId} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={accentPrimary} stopOpacity="0.1" />
          <stop offset="100%" stopColor={accentPrimary} stopOpacity="0" />
        </radialGradient>

        <radialGradient id={fistFlashId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor={accentSecondary} stopOpacity="0.6" />
          <stop offset="100%" stopColor={accentPrimary} stopOpacity="0" />
        </radialGradient>

        <filter id={orbGlowId} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>

        <filter id={softGlowId}>
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={strongGlowId}>
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {showSpeechDots ? (
        <g>
          {[152, 160, 168].map((x, index) => (
            <circle key={x} cx={x} cy="30" r="2.6" fill={speechDotColor}>
              <animate
                attributeName="opacity"
                values="0.25;0.85;0.25"
                dur="1.5s"
                begin={`${index * 0.22}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      ) : null}

      <g
        style={{
          transformOrigin: '110px 150px',
          transform: `translate(${bodyScale[phase].tx}px, 0px) scale(${bodyScale[phase].sx}, ${bodyScale[phase].sy})`,
          transition: rightArmTransition[phase]
        }}
      >
        <circle cx="110" cy="138" r="52" fill={`url(#${glowRingId})`} />

        <line x1="96" y1="214" x2="92" y2="248" stroke="#2a3544" strokeWidth="7" strokeLinecap="round" />
        <line x1="124" y1="214" x2="128" y2="248" stroke="#2a3544" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="92" cy="252" rx="12" ry="6" fill="#0d9488" />
        <ellipse cx="128" cy="252" rx="12" ry="6" fill="#0d9488" />

        <ellipse cx="110" cy="170" rx="40" ry="52" fill={`url(#${bodyGradientId})`} />

        <line
          x1="74"
          y1="156"
          x2="48"
          y2="178"
          stroke={accentPrimary}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="42" cy="182" r="9" fill="#1a2332" stroke={accentPrimary} strokeWidth="1.5" strokeOpacity="0.6" />
        <circle cx="42" cy="182" r="3.2" fill={accentPrimary} />

        <g
          style={{
            transformOrigin: '146px 146px',
            transform: `rotate(${rightArmRotation[phase]}deg)`,
            transition: rightArmTransition[phase]
          }}
        >
          <line
            x1="146"
            y1="146"
            x2="176"
            y2="182"
            stroke={accentPrimary}
            strokeWidth="5"
            strokeLinecap="round"
          />

          {showFistGlow ? (
            <circle cx="181" cy="186" r="22" fill={`url(#${fistFlashId})`}>
              <animate attributeName="r" values="16;26;10" dur="0.5s" fill="freeze" />
              <animate attributeName="opacity" values="1;0" dur="0.6s" fill="freeze" />
            </circle>
          ) : null}

          <circle
            cx="181"
            cy="186"
            r="9"
            fill="#1a2332"
            stroke={accentPrimary}
            strokeWidth={showFistGlow ? 2.5 : 1.5}
            strokeOpacity={showFistGlow ? 1 : 0.6}
            filter={showFistGlow ? `url(#${strongGlowId})` : undefined}
          />
          <circle cx="181" cy="186" r="3.1" fill={accentPrimary} />

          {showFistGlow ? (
            <g filter={`url(#${softGlowId})`}>
              <path
                d="M 190 178 L 201 168 L 197 172 L 209 160"
                fill="none"
                stroke={accentSecondary}
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <animate attributeName="opacity" values="1;0" dur="0.5s" fill="freeze" />
              </path>
              <path
                d="M 176 176 L 164 168 L 168 172 L 157 164"
                fill="none"
                stroke={accentSecondary}
                strokeWidth="1.4"
                strokeLinecap="round"
              >
                <animate attributeName="opacity" values="1;0" dur="0.45s" fill="freeze" />
              </path>
              <path
                d="M 186 195 L 200 196 L 196 191 L 208 188"
                fill="none"
                stroke={accentSecondary}
                strokeWidth="1.2"
                strokeLinecap="round"
              >
                <animate attributeName="opacity" values="1;0" dur="0.4s" fill="freeze" />
              </path>
            </g>
          ) : null}
        </g>

        <rect x="104" y="112" width="12" height="12" rx="4" fill="#1a2332" />

        <circle cx="110" cy="84" r="33" fill={`url(#${bodyGradientId})`} />

        <line x1="103" y1="52" x2="95" y2="34" stroke="#2a3544" strokeWidth="2" strokeLinecap="round" />
        <line x1="108" y1="50" x2="103" y2="30" stroke="#2a3544" strokeWidth="2" strokeLinecap="round" />
        <line x1="112" y1="50" x2="112" y2="28" stroke="#2a3544" strokeWidth="2" strokeLinecap="round" />
        <line x1="116" y1="50" x2="121" y2="30" stroke="#2a3544" strokeWidth="2" strokeLinecap="round" />
        <line x1="121" y1="52" x2="129" y2="34" stroke="#2a3544" strokeWidth="2" strokeLinecap="round" />

        <circle cx="112" cy="26" r="3.2" fill={accentPrimary} filter={`url(#${orbGlowId})`}>
          <animate attributeName="r" values="2.6;4.1;2.6" dur="2s" repeatCount="indefinite" />
          <animate
            attributeName="opacity"
            values="0.55;1;0.55"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        <g transform={`translate(97 83) scale(1 ${eyeScaleY}) translate(-97 -83)`}>
          <circle cx="97" cy="83" r="9" fill="#101826" stroke={accentPrimary} strokeOpacity="0.68" strokeWidth="1.2" />
          <circle cx="97" cy="83" r="6" fill="none" stroke={accentSecondary} strokeOpacity="0.58" strokeWidth="1.1" />
          <circle cx="97" cy="83" r="3.2" fill="none" stroke={accentPrimary} strokeOpacity="0.76" strokeWidth="1.1" />
          <circle cx="97" cy="83" r="1.6" fill={accentSecondary} />
        </g>

        <g transform={`translate(123 83) scale(1 ${eyeScaleY}) translate(-123 -83)`}>
          <circle cx="123" cy="83" r="9" fill="#101826" stroke={accentPrimary} strokeOpacity="0.68" strokeWidth="1.2" />
          <circle cx="123" cy="83" r="6" fill="none" stroke={accentSecondary} strokeOpacity="0.58" strokeWidth="1.1" />
          <circle cx="123" cy="83" r="3.2" fill="none" stroke={accentPrimary} strokeOpacity="0.76" strokeWidth="1.1" />
          <circle cx="123" cy="83" r="1.6" fill={accentSecondary} />
        </g>

        {performance === 'struggling' ? (
          <g>
            <line x1="91" y1="72" x2="102" y2="69" stroke={accentPrimary} strokeWidth="1.4" strokeLinecap="round" />
            <line x1="129" y1="69" x2="118" y2="72" stroke={accentPrimary} strokeWidth="1.4" strokeLinecap="round" />
          </g>
        ) : null}

        {openMouth ? (
          <ellipse
            cx="110"
            cy="98"
            rx="7"
            ry="4.8"
            fill="none"
            stroke={accentPrimary}
            strokeWidth="1.5"
            filter={`url(#${softGlowId})`}
          />
        ) : performance === 'struggling' ? (
          <path
            d="M 99 102 Q 110 95 121 102"
            fill="none"
            stroke={accentPrimary}
            strokeWidth="1.5"
            strokeLinecap="round"
            filter={`url(#${softGlowId})`}
          />
        ) : performance === 'recovering' ? (
          <path
            d="M 100 101 Q 110 103 120 101"
            fill="none"
            stroke={accentPrimary}
            strokeWidth="1.5"
            strokeLinecap="round"
            filter={`url(#${softGlowId})`}
          />
        ) : performance === 'strong' || performance === 'elite' ? (
          <path
            d="M 100 99 Q 110 106 120 99"
            fill="none"
            stroke={accentPrimary}
            strokeWidth="1.5"
            strokeLinecap="round"
            filter={`url(#${softGlowId})`}
          />
        ) : (
          <path
            d="M 100 97 L 104 94 L 108 98 L 112 94 L 116 98 L 120 94 L 124 97"
            fill="none"
            stroke={accentPrimary}
            strokeWidth="1.5"
            strokeLinecap="round"
            filter={`url(#${softGlowId})`}
          />
        )}
      </g>
    </svg>
  );
}

export const SessionComplete = ({ stats, topic, onRestart }: SessionCompleteProps) => {
  const router = useRouter();
  const timersRef = useRef<number[]>([]);
  const [phase, setPhase] = useState<MascotPhase>('idle');
  const [burstCount, setBurstCount] = useState(0);
  const [animationCycle, setAnimationCycle] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [shockwave, setShockwave] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
      : 0;
  const performanceState = useMemo(
    () => resolvePerformanceState(stats, accuracy),
    [accuracy, stats]
  );
  const performanceProfile = useMemo<PerformanceProfile>(
    () => ({
      state: performanceState,
      ...PERFORMANCE_PROFILES[performanceState]
    }),
    [performanceState]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const runAnimation = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    setAnimationCycle((cycle) => cycle + 1);

    const addTimer = (delay: number, callback: () => void) => {
      const timer = window.setTimeout(callback, delay);
      timersRef.current.push(timer);
    };

    setPhase('idle');
    setShowContent(false);
    setShockwave(false);

    addTimer(300, () => setPhase('windup'));
    addTimer(750, () => setPhase('punch'));
    addTimer(850, () => {
      setPhase('impact');
      setBurstCount((count) => count + 1);
      setShockwave(true);
    });
    addTimer(1100, () => setPhase('recoil'));
    addTimer(1400, () => setPhase('flow'));
    addTimer(1200, () => setShowContent(true));
    addTimer(2050, () => setPhase('idle'));
    addTimer(2100, () => setShockwave(false));
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (hasPlayed) return;
    setHasPlayed(true);
    runAnimation();
  }, [hasPlayed, runAnimation]);

  const sessionDescriptor = useMemo(() => {
    const lowered = topic.toLowerCase();
    if (lowered.includes('flash')) return 'flashcard';
    return 'practice';
  }, [topic]);

  const heroPose = useMemo(() => {
    switch (phase) {
      case 'windup':
        return { x: -26, y: 0, rotate: 0, scale: 1.01 };
      case 'punch':
        return { x: 54, y: -2, rotate: 0, scale: 1.03 };
      case 'impact':
        return { x: 62, y: -1, rotate: 0, scale: 1.03 };
      case 'recoil':
        return { x: -14, y: 1, rotate: 0, scale: 1 };
      case 'flow':
        return { x: 8, y: 0, rotate: 0, scale: 1.01 };
      default:
        return { x: 0, y: 0, rotate: 0, scale: 1 };
    }
  }, [phase]);

  const heroTransition = useMemo(() => {
    switch (phase) {
      case 'windup':
        return { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const };
      case 'punch':
        return { duration: 0.1, ease: [0.2, 0, 0.8, 1] as const };
      case 'impact':
        return { duration: 0.12, ease: 'easeOut' as const };
      case 'recoil':
        return { duration: 0.3, ease: 'easeOut' as const };
      case 'flow':
        return { duration: 0.6, ease: 'easeInOut' as const };
      default:
        return { duration: 0.5, ease: 'easeInOut' as const };
    }
  }, [phase]);

  const receiverFistPose = useMemo(() => {
    switch (phase) {
      case 'windup':
        return { x: 0, y: 0, rotate: -20, scale: 1, boxShadow: '0 0 0 rgba(52,211,153,0)' };
      case 'punch':
        return {
          x: -12,
          y: 0,
          rotate: -17,
          scale: 1.03,
          boxShadow: '0 0 10px rgba(52,211,153,0.22)'
        };
      case 'impact':
        return {
          x: -19,
          y: 0,
          rotate: -15,
          scale: 1.13,
          boxShadow: '0 0 30px rgba(52,211,153,0.55)'
        };
      case 'recoil':
        return { x: -6, y: 0, rotate: -18, scale: 1.04, boxShadow: '0 0 14px rgba(52,211,153,0.3)' };
      case 'flow':
        return { x: -4, y: 0, rotate: -19, scale: 1.02, boxShadow: '0 0 8px rgba(52,211,153,0.2)' };
      default:
        return { x: 0, y: 0, rotate: -20, scale: 1, boxShadow: '0 0 0 rgba(52,211,153,0)' };
    }
  }, [phase]);

  const punchLaneWidth = useMemo(() => {
    switch (phase) {
      case 'windup':
        return 64;
      case 'punch':
        return 172;
      case 'impact':
        return 190;
      case 'recoil':
        return 118;
      case 'flow':
        return 96;
      default:
        return 0;
    }
  }, [phase]);

  const spinSequence = useMemo(() => {
    if (animationCycle === 0) return [0];
    if (performanceProfile.spinStyle === 'soft') return [0, 0, -20, 90, 130, 100, 90];
    if (performanceProfile.spinStyle === 'charged') return [0, 0, -35, 675, 720, 726, 720];
    return [0, 0, -35, 315, 360, 366, 360];
  }, [animationCycle, performanceProfile.spinStyle]);

  const spinDuration = useMemo(() => {
    if (performanceProfile.spinStyle === 'soft') return 1.25;
    if (performanceProfile.spinStyle === 'charged') return 1.8;
    return 1.5;
  }, [performanceProfile.spinStyle]);

  const flowDrift = useMemo(() => {
    if (phase !== 'flow') return { x: 0, y: 0, rotate: 0 };
    if (performanceProfile.spinStyle === 'soft') {
      return { x: [0, 4, 2, 0], y: [0, -3, -1, 0], rotate: [0, 1.5, -0.5, 0] };
    }
    if (performanceProfile.spinStyle === 'charged') {
      return { x: [0, 10, 5, 0], y: [0, -8, -3, 0], rotate: [0, 4, -2, 0] };
    }
    return { x: [0, 8, 4, 0], y: [0, -7, -3, 0], rotate: [0, 3, -1.5, 0] };
  }, [performanceProfile.spinStyle, phase]);

  const flowDriftTransition = useMemo(() => {
    if (phase !== 'flow') return { duration: 0.2, ease: 'easeOut' as const };
    return { duration: 0.62, ease: 'easeInOut' as const };
  }, [phase]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative mx-auto w-full max-w-3xl space-y-6"
    >
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-brand-300/40 bg-white p-6 dark:border-[#1f2a2f] dark:bg-[#0d1115] sm:p-8"
        animate={
          phase === 'impact'
            ? performanceProfile.shakeStrength === 'low'
              ? { x: [0, -3, 2, -2, 1, 0], y: [0, 0.5, -0.5, 0.2, 0] }
              : performanceProfile.shakeStrength === 'high'
                ? { x: [0, -11, 9, -7, 4, -2, 0], y: [0, 1, -1, 1, -0.5, 0] }
                : { x: [0, -8, 7, -5, 3, 0], y: [0, 1, -1, 1, 0] }
            : { x: 0, y: 0 }
        }
        transition={{ duration: 0.28, ease: 'easeOut' }}
        style={{ willChange: 'transform' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)',
            backgroundSize: '34px 34px'
          }}
        />

        <div className="pointer-events-none absolute left-1/2 top-[42%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,rgba(16,185,129,0)_72%)] dark:bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,rgba(16,185,129,0)_72%)]" />

        <div className="relative mx-auto h-[320px] w-full max-w-[420px]">
          <ElectricCanvas trigger={burstCount} width={420} height={320} />
          <ShockwaveRing active={shockwave} />

          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 z-[6] h-[3px] -translate-y-1/2 bg-gradient-to-r from-success-500/0 via-success-400/90 to-success-300/0"
            style={{
              marginLeft: IMPACT_OFFSET_X / 2 - 8,
              marginTop: IMPACT_OFFSET_Y
            }}
            animate={{
              width: punchLaneWidth,
              opacity:
                punchLaneWidth > 0
                  ? phase === 'impact'
                    ? [0.15, 0.85, 0.2]
                    : phase === 'flow'
                      ? [0.28, 0.14, 0.24]
                      : 0.38
                  : 0
            }}
            transition={{
              duration: phase === 'punch' ? 0.1 : phase === 'flow' ? 0.58 : 0.22,
              ease: 'easeOut'
            }}
          />

          <motion.div
            className="pointer-events-none absolute z-[7] h-8 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-success-300/80 bg-gradient-to-r from-slate-800/95 via-slate-700/90 to-slate-600/80"
            style={{
              left: `calc(50% + ${IMPACT_OFFSET_X + 108}px)`,
              top: `calc(50% + ${IMPACT_OFFSET_Y + 2}px)`,
              transformOrigin: '20% 50%'
            }}
            animate={receiverFistPose}
            transition={{ duration: phase === 'punch' ? 0.1 : 0.24, ease: 'easeOut' }}
          >
            <span className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-success-300/80 bg-success-500/70" />
          </motion.div>

          {(phase === 'impact' || phase === 'recoil') && (
            <motion.div
              key={`impact-hit-${burstCount}`}
              className="pointer-events-none absolute z-[9] h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-success-300/80 bg-success-400/20"
              style={{
                left: `calc(50% + ${IMPACT_OFFSET_X + 68}px)`,
                top: `calc(50% + ${IMPACT_OFFSET_Y - 8}px)`
              }}
              initial={{ scale: 0.35, opacity: 0 }}
              animate={{ scale: [0.35, 1.55, 0.85], opacity: [0, 0.95, 0] }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          )}

          <div
            className="relative z-[8] flex h-full items-center justify-center"
            onClick={runAnimation}
            style={{ cursor: 'pointer' }}
            title="Click Elektrainis!"
          >
            <motion.div
              key={`spin-cycle-${animationCycle}`}
              initial={{ rotate: 0 }}
              animate={{ rotate: spinSequence }}
              transition={{
                duration: animationCycle === 0 ? 0 : spinDuration,
                times: animationCycle === 0 ? [0] : [0, 0.2, 0.5, 0.566, 0.733, 0.86, 1],
                ease: 'easeInOut'
              }}
              style={{ willChange: 'transform' }}
            >
              <motion.div animate={heroPose} transition={heroTransition} style={{ willChange: 'transform' }}>
                <motion.div animate={flowDrift} transition={flowDriftTransition} style={{ willChange: 'transform' }}>
                  <ElektrainisMascot phase={phase} performance={performanceProfile.state} />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div
          className="relative z-[12] mt-1 text-center"
          style={{
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="mb-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${performanceProfile.badgeClassName}`}
            >
              {performanceProfile.label}
            </span>
          </div>
          <h1 className="text-headline mb-2">Session Complete</h1>
          <p className="text-body">{performanceProfile.heroLine}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
            {topic} {sessionDescriptor} report
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Target className="h-4 w-4 text-brand-500" />}
          label="Accuracy"
          value={`${accuracy}%`}
          delay={1300}
          animationCycle={animationCycle}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-success-500" />}
          label="Energy Earned"
          value={`+${formatUnitsAsKwh(stats.totalXP)}`}
          delay={1450}
          animationCycle={animationCycle}
        />
        <StatCard
          icon={<Award className="h-4 w-4 text-brand-500" />}
          label="Correct"
          value={`${stats.correctAnswers}/${stats.totalQuestions}`}
          delay={1600}
          animationCycle={animationCycle}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-text-light-tertiary dark:text-text-dark-tertiary" />}
          label="Time"
          value={formatTime(stats.timeSpent)}
          delay={1750}
          animationCycle={animationCycle}
        />
      </div>

      <div
        className="card p-4"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-1 h-2 w-2 rounded-full ${performanceProfile.dotClassName}`} style={{ animation: 'corePulse 2s infinite' }} />
          <div>
            <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              {performanceProfile.syncTitle}
            </p>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {performanceProfile.syncBody}
            </p>
          </div>
        </div>
      </div>

      <div
        className="card p-6 text-center"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {performanceProfile.summary}
        </p>
      </div>

      <div
        className="flex flex-col gap-3 sm:flex-row"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.5s 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <button onClick={onRestart} className="btn btn-secondary flex-1">
          Practice Again
        </button>
        <button onClick={() => router.push('/flashcards')} className="btn btn-primary flex-1">
          Choose New Topic
        </button>
      </div>

      <style jsx>{`
        @keyframes shockwave {
          0% {
            width: 10px;
            height: 10px;
            opacity: 1;
          }
          100% {
            width: 220px;
            height: 220px;
            opacity: 0;
          }
        }

        @keyframes corePulse {
          0%,
          100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
      `}</style>
    </motion.div>
  );
};
