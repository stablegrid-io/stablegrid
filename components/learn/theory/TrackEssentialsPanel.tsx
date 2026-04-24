'use client';

import type { CSSProperties } from 'react';
import { Check, Compass, Sparkles, Target } from 'lucide-react';
import { getTrackEssentials } from '@/data/learn/trackEssentials';

interface TrackEssentialsPanelProps {
  topic: string;
  tier: string;
  accentColor: string;
  accentRgb: string;
}

const Corner = ({
  pos,
  rgb,
}: {
  pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  rgb: string;
}) => {
  const base: CSSProperties = {
    position: 'absolute',
    width: 14,
    height: 14,
    pointerEvents: 'none',
  };
  const color = `rgba(${rgb},0.45)`;
  const styles: Record<typeof pos, CSSProperties> = {
    'top-left': { ...base, top: 10, left: 10, borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` },
    'top-right': { ...base, top: 10, right: 10, borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` },
    'bottom-left': { ...base, bottom: 10, left: 10, borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` },
    'bottom-right': { ...base, bottom: 10, right: 10, borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` },
  };
  return <div style={styles[pos]} aria-hidden="true" />;
};

const SectionEyebrow = ({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof Target;
  label: string;
  color: string;
}) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="h-3.5 w-3.5" style={{ color }} />
    <span
      className="font-mono text-[10px] font-bold tracking-[0.22em] uppercase"
      style={{ color }}
    >
      {label}
    </span>
  </div>
);

export const TrackEssentialsPanel = ({
  topic,
  tier,
  accentColor,
  accentRgb,
}: TrackEssentialsPanelProps) => {
  const data = getTrackEssentials(topic, tier);
  if (!data) return null;

  const { focus, why, concepts, outcomes, prereqs, idealFor } = data;

  return (
    <section
      className="relative mb-16 overflow-hidden rounded-[22px]"
      style={{
        background: '#181c20',
        border: `1px solid rgba(${accentRgb},0.14)`,
        opacity: 0,
        animation: 'fadeSlideUp .55s cubic-bezier(.16,1,.3,1) 80ms forwards',
      }}
      aria-label="Track essentials"
    >
      {/* Top accent gradient line */}
      <div
        style={{
          height: 2,
          background: `linear-gradient(90deg, transparent 5%, rgba(${accentRgb},0.55), transparent 95%)`,
        }}
      />

      {/* L-bracket corners */}
      <Corner pos="top-left" rgb={accentRgb} />
      <Corner pos="top-right" rgb={accentRgb} />
      <Corner pos="bottom-left" rgb={accentRgb} />
      <Corner pos="bottom-right" rgb={accentRgb} />

      <div className="relative px-6 py-10 md:px-12 md:py-14">
        {/* ── Hero row ─────────────────────────────────────────────────── */}
        <div className="mb-12 md:mb-14">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-3.5 w-3.5" style={{ color: accentColor }} />
            <span
              className="font-mono text-[10px] font-bold tracking-[0.25em] uppercase"
              style={{ color: accentColor }}
            >
              Track Essentials
            </span>
          </div>
          <h2
            className="text-2xl md:text-[32px] font-bold tracking-tight text-on-surface leading-[1.2]"
            style={{ maxWidth: 760 }}
          >
            {focus}
          </h2>
          <p
            className="mt-5 text-[14px] md:text-[15px] leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 680 }}
          >
            {why}
          </p>
        </div>

        {/* ── Two-column grid: Concepts + Outcomes ─────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 mb-12">
          {/* Concepts */}
          <div>
            <SectionEyebrow icon={Compass} label="What you'll learn" color={accentColor} />
            <ul className="space-y-2.5">
              {concepts.map((c, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[13.5px] leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.78)' }}
                >
                  <span
                    className="mt-[9px] h-[3px] w-[3px] rounded-full shrink-0"
                    style={{ backgroundColor: accentColor, boxShadow: `0 0 4px rgba(${accentRgb},0.6)` }}
                    aria-hidden="true"
                  />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Outcomes */}
          <div>
            <SectionEyebrow icon={Target} label="By the end, you can" color={accentColor} />
            <ul className="space-y-3">
              {outcomes.map((o, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[13.5px] leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.82)' }}
                >
                  <span
                    className="mt-[2px] flex h-4 w-4 items-center justify-center rounded-full shrink-0"
                    style={{
                      background: `rgba(${accentRgb},0.12)`,
                      border: `1px solid rgba(${accentRgb},0.4)`,
                    }}
                    aria-hidden="true"
                  >
                    <Check className="h-2.5 w-2.5" style={{ color: accentColor }} strokeWidth={3} />
                  </span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Meta row: Prereqs + Ideal for ────────────────────────────── */}
        <div
          className="flex flex-col md:flex-row md:items-stretch gap-px rounded-[14px] overflow-hidden"
          style={{ background: `rgba(${accentRgb},0.12)` }}
        >
          <div
            className="flex-1 px-5 py-4"
            style={{ background: 'rgba(12,14,16,0.85)' }}
          >
            <div
              className="font-mono text-[9.5px] font-bold tracking-[0.22em] uppercase mb-1.5"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Prerequisites
            </div>
            <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.82)' }}>
              {prereqs}
            </div>
          </div>
          <div
            className="flex-1 px-5 py-4"
            style={{ background: 'rgba(12,14,16,0.85)' }}
          >
            <div
              className="font-mono text-[9.5px] font-bold tracking-[0.22em] uppercase mb-1.5"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Ideal for
            </div>
            <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.82)' }}>
              {idealFor}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
