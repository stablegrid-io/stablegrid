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

/* ── Battery Cell (3D Flip Card) ── */
const BatteryCell = ({ category, topics, index }: {
  category: CategoryName;
  topics: OrbitalTopic[];
  index: number;
}) => {
  const delay = index * 80;

  const juniorDone = topics.reduce((s, t) => s + (t.tracks.find((tr) => tr.slug === 'junior')?.completedModules ?? 0), 0);
  const midDone = topics.reduce((s, t) => s + (t.tracks.find((tr) => tr.slug === 'mid')?.completedModules ?? 0), 0);
  const seniorDone = topics.reduce((s, t) => s + (t.tracks.find((tr) => tr.slug === 'senior')?.completedModules ?? 0), 0);
  const grandTotal = topics.reduce((s, t) => {
    return s + t.tracks.reduce((ts, tr) => ts + tr.totalModules, 0);
  }, 0);
  const grandDone = juniorDone + midDone + seniorDone;
  const overallPct = grandTotal > 0 ? (grandDone / grandTotal) * 100 : 0;

  const fillPct = grandTotal > 0 ? (grandDone / grandTotal) * 100 : 0;
  const animFill = useFillAnimation(fillPct, delay + 200);
  const animatedPct = useCountUp(Math.round(overallPct), 800, delay + 300);
  const hasContent = topics.some((t) => t.hasAnyContent);

  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const catColor = CATEGORY_COLORS[category];
  const SEGMENTS = 8;
  const filledSegments = Math.round((animFill / 100) * SEGMENTS);

  const topicDetails = topics.map((t) => {
    const total = t.tracks.reduce((s, tr) => s + tr.totalModules, 0);
    const done = t.tracks.reduce((s, tr) => s + tr.completedModules, 0);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { label: t.label, pct, done, total, hasContent: t.hasAnyContent, tracks: t.tracks };
  });

  /* Shared card styles (dimensions, border, etc.) */
  const cardBorder = hasContent ? `rgba(${catColor},0.3)` : 'rgba(255,255,255,0.04)';
  const cardBg = hasContent ? `rgba(${catColor},0.04)` : 'rgba(255,255,255,0.015)';

  return (
    <div
      className="relative"
      style={{
        perspective: '1200px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Flip container ── */}
      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: hovered ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease',
        }}
      >
        {/* ══════════ FRONT FACE ══════════ */}
        <div
          className="relative rounded-xl border-2 overflow-hidden cursor-default"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderColor: cardBorder,
            background: cardBg,
            boxShadow: hasContent
              ? `0 0 20px rgba(${catColor},0.06), inset 0 0 30px rgba(${catColor},0.03)`
              : 'none',
          }}
        >
          {/* Terminal nub */}
          <div className="mx-auto w-8 h-1.5 rounded-b-sm -mt-px" style={{
            background: hasContent ? `rgba(${catColor},0.4)` : 'rgba(255,255,255,0.06)',
          }} />

          <div className="p-4 min-h-[170px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: hasContent ? `rgba(${catColor},0.7)` : 'rgba(255,255,255,0.2)' }}>
                {category}
              </h3>
              {hasContent ? (
                <span className="text-lg font-bold" style={{ color: `rgb(${catColor})` }}>
                  {animatedPct}
                  <span className="text-[10px] font-normal" style={{ color: `rgba(${catColor},0.5)` }}>%</span>
                </span>
              ) : (
                <span className="text-[9px] uppercase tracking-widest text-white/15 font-semibold">Pending</span>
              )}
            </div>

            {/* Battery segments */}
            <div className="flex-1 flex flex-col-reverse gap-[3px] my-1">
              {Array.from({ length: SEGMENTS }, (_, i) => {
                const isFilled = i < filledSegments;
                const isTop = i === filledSegments - 1 && filledSegments > 0;
                return (
                  <div
                    key={i}
                    className="rounded-[3px]"
                    style={{
                      height: '8px',
                      background: isFilled
                        ? `rgba(${catColor},${0.25 + (i / SEGMENTS) * 0.35})`
                        : 'rgba(255,255,255,0.03)',
                      boxShadow: isTop ? `0 0 8px rgba(${catColor},0.3)` : 'none',
                      transition: `all ${600 + i * 80}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                    }}
                  />
                );
              })}
            </div>

            {/* Topic labels */}
            <div className="mt-2 pt-2 border-t" style={{ borderColor: hasContent ? `rgba(${catColor},0.1)` : 'rgba(255,255,255,0.04)' }}>
              {hasContent ? (
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  {topics.filter((t) => t.hasAnyContent).map((topic) => (
                    <span key={topic.id} className="text-[10px] font-medium"
                      style={{ color: `rgba(${catColor},0.6)` }}>
                      {topic.label}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative h-1 w-12 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="absolute inset-y-0 left-0 w-1/3 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  <span className="text-[9px] text-white/10">Building</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ BACK FACE ══════════ */}
        <div
          className="absolute inset-0 rounded-xl border-2 overflow-hidden cursor-default"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderColor: hasContent ? `rgba(${catColor},0.35)` : 'rgba(255,255,255,0.06)',
            background: 'rgba(10,12,14,0.92)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
            boxShadow: hasContent
              ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(${catColor},0.08), 0 0 60px rgba(${catColor},0.06)`
              : '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Accent line at top */}
          <div className="absolute top-0 left-4 right-4 h-[2px] rounded-b-full" style={{
            background: `linear-gradient(90deg, transparent, rgba(${catColor},0.5), transparent)`,
          }} />

          <div className="p-4 min-h-[170px] flex flex-col">
            {/* Header */}
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3"
              style={{ color: `rgba(${catColor},0.7)` }}>
              {category}
            </p>

            {/* Topic rows */}
            <div className="flex-1 space-y-2.5 overflow-y-auto">
              {topicDetails.map((t, i) => (
                <BackTopicRow
                  key={t.label}
                  topic={t}
                  catColor={catColor}
                  index={i}
                  isFlipped={hovered}
                />
              ))}
            </div>

            {/* Total progress footer */}
            {hasContent && (
              <div
                className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between"
                style={{
                  opacity: 0,
                  animation: hovered
                    ? `fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${80 + topicDetails.length * 40 + 60}ms forwards`
                    : 'none',
                }}
              >
                <span className="text-[10px] text-white/25 tracking-widest uppercase">Total</span>
                <span className="text-[11px] font-bold tabular-nums" style={{ color: `rgb(${catColor})` }}>
                  {grandDone}<span className="text-white/20 font-normal">/{grandTotal} modules</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Back-face topic row ── */
const BackTopicRow = ({ topic, catColor, index, isFlipped }: {
  topic: { label: string; pct: number; done: number; total: number; hasContent: boolean; tracks: { slug: string; completedModules: number; totalModules: number }[] };
  catColor: string;
  index: number;
  isFlipped: boolean;
}) => {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    if (isFlipped) {
      const t = setTimeout(() => setBarWidth(topic.pct), 60 + index * 50);
      return () => clearTimeout(t);
    } else {
      setBarWidth(0);
    }
  }, [isFlipped, topic.pct, index]);

  const trackLabels: { slug: 'junior' | 'mid' | 'senior'; name: string }[] = [
    { slug: 'junior', name: 'Jr' },
    { slug: 'mid', name: 'Mid' },
    { slug: 'senior', name: 'Sr' },
  ];

  return (
    <div
      style={{
        opacity: 0,
        animation: isFlipped
          ? `fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${80 + index * 40}ms forwards`
          : 'none',
      }}
    >
      {/* Topic name + percentage */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-white/70 truncate">{topic.label}</span>
        <span className="text-[10px] font-semibold tabular-nums shrink-0 ml-2"
          style={{ color: topic.hasContent ? `rgba(${catColor},0.9)` : 'rgba(255,255,255,0.15)' }}>
          {topic.hasContent ? `${topic.pct}%` : '--'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-[5px] rounded-full overflow-hidden bg-white/[0.06] mb-1.5">
        <div
          className="h-full rounded-full"
          style={{
            width: `${barWidth}%`,
            background: topic.hasContent
              ? `linear-gradient(90deg, rgba(${catColor},0.4), rgba(${catColor},0.8))`
              : 'rgba(255,255,255,0.06)',
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: barWidth > 0 ? `0 0 6px rgba(${catColor},0.3)` : 'none',
          }}
        />
      </div>

      {/* Track-level breakdown: Junior / Mid / Senior */}
      <div className="flex items-center gap-3">
        {trackLabels.map(({ slug, name }) => {
          const track = topic.tracks.find((tr) => tr.slug === slug);
          const completed = track?.completedModules ?? 0;
          const total = track?.totalModules ?? 0;
          const trackColor = TRACK_COLORS[slug];
          return (
            <div key={slug} className="flex items-center gap-1">
              <div
                className="w-[5px] h-[5px] rounded-full shrink-0"
                style={{
                  background: total > 0 ? `rgb(${trackColor})` : 'rgba(255,255,255,0.1)',
                  boxShadow: total > 0 && completed > 0 ? `0 0 4px rgba(${trackColor},0.5)` : 'none',
                }}
              />
              <span className="text-[9px] tabular-nums text-white/40">
                {name}
              </span>
              <span className="text-[9px] tabular-nums font-medium" style={{
                color: total > 0 ? `rgba(${trackColor},0.8)` : 'rgba(255,255,255,0.12)',
              }}>
                {total > 0 ? `${completed}/${total}` : '--'}
              </span>
            </div>
          );
        })}
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
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map(({ category, index: i, topics: catTopics }) => (
          <BatteryCell key={category} category={category} topics={catTopics} index={i} />
        ))}
      </div>
    </div>
  );
};
