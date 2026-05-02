'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CODING_LANGUAGES } from '@/lib/practice/codingLanguages';
import { CODING_TOPICS } from '@/lib/practice/codingTopics';
import { getPracticeTopicLanguages } from '@/lib/practice/topicTierMap';

/**
 * /practice/coding — pick a language. Horizontal card layout matching the
 * PracticeHub surface: each card shows a colored banner on the left
 * (language logo centered on accent gradient) plus title, subtitle,
 * description, and stat strip on the right.
 */

interface LanguageCardData {
  id: 'pyspark' | 'python' | 'sql';
  title: string;
  subtitle: string;
  description: string;
  accentRgb: string;
  comingSoon: boolean;
  logo: string;
  href: string;
  topicCount: number;
}

const LANGUAGE_META: Record<
  LanguageCardData['id'],
  { subtitle: string; logo: string; rgb: string }
> = {
  pyspark: {
    subtitle: 'Distributed · DataFrames · Spark SQL',
    logo: '/brand/pyspark-logo.svg',
    rgb: '255,140,80',
  },
  python: {
    subtitle: 'Pandas · NumPy · Core Python',
    logo: '/brand/python-logo.svg',
    rgb: '99,201,255',
  },
  sql: {
    subtitle: 'Joins · Aggregates · Window functions',
    logo: '/brand/sql-logo.svg',
    rgb: '180,160,255',
  },
};

function buildLanguages(): LanguageCardData[] {
  return CODING_LANGUAGES.map((lang) => {
    const id = lang.id as LanguageCardData['id'];
    const meta = LANGUAGE_META[id];
    const topicCount = CODING_TOPICS.filter((t) => {
      if (t.comingSoon) return false;
      const langs = getPracticeTopicLanguages(t.id);
      return langs.length === 0 || langs.includes(id);
    }).length;
    return {
      id,
      title: lang.title,
      subtitle: meta.subtitle,
      description: lang.description,
      accentRgb: meta.rgb,
      comingSoon: lang.comingSoon,
      logo: meta.logo,
      href: `/practice/coding/${lang.id}`,
      topicCount,
    };
  });
}

function LanguageCard({
  language,
  index,
}: {
  language: LanguageCardData;
  index: number;
}) {
  const rgb = language.accentRgb;
  return (
    <div
      className="group relative h-full"
      style={{
        opacity: 0,
        animation: `fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 80 + 100}ms forwards`,
      }}
    >
      <div
        className="relative overflow-hidden h-full flex flex-col md:flex-row transition-all duration-300 cursor-pointer"
        style={{
          background: '#181c20',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 22,
          minHeight: 220,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Banner — accent gradient with the language logo centered. Top
            on mobile, left on desktop. */}
        <div className="relative h-32 md:h-auto md:w-72 md:shrink-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 30% 50%, rgba(${rgb},0.32), rgba(${rgb},0.08) 60%, transparent 90%), #1a1f23`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={language.logo}
              alt=""
              className="h-16 w-16 md:h-20 md:w-20 transition-transform duration-700 group-hover:scale-110"
              style={{
                filter: language.comingSoon ? 'grayscale(0.5) opacity(0.7)' : undefined,
              }}
            />
          </div>
          <div
            className="absolute inset-0 md:hidden"
            style={{ background: 'linear-gradient(to bottom, transparent 30%, #181c20 95%)' }}
          />
          <div
            className="absolute inset-0 hidden md:block"
            style={{ background: 'linear-gradient(to right, transparent 60%, #181c20 100%)' }}
          />
          {/* Accent line — top on mobile, left on desktop */}
          <div
            className="absolute top-0 left-0 right-0 md:hidden transition-all duration-300"
            style={{
              height: 2,
              background: `linear-gradient(90deg, transparent 5%, rgba(${rgb}, 0.5), transparent 95%)`,
            }}
          />
          <div
            className="absolute top-0 bottom-0 left-0 hidden md:block transition-all duration-300"
            style={{
              width: 2,
              background: `linear-gradient(180deg, transparent 5%, rgba(${rgb}, 0.5), transparent 95%)`,
            }}
          />
        </div>

        <div className="px-5 pt-5 pb-6 md:px-6 md:py-5 flex flex-col flex-1 min-w-0">
          <h3
            className="text-2xl font-bold tracking-tight uppercase mb-1"
            style={{ color: '#f0f0f3' }}
          >
            {language.title}
          </h3>

          <p
            className="font-mono text-[9px] tracking-[0.15em] uppercase mb-3"
            style={{ color: `rgb(${rgb})` }}
          >
            {language.subtitle}
          </p>

          <p
            className="text-[12px] leading-relaxed mb-5 md:mb-4"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            {language.description}
          </p>

          <div className="mt-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:gap-5">
              {[
                {
                  label: 'Topics',
                  value: language.comingSoon ? '—' : String(language.topicCount),
                },
                {
                  label: 'Difficulty',
                  value: language.comingSoon ? '—' : 'Junior · Mid · Senior',
                },
                {
                  label: 'Status',
                  value: language.comingSoon ? 'Coming Soon' : 'Live',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between md:justify-start md:gap-2 py-2.5 md:py-0"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span
                    className="text-[10px] tracking-widest uppercase"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {stat.label}
                  </span>
                  <span
                    className="text-[12px] font-semibold"
                    style={{
                      color:
                        stat.label === 'Status' && !language.comingSoon
                          ? `rgb(${rgb})`
                          : 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {language.comingSoon ? (
              <div
                className="w-full md:w-auto md:shrink-0 py-3.5 md:py-2.5 px-4 md:px-5 font-mono text-[10px] font-bold tracking-widest text-center uppercase rounded-[14px]"
                style={{
                  border: '1px dashed rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                Under Construction
              </div>
            ) : (
              <div
                className="w-full md:w-auto md:shrink-0 py-3.5 md:py-2.5 px-4 md:px-5 font-mono text-[10px] font-bold tracking-widest text-center uppercase rounded-[14px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer hover:bg-white/[0.04]"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                Choose Topic
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CodingLanguagePicker() {
  const languages = buildLanguages();

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12 space-y-12">
        {/* Back link */}
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Practice Lab
        </Link>

        <header
          className="border-b border-white/[0.08] pb-6"
          style={{
            opacity: 0,
            animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards',
          }}
        >
          <h1 className="text-5xl font-bold tracking-tight text-on-surface">
            Coding Practice
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-on-surface/60">
            Pick a language to start drilling. PySpark is live; Python and SQL are landing soon.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5">
          {languages.map((lang, i) =>
            lang.comingSoon ? (
              <LanguageCard key={lang.id} language={lang} index={i} />
            ) : (
              <Link key={lang.id} href={lang.href} className="block h-full">
                <LanguageCard language={lang} index={i} />
              </Link>
            ),
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
