'use client';

import { useEffect, useState } from 'react';
import { CATEGORY_ORDER, TRACK_COLORS, CATEGORY_COLORS, type OrbitalTopic, type CategoryName } from './orbitalMapData';

/* ── Hooks ── */
const useCountUp = (target: number, duration = 1200, delay = 0) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return value;
};

const useFillAnimation = (targetPct: number, delay = 0) => {
  const [fill, setFill] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setFill(targetPct), 80 + delay);
    return () => clearTimeout(timer);
  }, [targetPct, delay]);
  return fill;
};

/* ── Category Battery ── */
const CategoryBattery = ({ category, topics, index }: {
  category: CategoryName;
  topics: OrbitalTopic[];
  index: number;
}) => {
  const delay = index * 100;

  const juniorTotal = topics.reduce((s, t) => s + (t.tracks.find((tr) => tr.slug === 'junior')?.totalModules ?? 0), 0);
  const juniorDone = topics.reduce((s, t) => s + (t.tracks.find((tr) => tr.slug === 'junior')?.completedModules ?? 0), 0);
  const midTotal = topics.reduce((s, t) => s + (t.tracks.find((tr) => tr.slug === 'mid')?.totalModules ?? 0), 0);
  const midDone = topics.reduce((s, t) => s + (t.tracks.find((tr) => tr.slug === 'mid')?.completedModules ?? 0), 0);
  const seniorTotal = topics.reduce((s, t) => s + (t.tracks.find((tr) => tr.slug === 'senior')?.totalModules ?? 0), 0);
  const seniorDone = topics.reduce((s, t) => s + (t.tracks.find((tr) => tr.slug === 'senior')?.completedModules ?? 0), 0);

  const grandTotal = juniorTotal + midTotal + seniorTotal;
  const grandDone = juniorDone + midDone + seniorDone;
  const overallPct = grandTotal > 0 ? (grandDone / grandTotal) * 100 : 0;

  const juniorFillPct = grandTotal > 0 ? (juniorDone / grandTotal) * 100 : 0;
  const midFillPct = grandTotal > 0 ? (midDone / grandTotal) * 100 : 0;
  const seniorFillPct = grandTotal > 0 ? (seniorDone / grandTotal) * 100 : 0;

  const animJunior = useFillAnimation(juniorFillPct, delay + 200);
  const animMid = useFillAnimation(midFillPct, delay + 300);
  const animSenior = useFillAnimation(seniorFillPct, delay + 400);
  const totalFill = animJunior + animMid + animSenior;

  const animatedPct = useCountUp(Math.round(overallPct), 800, delay + 300);
  const animTopLine = useFillAnimation(overallPct, delay + 200);
  const hasContent = topics.some((t) => t.hasAnyContent);

  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const catColor = CATEGORY_COLORS[category];

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.025]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, border-color 0.3s, background-color 0.3s`,
      }}
    >
      {/* Layered fills */}
      <div className="absolute inset-x-0 bottom-0 transition-all duration-[1.4s]" style={{
        height: `${totalFill}%`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Unified category fill */}
        <div className="absolute inset-x-0 bottom-0 h-full" style={{
          background: `linear-gradient(to top, rgba(${catColor},0.14), rgba(${catColor},0.03))`,
        }} />
      </div>

      {/* Fill edge glow */}
      {totalFill > 0 && totalFill < 100 && (
        <div className="absolute inset-x-0 h-px transition-all duration-[1.4s]" style={{
          bottom: `${totalFill}%`,
          background: `rgba(${catColor},0.25)`,
          boxShadow: `0 0 8px rgba(${catColor},0.15)`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      )}

      {/* Top accent line */}
      {hasContent && (
        <div className="absolute top-0 left-0 h-[2px] transition-all duration-[1.6s]" style={{
          width: `${animTopLine}%`,
          background: `rgb(${catColor})`,
          boxShadow: `0 0 8px rgba(${catColor},0.35)`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      )}

      {/* Ambient glow on hover */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: hasContent ? `radial-gradient(ellipse at bottom, rgba(${catColor},0.04), transparent 60%)` : undefined }} />

      <div className="relative p-5 min-h-[160px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-auto">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/40">{category}</h3>
          {hasContent ? (
            <span className="text-[15px] font-bold text-on-surface">{animatedPct}<span className="text-[11px] text-on-surface-variant/30 font-normal">%</span></span>
          ) : (
            <span className="text-[10px] text-on-surface-variant/20 uppercase tracking-widest">Building</span>
          )}
        </div>

        {/* Topic tags at bottom */}
        <div className="mt-auto pt-4">
          {hasContent ? (
            <div className="flex flex-wrap gap-1.5">
              {topics.filter((t) => t.hasAnyContent).map((topic) => (
                <span key={topic.id} className="text-[10px] font-medium text-on-surface-variant/40">
                  {topic.label}
                </span>
              ))}
            </div>
          ) : (
            <div className="relative h-1 w-16 overflow-hidden rounded-full bg-white/[0.03]">
              <div className="absolute inset-y-0 left-0 w-1/3 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main Grid ── */
export const OrbitalMap = ({ topics, overallPct }: {
  topics: OrbitalTopic[];
  overallPct: number;
}) => {
  const animatedPct = useCountUp(overallPct, 1400, 200);

  const categoryGroups = CATEGORY_ORDER.map((cat, i) => ({
    category: cat,
    index: i,
    topics: topics.filter((t) => t.categoryIndex === i),
  }));

  // Sort: categories with content first
  const sorted = [...categoryGroups].sort((a, b) => {
    const aHas = a.topics.some((t) => t.hasAnyContent) ? 0 : 1;
    const bHas = b.topics.some((t) => t.hasAnyContent) ? 0 : 1;
    return aHas - bHas;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/40">Grid status</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-on-surface">{animatedPct}</span>
          <span className="text-[11px] text-on-surface-variant/30">% synced</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map(({ category, index: i, topics: catTopics }) => (
          <CategoryBattery key={category} category={category} topics={catTopics} index={i} />
        ))}
      </div>
    </div>
  );
};
