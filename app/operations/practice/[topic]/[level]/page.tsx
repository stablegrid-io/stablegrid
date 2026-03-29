import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, FlaskConical, Clock, Layers, Zap, MapPin, Cpu } from 'lucide-react';
import { learnTopics } from '@/data/learn';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { getTrackConceptMeta } from '@/data/learn/theory/trackConceptMeta';
import { getPracticeSets, type PracticeSet } from '@/data/operations/practice-sets';

const LEVEL_META: Record<string, { label: string; eyebrow: string; accentRgb: string }> = {
  junior: { label: 'Junior-Level Track', eyebrow: 'Core Foundation', accentRgb: '153,247,255' },
  mid: { label: 'Mid-Level Track', eyebrow: 'Advanced Systems', accentRgb: '255,201,101' },
  senior: { label: 'Senior-Level Track', eyebrow: 'Platform Architecture', accentRgb: '255,113,108' },
};

interface Props {
  params: { topic: string; level: string };
}

export default function PracticeLevelPage({ params }: Props) {
  const topicMeta = learnTopics.find((t) => t.id === params.topic);
  const levelMeta = LEVEL_META[params.level];
  if (!topicMeta || !levelMeta) notFound();

  const topicStyle = getTheoryTopicStyle(params.topic);
  const conceptMeta = getTrackConceptMeta(params.topic, params.level);
  const allSets = getPracticeSets(params.topic);
  const levelSets = allSets.filter((s) => s.metadata?.trackLevel === params.level);
  const ta = levelMeta;
  const totalTasks = levelSets.reduce((s, ps) => s + (ps.tasks?.length ?? 0), 0);
  const totalMinutes = levelSets.reduce((s, ps) => s + (ps.tasks?.reduce((ts: number, t: { estimatedMinutes?: number }) => ts + (t.estimatedMinutes ?? 0), 0) ?? 0), 0);

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Link
          href={`/operations/practice/${params.topic}`}
          className="inline-flex items-center gap-1.5 text-[12px] text-on-surface-variant/40 hover:text-on-surface-variant/70 transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {topicMeta.title.replace(' Reference', '')}
        </Link>

        {/* Header banner — matches theory tree map */}
        <header
          className="relative overflow-hidden rounded-2xl border backdrop-blur-2xl mb-10"
          style={{
            background: '#050507',
            borderColor: `rgba(${ta.accentRgb},0.15)`,
            animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div className="absolute top-0 inset-x-0 h-[2px]" style={{
            background: `linear-gradient(90deg, transparent 5%, rgba(${ta.accentRgb},0.8), transparent 95%)`,
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse at top left, rgba(${ta.accentRgb},0.1), transparent 50%)`,
          }} />

          <div className="relative p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: `rgba(${ta.accentRgb},0.2)`, boxShadow: `0 0 12px rgba(${ta.accentRgb},0.15)` }}>
                <FlaskConical className="h-3 w-3" style={{ color: `rgb(${ta.accentRgb})` }} />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: `rgb(${ta.accentRgb})` }}>
                {ta.eyebrow} — Practice Sets
              </span>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
              <div className="flex-1 space-y-5">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-on-surface">
                  {ta.label}
                </h1>

                {conceptMeta && (
                  <p className="max-w-xl text-[13px] leading-relaxed text-on-surface-variant/60">
                    {conceptMeta.tagline}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ border: `1px solid rgba(${ta.accentRgb},0.12)`, background: `rgba(${ta.accentRgb},0.05)` }}>
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: `rgba(${ta.accentRgb},0.5)` }}>Sets</span>
                    <span className="text-[13px] font-bold text-white">{levelSets.length}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ border: `1px solid rgba(${ta.accentRgb},0.12)`, background: `rgba(${ta.accentRgb},0.05)` }}>
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: `rgba(${ta.accentRgb},0.5)` }}>Tasks</span>
                    <span className="text-[13px] font-bold text-white">{totalTasks}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ border: `1px solid rgba(${ta.accentRgb},0.12)`, background: `rgba(${ta.accentRgb},0.05)` }}>
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: `rgba(${ta.accentRgb},0.5)` }}>Duration</span>
                    <span className="text-[13px] font-bold text-white">{totalMinutes}m</span>
                  </div>
                </div>

                {conceptMeta && (
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/50">
                      <MapPin className="h-3 w-3 shrink-0" style={{ color: `rgba(${ta.accentRgb},0.7)` }} />
                      <span>{conceptMeta.scenario}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/50">
                      <Cpu className="h-3 w-3 shrink-0" style={{ color: `rgba(${ta.accentRgb},0.7)` }} />
                      <span>{conceptMeta.targetTechnology}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Tree map — vertical path with connected nodes */}
        {levelSets.length > 0 ? (
          <div className="relative">
            {/* Vertical path line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/[0.06]" />

            <div className="space-y-5">
              {levelSets.map((ps, i) => {
                const modulePrefix = ps.metadata?.moduleId?.replace('module-', '') ?? '';
                const taskCount = ps.tasks?.length ?? 0;
                const duration = ps.tasks?.reduce((s: number, t: { estimatedMinutes?: number }) => s + (t.estimatedMinutes ?? 0), 0) ?? 0;
                const staggerDelay = i * 80;

                return (
                  <div
                    key={modulePrefix}
                    className="relative pl-14"
                    style={{
                      opacity: 0,
                      animation: `fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay + 100}ms forwards`,
                    }}
                  >
                    {/* Path node */}
                    <div className="absolute left-4 top-8 z-10">
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: `rgba(${ta.accentRgb},0.4)`,
                          background: `rgba(${ta.accentRgb},0.15)`,
                          boxShadow: `0 0 8px rgba(${ta.accentRgb},0.2)`,
                        }}
                      >
                        <FlaskConical className="h-2.5 w-2.5" style={{ color: `rgb(${ta.accentRgb})` }} />
                      </div>

                      {/* Connector to next node */}
                      {i < levelSets.length - 1 && (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 top-5 w-px"
                          style={{
                            height: 'calc(100% + 20px)',
                            background: `rgba(${ta.accentRgb},0.1)`,
                          }}
                        />
                      )}
                    </div>

                    {/* Card */}
                    <Link
                      href={`/operations/practice/${params.topic}/${params.level}/${modulePrefix}`}
                      className="group block"
                    >
                      <div
                        className="relative overflow-hidden rounded-2xl border transition-all duration-500 hover:scale-[1.01]"
                        style={{
                          background: '#050507',
                          borderColor: `rgba(${ta.accentRgb},0.12)`,
                          boxShadow: `0 0 20px rgba(${ta.accentRgb},0.03)`,
                        }}
                      >
                        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                          background: `radial-gradient(ellipse at top left, rgba(${ta.accentRgb},0.06), transparent 50%)`,
                        }} />

                        <div className="relative p-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
                          {/* Left: Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: `rgba(${ta.accentRgb},0.6)` }}>
                                {modulePrefix}
                              </span>
                            </div>

                            <h3 className="text-lg font-bold tracking-tight text-on-surface group-hover:text-white transition-colors duration-300">
                              {ps.title}
                            </h3>

                            <p className="text-[12px] leading-relaxed text-on-surface-variant/45 line-clamp-2">
                              {ps.description}
                            </p>

                            <div className="flex flex-wrap gap-2 pt-1">
                              <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium"
                                style={{ background: `rgba(${ta.accentRgb},0.06)`, border: `1px solid rgba(${ta.accentRgb},0.1)`, color: `rgba(${ta.accentRgb},0.7)` }}>
                                <Layers className="h-3 w-3" />
                                {taskCount} tasks
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium"
                                style={{ background: `rgba(${ta.accentRgb},0.06)`, border: `1px solid rgba(${ta.accentRgb},0.1)`, color: `rgba(${ta.accentRgb},0.7)` }}>
                                <Clock className="h-3 w-3" />
                                {duration} min
                              </span>
                            </div>
                          </div>

                          {/* Right: CTA */}
                          <div className="flex items-center shrink-0">
                            <div
                              className="rounded-xl py-2.5 px-4 flex items-center gap-2 text-[12px] font-semibold transition-all duration-300 group-hover:scale-[1.02]"
                              style={{
                                background: `rgba(${ta.accentRgb},0.1)`,
                                border: `1px solid rgba(${ta.accentRgb},0.2)`,
                                color: `rgb(${ta.accentRgb})`,
                              }}
                            >
                              <span>Start</span>
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
            <FlaskConical className="h-8 w-8 text-white/10 mx-auto mb-3" />
            <p className="text-[13px] text-on-surface-variant/30">Practice sets for this level are coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
