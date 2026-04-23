'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

const LANGUAGES = [
  {
    id: 'python',
    title: 'Python',
    description: 'General-purpose scripting, data manipulation, automation.',
    icon: '/brand/python-logo.svg',
    accentRgb: '59,130,246',
    category: 'Foundations',
    comingSoon: false,
  },
  {
    id: 'sql',
    title: 'SQL',
    description: 'Queries, joins, window functions, aggregations.',
    icon: '/brand/sql-logo.png',
    accentRgb: '99,179,237',
    category: 'Foundations',
    comingSoon: false,
  },
  {
    id: 'pyspark',
    title: 'PySpark',
    description: 'Distributed transforms, DataFrame API, Spark SQL.',
    icon: '/brand/pyspark-track-star.svg',
    accentRgb: '245,158,11',
    category: 'Processing',
    comingSoon: false,
  },
];

export function CodingLanguageSelector() {
  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          href="/practice"
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Practice Lab
        </Link>

        {/* Header — matches Theory Hub */}
        <header className="mb-12 border-l-2 border-primary pl-6" style={{ opacity: 0, animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards' }}>
          <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface uppercase mb-2">
            Coding <span className="text-primary">Practice</span>
          </h1>
        </header>

        {/* Language cards — 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {LANGUAGES.map((lang, index) => {
            const hasContent = !lang.comingSoon;
            const staggerDelay = index * 80;

            const cardInner = (
              <section
                className="bg-[#181c20] relative overflow-hidden transition-all duration-300 h-full rounded-[22px]"
                style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                  opacity: 0,
                  animation: `fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay + 100}ms forwards`,
                }}
                onMouseEnter={(e) => { if (hasContent) { e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1.02)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div className="p-6 h-full flex flex-col relative">
                  {/* Icon + badge */}
                  <div className="mb-6 flex justify-between items-start">
                    <div
                      className="w-12 h-12 flex items-center justify-center rounded-[14px]"
                      style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <Image
                        src={lang.icon}
                        alt={`${lang.title} logo`}
                        width={28}
                        height={28}
                        className="h-7 w-7 object-contain"
                      />
                    </div>
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 uppercase rounded-full"
                      style={{ color: `rgb(${lang.accentRgb})`, border: `1px solid rgba(${lang.accentRgb},0.3)`, backgroundColor: `rgba(${lang.accentRgb},0.06)` }}
                    >
                      {lang.category}
                    </span>
                  </div>

                  {/* Title + description */}
                  <h3 className="text-2xl font-bold mb-3 tracking-tight uppercase">
                    {lang.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm font-body mb-8 leading-relaxed">
                    {lang.description}
                  </p>

                  {/* Bottom CTA */}
                  <div className="mt-auto">
                    {hasContent ? (
                      <div
                        className="w-full py-4 font-mono text-xs font-bold tracking-widest text-center transition-all duration-300 active:scale-[0.98] uppercase rounded-[14px]"
                        style={{
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#f0f0f3'
                        }}
                      >
                        Initialize Track
                      </div>
                    ) : (
                      <>
                        {/* Under construction animation */}
                        <div className="mb-4">
                          <div className="flex justify-between items-end mb-2">
                            <span className="font-mono text-[10px] text-on-surface-variant/40">
                              BUILD STATUS
                            </span>
                            <span className="font-mono text-[10px] text-on-surface-variant/30 animate-pulse">
                              COMPILING...
                            </span>
                          </div>
                          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                            <div
                              className="absolute inset-y-0 left-0 w-1/3 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
                              style={{ backgroundColor: `rgba(${lang.accentRgb},0.25)` }}
                            />
                          </div>
                        </div>

                        {/* Construction CTA */}
                        <div
                          className="w-full py-4 font-mono text-[10px] font-bold tracking-widest text-center uppercase opacity-40 rounded-[14px]"
                          style={{
                            border: `1px dashed rgba(${lang.accentRgb},0.3)`,
                            color: `rgba(${lang.accentRgb},0.5)`
                          }}
                        >
                          Under Construction
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </section>
            );

            return hasContent ? (
              <Link key={lang.id} href={`/practice/coding/${lang.id}`} className="group h-full">
                {cardInner}
              </Link>
            ) : (
              <div key={lang.id} className="group h-full cursor-default">
                {cardInner}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
