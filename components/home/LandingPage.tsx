'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Layers, Clock, BarChart3, ArrowRight, Zap, Target, GraduationCap } from 'lucide-react';
import WindTurbine from '@/components/home/WindTurbine';

// ─── Nav on scroll ───────────────────────────────────────────────────────────

function NavOnScroll() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 w-full z-50 border-b transition-all duration-300"
      style={{
        backgroundColor: 'rgba(10, 12, 14, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: visible ? 'rgba(255,255,255,0.06)' : 'transparent',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <Link href="/" className="font-bold tracking-tight text-sm" style={{ color: '#99f7ff', letterSpacing: '0.08em' }}>
          STABLEGRID.IO
        </Link>
        <Link
          href="/login"
          className="px-5 py-2 text-sm font-semibold transition-all"
          style={{
            backgroundColor: '#f0f0f3',
            color: '#0a0c0e',
            borderRadius: '14px',
            boxShadow: '0 0 12px rgba(240,240,243,0.1)',
          }}
          onMouseOver={e => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(240,240,243,0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.boxShadow = '0 0 12px rgba(240,240,243,0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const TOPICS = [
  {
    name: 'PySpark',
    modules: 10,
    icon: '/brand/pyspark-track-star.svg',
    accent: '#99f7ff'
  },
  {
    name: 'Microsoft Fabric',
    modules: 10,
    icon: '/brand/microsoft-fabric-track.svg',
    accent: '#bf81ff'
  },
  {
    name: 'Apache Airflow',
    modules: 10,
    icon: '/brand/apache-airflow-logo.svg',
    accent: '#ffc965'
  },
  {
    name: 'SQL',
    modules: 10,
    icon: '/brand/sql-logo.svg',
    accent: '#99f7ff'
  },
  {
    name: 'Python',
    modules: 10,
    icon: '/brand/python-logo.svg',
    accent: '#ffc965'
  },
  {
    name: 'Apache Kafka',
    modules: 10,
    icon: '/brand/apache-kafka-logo.svg',
    accent: '#ff716c'
  },
  {
    name: 'Docker',
    modules: 10,
    icon: '/brand/docker-logo.svg',
    accent: '#99f7ff'
  },
  {
    name: 'dbt',
    modules: 10,
    icon: '/brand/dbt-logo.svg',
    accent: '#ff716c'
  }
] as const;

const STEPS = [
  {
    number: '01',
    title: 'Choose a track',
    description:
      'Pick from 20+ data engineering topics, each with Junior, Mid, and Senior tiers structured for real career progression.'
  },
  {
    number: '02',
    title: 'Learn the theory',
    description:
      'Read structured modules with your preferred session method — Sprint, Pomodoro, or Deep Focus. Progress is saved automatically.'
  },
  {
    number: '03',
    title: 'Practice with real scenarios',
    description:
      'Apply your knowledge through hands-on practice sets built on real-world datasets and production-grade engineering problems.'
  }
] as const;

const FEATURES = [
  {
    icon: Layers,
    title: 'Structured learning paths',
    description: 'Junior → Mid → Senior progression per topic. No filler — every module builds on the last.',
    accent: '#99f7ff'
  },
  {
    icon: Clock,
    title: 'Reading sessions',
    description: 'Sprint, Pomodoro, Deep Focus. Timed study approaches built directly into the reading view.',
    accent: '#ffc965'
  },
  {
    icon: Target,
    title: 'Practice sets',
    description: 'Real-world scenarios with datasets. Not toy exercises — tasks that mirror production engineering work.',
    accent: '#bf81ff'
  },
  {
    icon: BarChart3,
    title: 'Progress tracking',
    description: 'Activity heatmap, completion grid, and session stats so you always know where you stand.',
    accent: '#ff716c'
  }
] as const;

const TOPIC_ICONS = [
  '/brand/pyspark-track-star.svg',
  '/brand/microsoft-fabric-track.svg',
  '/brand/apache-airflow-logo.svg',
  '/brand/sql-logo.svg',
  '/brand/python-logo.svg',
  '/brand/apache-kafka-logo.svg',
  '/brand/docker-logo.svg',
  '/brand/dbt-logo.svg'
];

// ─── Component ────────────────────────────────────────────────────────────────

export const LandingPage = () => {
  return (
    <div
      className="relative min-h-screen text-white"
      style={{ backgroundColor: '#0a0c0e', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none z-0 grid-overlay" />
      <div className="fixed inset-0 pointer-events-none z-0 scanline opacity-20" />
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shineSwipe {
          0%, 80% { background-position: -200% center; }
          100%    { background-position: 200% center; }
        }
      `}</style>

      {/* ── Navigation (appears on scroll) ─────────────────────────────── */}
      <NavOnScroll />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="min-h-[90vh] flex items-center px-6 relative overflow-hidden">
        {/* Background gradient — shifted right for turbine halo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 70% 30%, rgba(153,247,255,0.06) 0%, transparent 60%)'
          }}
        />

        <div className="max-w-6xl mx-auto relative w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-0">
          {/* Left column — text content */}
          <div>
            {/* Logo */}
            <div
              className="font-bold tracking-tight text-sm mb-10"
              style={{ color: '#99f7ff', letterSpacing: '0.08em', opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 0ms forwards' }}
            >
              STABLEGRID.IO
            </div>

            {/* Headline */}
            <h1
              className="font-bold tracking-tight mb-6"
              style={{
                fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                lineHeight: 1.05,
                opacity: 0,
                animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 80ms forwards',
              }}
            >
              Understanding <span style={{ color: '#99f7ff' }}>data</span>
              <br />
              is your edge.
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg mb-10 max-w-lg"
              style={{
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.7,
                opacity: 0,
                animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 160ms forwards'
              }}
            >
              Master data engineering through structured theory tracks, real-world practice sets,
              and deep technical understanding — across PySpark, Fabric, Airflow, and more.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap gap-3 mb-16"
              style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 240ms forwards' }}
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold transition-all relative overflow-hidden"
                style={{
                  backgroundColor: '#f0f0f3',
                  color: '#0a0c0e',
                  borderRadius: '14px',
                  boxShadow: '0 0 12px rgba(240,240,243,0.1)',
                  backgroundImage: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 70%)',
                  backgroundSize: '250% 100%',
                  backgroundPosition: '-200% center',
                  animation: 'shineSwipe 5s ease-in-out infinite',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.boxShadow = '0 0 24px rgba(240,240,243,0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(240,240,243,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#topics"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium transition-all"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  color: 'rgba(255,255,255,0.7)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }}
              >
                Explore topics
              </a>
            </div>

            {/* Topic icon strip */}
            <div
              className="flex items-center gap-6 flex-wrap"
              style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 340ms forwards' }}
            >
              <span
                className="text-xs uppercase tracking-widest shrink-0"
                style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em' }}
              >
                Topics
              </span>
              {TOPIC_ICONS.map((src, i) => (
                <div
                  key={src}
                  className="w-7 h-7 relative transition-opacity"
                  style={{ opacity: 0.7 }}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right column — WindTurbine */}
          <div
            className="hidden lg:flex items-center justify-center relative"
            style={{ opacity: 0, animation: 'fadeIn 1s cubic-bezier(.16,1,.3,1) 300ms forwards' }}
          >
            {/* Subtle cyan glow behind turbine */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(153,247,255,0.05) 0%, transparent 70%)'
              }}
            />
            <WindTurbine size="custom" width={760} height={900} scale={1} background="transparent" showBeacon />
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-20 lg:h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── How it Works ───────────────────────────────────────────────────── */}
      <section className="py-28 lg:py-40 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section label */}
          <p
            className="text-xs uppercase tracking-widest mb-4"
            style={{
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.18em',
              opacity: 0,
              animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 0ms forwards',
              animationTimeline: 'view()',
              animationRangeStart: 'entry 0%',
              animationRangeEnd: 'entry 20%'
            }}
          >
            How it works
          </p>
          <h2
            className="text-3xl lg:text-4xl font-bold tracking-tight mb-16"
            style={{ lineHeight: 1.1 }}
          >
            Three steps to mastery.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className="p-8"
                style={{
                  backgroundColor: '#111416',
                  borderRadius: '22px',
                  opacity: 0,
                  animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${i * 80}ms forwards`
                }}
              >
                <span
                  className="block text-4xl font-bold mb-6"
                  style={{ color: 'rgba(153,247,255,0.2)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-20 lg:h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── Topics Showcase ────────────────────────────────────────────────── */}
      <section id="topics" className="py-28 lg:py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            className="text-xs uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em' }}
          >
            Topics
          </p>
          <div className="flex items-end justify-between mb-12 gap-4 flex-wrap">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ lineHeight: 1.1 }}>
              20+ topics.<br />
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Three tiers each.</span>
            </h2>
            <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              From Junior fundamentals to Senior architecture — every track follows the same structured progression.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TOPICS.map((topic, i) => (
              <Link
                key={topic.name}
                href="/login"
                className="group relative p-5 transition-all"
                style={{
                  backgroundColor: '#111416',
                  borderRadius: '22px',
                  border: '1px solid rgba(255,255,255,0.04)',
                  opacity: 0,
                  animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${i * 50}ms forwards`
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = `${topic.accent}30`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Accent top border */}
                <div
                  className="absolute top-0 left-6 right-6 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${topic.accent}60, transparent)`,
                    borderRadius: '1px'
                  }}
                />

                <div className="w-8 h-8 relative mb-4">
                  <Image
                    src={topic.icon}
                    alt={topic.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {topic.name}
                </p>
                <p
                  className="text-xs uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}
                >
                  {topic.modules} modules
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-20 lg:h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── Tier Showcase ────────────────────────────────────────────────── */}
      <section className="py-28 lg:py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            className="text-xs uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em' }}
          >
            Progression
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6" style={{ lineHeight: 1.1 }}>
            Three levels of depth.<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>One clear path forward.</span>
          </h2>
          <p className="text-[15px] leading-relaxed mb-16" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '540px' }}>
            Every topic is structured into Junior, Mid, and Senior tiers. Start with foundations, progress to advanced systems, and master platform architecture.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { level: 'Junior', subtitle: 'Foundational Modules', color: '#99f7ff', rgb: '153,247,255', xp: '1.0X', desc: 'Core concepts, syntax, and mental models. Build the foundation that everything else depends on.' },
              { level: 'Mid', subtitle: 'Advanced Systems', color: '#ffc965', rgb: '255,201,101', xp: '1.5X', desc: 'Production patterns, optimization, and integration. Work with real-world complexity.' },
              { level: 'Senior', subtitle: 'Platform Architecture', color: '#ff716c', rgb: '255,113,108', xp: '3.0X', desc: 'System design, governance, and scale. Architect solutions that teams depend on.' },
            ].map((tier, i) => (
              <div
                key={tier.level}
                className="relative overflow-hidden flex flex-col"
                style={{
                  background: '#111416',
                  border: `1px solid rgba(${tier.rgb},0.12)`,
                  borderRadius: '22px',
                  opacity: 0,
                  animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${i * 100 + 200}ms forwards`,
                }}
              >
                {/* Top accent */}
                <div style={{ height: '2px', background: `linear-gradient(90deg, transparent 5%, rgba(${tier.rgb},0.6), transparent 95%)` }} />

                <div className="p-7 flex flex-col flex-1">
                  {/* Level badge */}
                  <div
                    className="inline-flex self-start px-3 py-1 rounded-full text-[10px] font-bold tracking-widest mb-5"
                    style={{ backgroundColor: `rgba(${tier.rgb},0.1)`, color: tier.color }}
                  >
                    {tier.level.toUpperCase()}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold tracking-tight text-on-surface mb-1">
                    {tier.level}
                  </h3>
                  <p className="text-[10px] tracking-[0.18em] uppercase mb-5" style={{ color: tier.color }}>
                    {tier.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-[13px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {tier.desc}
                  </p>

                  {/* Stats */}
                  <div className="mt-auto space-y-0">
                    <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Modules</span>
                      <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>10 per topic</span>
                    </div>
                    <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>XP Multiplier</span>
                      <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{tier.xp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-20 lg:h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── Features Grid ──────────────────────────────────────────────────── */}
      <section className="py-28 lg:py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            className="text-xs uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em' }}
          >
            Built for depth
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-16" style={{ lineHeight: 1.1 }}>
            Everything you need.<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Nothing you don&apos;t.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-8"
                  style={{
                    backgroundColor: '#111416',
                    borderRadius: '22px',
                    border: '1px solid rgba(255,255,255,0.04)',
                    opacity: 0,
                    animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${i * 80}ms forwards`
                  }}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center mb-5"
                    style={{
                      borderRadius: '12px',
                      backgroundColor: `${feature.accent}12`,
                      border: `1px solid ${feature.accent}25`
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.accent }} />
                  </div>
                  <h3
                    className="text-base font-semibold mb-2"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.42)' }}
                  >
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-20 lg:h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── CTA Section ────────────────────────────────────────────────────── */}
      <section className="py-28 lg:py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <div
            className="text-center px-8 py-20"
            style={{
              backgroundColor: '#111416',
              borderRadius: '22px',
              border: '1px solid rgba(255,255,255,0.05)',
              background: 'linear-gradient(180deg, rgba(153,247,255,0.04) 0%, #111416 60%)'
            }}
          >
            <div
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 text-xs font-medium"
              style={{
                border: '1px solid rgba(153,247,255,0.2)',
                borderRadius: '100px',
                backgroundColor: 'rgba(153,247,255,0.06)',
                color: '#99f7ff'
              }}
            >
              <GraduationCap className="w-3 h-3" />
              Free access
            </div>

            <h2
              className="text-4xl lg:text-5xl font-bold tracking-tight mb-4"
              style={{ lineHeight: 1.08 }}
            >
              Start learning today.
            </h2>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold transition-all"
              style={{
                backgroundColor: '#f0f0f3',
                color: '#0a0c0e',
                borderRadius: '14px',
                boxShadow: '0 0 12px rgba(240,240,243,0.1)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(240,240,243,0.15)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.boxShadow = '0 0 12px rgba(240,240,243,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p
              className="mt-4 text-xs"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              Sign in with Google or GitHub
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        className="py-14 px-6"
        style={{ backgroundColor: '#f9f9fc' }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <p
                className="font-bold tracking-tight text-sm mb-1"
                style={{ color: '#0c0e10', letterSpacing: '0.08em' }}
              >
                STABLEGRID.IO
              </p>
              <p className="text-sm" style={{ color: 'rgba(12,14,16,0.4)' }}>
                Understanding data is your edge.
              </p>
            </div>

            <div className="flex items-center gap-6">
              {[
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'Support', href: '/support' }
              ].map(link => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm transition-colors"
                  style={{ color: 'rgba(12,14,16,0.4)' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'rgba(12,14,16,0.8)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'rgba(12,14,16,0.4)')}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div
            className="pt-6"
            style={{ borderTop: '1px solid rgba(12,14,16,0.06)' }}
          >
            <p className="text-xs" style={{ color: 'rgba(12,14,16,0.25)' }}>
              © 2026 stableGrid.io
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
