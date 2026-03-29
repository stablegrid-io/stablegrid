import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, FlaskConical, Zap } from 'lucide-react';
import { learnTopics } from '@/data/learn';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { getPracticeSets } from '@/data/operations/practice-sets';

const LEVELS = [
  { slug: 'junior', label: 'Junior-Level', eyebrow: 'Core Foundation', accentRgb: '153,247,255' },
  { slug: 'mid', label: 'Mid-Level', eyebrow: 'Advanced Systems', accentRgb: '255,201,101' },
  { slug: 'senior', label: 'Senior-Level', eyebrow: 'Platform Architecture', accentRgb: '255,113,108' },
];

interface Props {
  params: { topic: string };
}

export default function PracticeTopicPage({ params }: Props) {
  const topicMeta = learnTopics.find((t) => t.id === params.topic);
  if (!topicMeta) notFound();

  const topicStyle = getTheoryTopicStyle(params.topic);
  const allSets = getPracticeSets(params.topic);

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Link
          href="/operations/practice"
          className="inline-flex items-center gap-1.5 text-[12px] text-on-surface-variant/40 hover:text-on-surface-variant/70 transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Practice Sets
        </Link>

        <header className="mb-12" style={{ opacity: 0, animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-on-surface mb-3 uppercase">
            {topicMeta.title.replace(' Reference', '')}
          </h1>
          <p className="text-[13px] text-on-surface-variant/50">Select a track level to view practice sets.</p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {LEVELS.map((level, i) => {
            const levelSets = allSets.filter((s) => s.metadata?.trackLevel === level.slug);

            return (
              <Link
                key={level.slug}
                href={`/operations/practice/${params.topic}/${level.slug}`}
                className="group block"
                style={{
                  opacity: 0,
                  animation: `fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 100 + 100}ms forwards`,
                }}
              >
                <div
                  className="relative overflow-hidden rounded-2xl border transition-all duration-500 hover:scale-[1.01]"
                  style={{
                    background: '#050507',
                    borderColor: `rgba(${level.accentRgb},0.15)`,
                    boxShadow: `0 0 20px rgba(${level.accentRgb},0.04)`,
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                    background: `linear-gradient(90deg, transparent 5%, rgba(${level.accentRgb},0.8), transparent 95%)`,
                  }} />
                  <div className="absolute inset-0 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500" style={{
                    background: `radial-gradient(ellipse at top left, rgba(${level.accentRgb},0.06), transparent 50%)`,
                  }} />

                  <div className="relative p-8 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: `rgba(${level.accentRgb},0.2)`, boxShadow: `0 0 10px rgba(${level.accentRgb},0.15)` }}>
                          <Zap className="h-3 w-3" style={{ color: `rgb(${level.accentRgb})` }} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: `rgb(${level.accentRgb})` }}>
                          {level.eyebrow}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-on-surface group-hover:text-white transition-colors">
                        {level.label} Track
                      </h2>
                      <p className="text-[12px] text-on-surface-variant/40">
                        {levelSets.length > 0 ? `${levelSets.length} practice set${levelSets.length > 1 ? 's' : ''} available` : 'Coming soon'}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" style={{ color: `rgba(${level.accentRgb},0.5)` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
