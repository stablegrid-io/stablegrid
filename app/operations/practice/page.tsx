import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { learnTopics } from '@/data/learn';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { CATEGORY_COLORS, TOPIC_CATEGORY_MAP, type CategoryName } from '@/components/home/orbitalMapData';

const TRACK_ICON_SRC_BY_TOPIC: Record<string, string> = {
  pyspark: '/brand/pyspark-track-star.svg',
  fabric: '/brand/microsoft-fabric-track.svg',
  airflow: '/brand/apache-airflow-logo.svg',
  sql: '/brand/sql-logo.svg',
  'python-de': '/brand/python-logo.svg',
  kafka: '/brand/apache-kafka-logo.svg',
  docker: '/brand/docker-logo.svg',
  dbt: '/brand/dbt-logo.svg',
  databricks: '/brand/databricks-logo.svg',
};

export default function PracticeTopicSelectorPage() {
  const activeTopics = learnTopics.filter((t) => t.chapterCount > 0);
  const inactiveTopics = learnTopics.filter((t) => t.chapterCount === 0);

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Link
          href="/operations"
          className="inline-flex items-center gap-1.5 text-[12px] text-on-surface-variant/40 hover:text-on-surface-variant/70 transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Operations
        </Link>

        <header className="mb-12" style={{ opacity: 0, animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-on-surface mb-3">
            Practice Sets
          </h1>
          <p className="text-[13px] text-on-surface-variant/50 leading-relaxed max-w-xl">
            Select a topic to browse practice exercises by track level.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ opacity: 0, animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 80ms forwards' }}>
          {activeTopics.map((topic, i) => {
            const style = getTheoryTopicStyle(topic.id);
            const cat = TOPIC_CATEGORY_MAP[topic.id] as CategoryName | undefined;
            const catRgb = cat ? CATEGORY_COLORS[cat] : style.accentRgb;
            const iconSrc = TRACK_ICON_SRC_BY_TOPIC[topic.id] ?? '/brand/pyspark-track-star.svg';

            return (
              <Link
                key={topic.id}
                href={`/operations/practice/${topic.id}`}
                className="group block"
                style={{
                  opacity: 0,
                  animation: `fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${(i * 60) + 100}ms forwards`,
                }}
              >
                <div
                  className="relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] h-full"
                  style={{
                    background: '#050507',
                    borderColor: `rgba(${style.accentRgb},0.15)`,
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                    background: `linear-gradient(90deg, transparent 5%, rgba(${style.accentRgb},0.6), transparent 95%)`,
                  }} />
                  <div className="absolute inset-0 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500" style={{
                    background: `radial-gradient(ellipse at top left, rgba(${style.accentRgb},0.06), transparent 50%)`,
                  }} />

                  <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 flex items-center justify-center rounded-xl" style={{ background: `rgba(${style.accentRgb},0.12)` }}>
                        <Image src={iconSrc} alt={topic.title} width={24} height={24} className="h-6 w-6 object-contain" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-on-surface group-hover:text-white transition-colors">
                          {topic.title.replace(' Reference', '')}
                        </h3>
                        {cat && (
                          <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: `rgba(${catRgb},0.6)` }}>
                            {cat}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-on-surface-variant/40 line-clamp-2">{topic.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}

          {inactiveTopics.map((topic, i) => {
            const style = getTheoryTopicStyle(topic.id);
            return (
              <div
                key={topic.id}
                className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 opacity-40"
                style={{
                  opacity: 0,
                  animation: `fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${(activeTopics.length + i) * 60 + 100}ms forwards`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.04]">
                    <FlaskConical className="h-5 w-5 text-white/15" />
                  </div>
                  <h3 className="text-[14px] font-bold text-white/20">{topic.title.replace(' Reference', '')}</h3>
                </div>
                <div className="relative h-1 w-16 overflow-hidden rounded-full bg-white/[0.03]">
                  <div className="absolute inset-y-0 left-0 w-1/3 rounded-full animate-[shimmer_2s_ease-in-out_infinite]" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
