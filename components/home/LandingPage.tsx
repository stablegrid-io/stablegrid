'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, ChevronRight, Lock, Minus } from 'lucide-react';
import { LANDING_TOPICS } from '@/lib/landing/topics';
import { TopicCard } from '@/components/topics/TopicCard';
import { LandingIntro } from '@/components/home/landing/LandingIntro';
import { ComponentCatalogDemo } from '@/components/home/landing/ComponentCatalogDemo';

// ─── Nav on scroll ───────────────────────────────────────────────────────────

function NavOnScroll() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Smooth-scroll for anchor links — scoped to this landing nav only so we
  // don't need to touch global CSS (which already declares `scroll-behavior:
  // auto !important` under `prefers-reduced-motion`). JS `scrollIntoView`
  // respects that media query automatically.
  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: string,
  ) => {
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Update URL without jump.
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', hash);
    }
  };

  return (
    <nav
      aria-label="Sections"
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

        {/* Center nav links — desktop only */}
        <div className="hidden md:flex items-center gap-6 lg:gap-7 absolute left-1/2 -translate-x-1/2">
          {[
            { label: 'Topics', href: '#topics' },
            { label: 'Tiers', href: '#tiers' },
            { label: 'Grid', href: '#grid' },
            { label: 'Pricing', href: '#pricing' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="text-[13px] font-medium transition-colors"
              style={{
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '-0.005em',
              }}
              onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.95)')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            >
              {link.label}
            </a>
          ))}
        </div>

        <Link
          href="/login"
          prefetch={false}
          className="px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap"
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

// ─── Component ────────────────────────────────────────────────────────────────

export const LandingPage = () => {
  return (
    <div
      className="relative min-h-screen text-white"
      style={{ backgroundColor: '#0a0c0e', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Cinematic intro — plays once per session, fades into hero */}
      <LandingIntro />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .landing-hero-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.12) !important;
        }
        .landing-hero-link {
          position: relative;
        }
        .landing-hero-link__label {
          position: relative;
        }
        .landing-hero-link__label::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: -2px;
          height: 1px;
          background: currentColor;
          opacity: 0;
          transform: translateY(2px);
          transition: opacity 300ms cubic-bezier(.16,1,.3,1), transform 300ms cubic-bezier(.16,1,.3,1);
        }
        .landing-hero-link:hover { color: rgba(255,255,255,0.98) !important; }
        .landing-hero-link:hover .landing-hero-link__label::after {
          opacity: 0.65;
          transform: translateY(0);
        }
        .landing-hero-link:hover .landing-hero-link__arrow {
          transform: translate(2px, -2px);
        }
        .landing-hero-link:hover .landing-hero-link__arrow--chevron {
          transform: translateX(4px);
        }
      `,
        }}
      />

      {/* ── Navigation (appears on scroll) ─────────────────────────────── */}
      <NavOnScroll />

      <main>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="min-h-[100vh] flex items-center justify-center px-6 relative overflow-hidden">
        {/* Background image — full bleed, battery as hero */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/landing-hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Soft radial vignette — keeps the battery visible, adds contrast for text */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(10,12,14,0.35) 0%, rgba(10,12,14,0.72) 60%, rgba(10,12,14,0.94) 100%)',
            }}
          />
          {/* Bottom fade into next section */}
          <div
            className="absolute inset-x-0 bottom-0 h-48"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, #0a0c0e 100%)',
            }}
          />
        </div>

        {/* Centered hero stack */}
        <div className="relative z-10 w-full max-w-3xl mx-auto text-center flex flex-col items-center">
          {/* Beta pill */}
          <div
            className="inline-flex items-center gap-2"
            style={{
              padding: '6px 14px',
              marginBottom: 24,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.02em',
              color: 'rgba(255,255,255,0.72)',
              opacity: 0,
              animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 0ms forwards',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#99f7ff',
                boxShadow: '0 0 8px rgba(153,247,255,0.55)',
              }}
            />
            <span>Beta · Free for early users</span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.03,
              color: 'rgba(255,255,255,0.97)',
              marginBottom: 28,
              opacity: 0,
              animation: 'fadeSlideUp .7s cubic-bezier(.16,1,.3,1) 80ms forwards',
            }}
          >
            Understanding <span style={{ color: '#99f7ff' }}>data</span>
            <br />
            is your edge.
          </h1>

          {/* Subtitle — trimmed, one idea only */}
          <p
            style={{
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              fontSize: 'clamp(1rem, 1.4vw, 1.175rem)',
              fontWeight: 400,
              letterSpacing: '-0.005em',
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.62)',
              maxWidth: 540,
              marginBottom: 44,
              opacity: 0,
              animation: 'fadeSlideUp .7s cubic-bezier(.16,1,.3,1) 140ms forwards',
            }}
          >
            Every chapter you finish powers a district. Every project ships to your CV.
          </p>

          {/* CTAs — one primary pill + one text link */}
          <div
            className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4"
            style={{ opacity: 0, animation: 'fadeSlideUp .7s cubic-bezier(.16,1,.3,1) 260ms forwards' }}
          >
            <Link
              href="/login"
              prefetch={false}
              className="landing-hero-cta inline-flex items-center gap-2"
              style={{
                padding: '13px 26px',
                backgroundColor: '#f0f0f3',
                color: '#0a0c0e',
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: '-0.005em',
                boxShadow: '0 6px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'transform 200ms cubic-bezier(.16,1,.3,1), box-shadow 200ms ease',
              }}
            >
              Get started
              <ArrowRight aria-hidden="true" className="w-[15px] h-[15px]" strokeWidth={2.2} />
            </Link>

            <a
              href="#topics"
              onClick={(e) => {
                const target = document.querySelector('#topics');
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (typeof window !== 'undefined' && window.history?.replaceState) {
                  window.history.replaceState(null, '', '#topics');
                }
              }}
              className="landing-hero-link inline-flex items-center gap-1.5"
              style={{
                fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: '-0.005em',
                color: 'rgba(255,255,255,0.8)',
                transition: 'color 200ms ease',
              }}
            >
              <span className="landing-hero-link__label">Explore topics</span>
              <span aria-hidden className="landing-hero-link__arrow" style={{ transition: 'transform 300ms cubic-bezier(.16,1,.3,1)' }}>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-20 lg:h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />


      {/* ── Topics Showcase ────────────────────────────────────────────────── */}
      <section id="topics" className="py-28 lg:py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            className="font-mono font-bold text-xs uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em' }}
          >
            Topics
          </p>
          <div className="flex items-end justify-between mb-12 gap-4 flex-wrap">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ lineHeight: 1.1 }}>
              The whole data<br />
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>engineering stack.</span>
            </h2>
            <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              Spark, Fabric, Airflow, SQL, Kafka, dbt, Snowflake, Terraform — processing, orchestration, platforms, streaming, and governance, all under one roof.
            </p>
          </div>

          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
          >
            {LANDING_TOPICS.slice(0, 3).map((topic, i) => (
              <TopicCard key={topic.name} topic={topic} index={i} />
            ))}
          </div>

          {/* Apple-style explore link — centered text + arrow that animates on hover */}
          <div
            className="mt-12 flex justify-center"
            style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 380ms forwards' }}
          >
            <Link
              href="/topics"
              className="landing-hero-link inline-flex items-center gap-1.5 group"
              style={{
                fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: '-0.005em',
                color: 'rgba(255,255,255,0.85)',
                transition: 'color 200ms ease',
              }}
            >
              <span className="landing-hero-link__label">Explore all 20+ topics</span>
              <ChevronRight
                aria-hidden="true"
                className="landing-hero-link__arrow landing-hero-link__arrow--chevron w-4 h-4"
                strokeWidth={2.2}
                style={{ transition: 'transform 300ms cubic-bezier(.16,1,.3,1)' }}
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-20 lg:h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── Tier Showcase ────────────────────────────────────────────────── */}
      <section id="tiers" className="py-28 lg:py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <p
              className="font-mono font-bold text-xs uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em' }}
            >
              Progression
            </p>
            <span
              className="font-mono inline-flex items-center gap-1.5"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                color: '#99f7ff',
                textTransform: 'uppercase',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 999,
                border: '1px solid rgba(153,247,255,0.3)',
                background: 'rgba(153,247,255,0.08)',
              }}
            >
              <span aria-hidden style={{ width: 5, height: 5, borderRadius: '50%', background: '#99f7ff' }} />
              Preview
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6" style={{ lineHeight: 1.1 }}>
            Three levels of depth.<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>One clear path forward.</span>
          </h2>
          <p className="text-[15px] leading-relaxed mb-16" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '540px' }}>
            Every topic is structured into Junior, Mid, and Senior tiers. Start with foundations, progress to advanced systems, and master platform architecture.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                level: 'JUNIOR', subtitle: 'FOUNDATIONAL MODULES', color: '#99f7ff', rgb: '153,247,255',
                image: '/brand/track-junior.png',
                modules: '0/10', est: '~42 hours total', xp: '1.0X', cta: 'Start track',
              },
              {
                level: 'MID', subtitle: 'ADVANCED SYSTEMS', color: '#ffc965', rgb: '255,201,101',
                image: '/brand/track-mid.png',
                modules: '0/10', est: '~53 hours total', xp: '1.5X', cta: 'Start track',
              },
              {
                level: 'SENIOR', subtitle: 'PLATFORM ARCHITECTURE', color: '#ff716c', rgb: '255,113,108',
                image: '/brand/track-senior.png',
                modules: '0/10', est: '~66 hours total', xp: '3.0X', cta: 'Unlock at Mid',
                locked: true,
              },
            ].map((tier, i) => (
              <Link
                key={tier.level}
                href={tier.locked ? '#' : '/login'}
                className={`group block ${tier.locked ? 'pointer-events-none' : ''}`}
                style={{
                  opacity: 0,
                  animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${i * 100 + 200}ms forwards`,
                }}
              >
                <div
                  className="relative overflow-hidden h-full flex flex-col transition-transform duration-500 hover:scale-[1.015]"
                  style={{
                    background: '#181c20',
                    border: `1px solid ${tier.locked ? 'rgba(255,255,255,0.05)' : `rgba(${tier.rgb},0.12)`}`,
                    borderRadius: 22,
                  }}
                >
                  {/* L-bracket corners */}
                  <div className="absolute top-0 left-0 z-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-4 h-px" style={{ backgroundColor: tier.locked ? 'rgba(255,255,255,0.04)' : `rgba(${tier.rgb},0.25)` }} />
                    <div className="absolute top-0 left-0 w-px h-4" style={{ backgroundColor: tier.locked ? 'rgba(255,255,255,0.04)' : `rgba(${tier.rgb},0.25)` }} />
                  </div>
                  <div className="absolute bottom-0 right-0 z-10 pointer-events-none">
                    <div className="absolute bottom-0 right-0 w-4 h-px" style={{ backgroundColor: tier.locked ? 'rgba(255,255,255,0.04)' : `rgba(${tier.rgb},0.25)` }} />
                    <div className="absolute bottom-0 right-0 w-px h-4" style={{ backgroundColor: tier.locked ? 'rgba(255,255,255,0.04)' : `rgba(${tier.rgb},0.25)` }} />
                  </div>

                  {/* Banner image */}
                  <div className="relative h-44 overflow-hidden shrink-0">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${tier.image})`,
                        filter: tier.locked ? 'brightness(0.15) saturate(0)' : undefined,
                      }}
                    />
                    {/* bottom gradient fade into card */}
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to bottom, transparent 30%, #181c20 95%)' }}
                    />
                    {tier.locked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock aria-hidden="true" className="h-12 w-12 text-white/[0.07]" />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className={`relative flex-1 flex flex-col px-6 pb-6 pt-2 ${tier.locked ? 'opacity-35' : ''}`}>
                    {/* Title */}
                    <h3 className="text-[2.4rem] font-black tracking-tight leading-none mb-1" style={{ color: 'rgba(255,255,255,0.95)' }}>
                      {tier.level}
                    </h3>
                    <p
                      className="font-mono text-[10px] tracking-[0.18em] uppercase mb-8"
                      style={{ color: tier.color }}
                    >
                      {tier.subtitle}
                    </p>

                    {/* Stat rows */}
                    <div className="space-y-0 flex-1">
                      {[
                        { label: 'MODULES', value: tier.modules },
                        { label: 'Duration', value: tier.est },
                        { label: 'kWh Multiplier', value: tier.xp },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between py-3"
                          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {row.label}
                          </span>
                          <span className="font-mono text-[13px] font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-6">
                      <div
                        className="w-full py-3.5 text-center font-mono text-[12px] font-bold tracking-[0.2em] uppercase"
                        style={{
                          border: `1px solid ${tier.locked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
                          backgroundColor: tier.locked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                          color: tier.locked ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)',
                          borderRadius: 14,
                        }}
                      >
                        {tier.cta}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* Section divider */}
      <div className="h-20 lg:h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── Grid Game ──────────────────────────────────────────────────────── */}
      <section id="grid" className="py-28 lg:py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            className="font-mono font-bold text-xs uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em' }}
          >
            The Grid
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6" style={{ lineHeight: 1.1 }}>
            Learn. Earn.<br />
            <span style={{ color: '#99f7ff' }}>Rebuild the grid.</span>
          </h2>
          <p className="text-[15px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '560px' }}>
            Every lesson charges your kWh reserve. Spend it in the shop to bring ten power components online across an interactive 3D map of a real regional grid (Lithuania).
          </p>
          <p
            className="font-mono text-[11px] uppercase mb-16"
            style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em' }}
          >
            kWh = kilowatt-hour · earned per completed lesson
          </p>

          {/* Interactive catalog — live filters + toggleable deploy state */}
          <ComponentCatalogDemo />
        </div>
      </section>

      {/* Section divider */}
      <div className="h-20 lg:h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 lg:py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            className="font-mono font-bold text-xs uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em' }}
          >
            Pricing
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6" style={{ lineHeight: 1.1 }}>
            Free while we&apos;re in beta.<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>€2.99 if you want to back it.</span>
          </h2>
          <p className="text-[15px] leading-relaxed mb-16" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '520px' }}>
            Everyone gets the whole platform during beta. Supporters chip in so we can keep shipping — and lock in €2.99 for life.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'Free',
                price: '€0',
                cadence: 'during beta',
                note: 'No card. We\u2019ll tell you before anything changes.',
                cta: 'Start free',
                href: '/login',
                highlight: false,
                image: '/pricing-free.png',
                accent: '153,247,255',
                eyebrow: 'STARTER',
                tagline: 'Everything\u2019s open while we\u2019re in beta.',
                features: [
                  { included: true, label: 'All Junior, Mid & Senior modules' },
                  { included: true, label: 'Complete practice library' },
                  { included: true, label: 'Grid game — earn, shop, restore' },
                  { included: true, label: 'All tracks, all tiers' },
                  { included: true, label: 'Session timers & reading modes' },
                  { included: true, label: 'Progress tracking & activity map' },
                ],
              },
              {
                name: 'Supporter',
                price: '€2.99',
                cadence: 'per month · beta',
                note: '€2.99 stays €2.99 — even after beta ends.',
                cta: 'Back the beta',
                href: `/login?next=${encodeURIComponent('/settings?tab=billing&auto_upgrade=1')}`,
                highlight: true,
                badge: 'Beta · limited',
                image: '/pricing-monthly.png',
                accent: '255,201,101',
                eyebrow: 'EARLY SUPPORTER',
                tagline: 'Back the build. Lock in your price. Keep the grid on.',
                features: [
                  { included: true, label: 'Everything Free gets — no limits' },
                  { included: true, label: 'Your rate locked for life — €2.99 forever' },
                  { included: true, label: 'Founding Supporter — you were here first' },
                  { included: true, label: 'Your €2.99 pays servers, coffee, and shipping' },
                  { included: true, label: 'No ads, no upsells, no dark patterns' },
                  { included: true, label: 'Cancel anytime, keep your progress' },
                ],
              },
            ].map((plan, i) => (
              <div
                key={plan.name}
                className="relative flex flex-col overflow-hidden group"
                style={{
                  backgroundColor: '#0f1215',
                  borderRadius: '24px',
                  border: plan.highlight
                    ? `1px solid rgba(${plan.accent},0.35)`
                    : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: plan.highlight
                    ? `0 0 0 1px rgba(${plan.accent},0.08), 0 30px 80px rgba(0,0,0,0.55), 0 0 60px rgba(${plan.accent},0.12)`
                    : '0 20px 60px rgba(0,0,0,0.35)',
                  opacity: 0,
                  animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${i * 100}ms forwards`,
                }}
              >
                {/* L-bracket corners */}
                <div className="absolute top-0 left-0 z-20 pointer-events-none">
                  <div className="absolute top-0 left-0 w-5 h-px" style={{ backgroundColor: `rgba(${plan.accent},0.5)` }} />
                  <div className="absolute top-0 left-0 w-px h-5" style={{ backgroundColor: `rgba(${plan.accent},0.5)` }} />
                </div>
                <div className="absolute bottom-0 right-0 z-20 pointer-events-none">
                  <div className="absolute bottom-0 right-0 w-5 h-px" style={{ backgroundColor: `rgba(${plan.accent},0.5)` }} />
                  <div className="absolute bottom-0 right-0 w-px h-5" style={{ backgroundColor: `rgba(${plan.accent},0.5)` }} />
                </div>

                {plan.highlight && plan.badge && (
                  <div
                    className="absolute top-5 right-5 z-20 inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[10px] font-bold tracking-widest uppercase"
                    style={{
                      backgroundColor: `rgba(${plan.accent},0.14)`,
                      color: `rgb(${plan.accent})`,
                      border: `1px solid rgba(${plan.accent},0.35)`,
                      borderRadius: '100px',
                      letterSpacing: '0.16em',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: `rgb(${plan.accent})` }} />
                    {plan.badge}
                  </div>
                )}

                {/* Hero portrait banner */}
                <div className="relative h-32 overflow-hidden shrink-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-[1.04]"
                    style={{
                      backgroundImage: `url(${plan.image})`,
                      backgroundPosition: 'center 25%',
                    }}
                  />
                  {/* accent-tinted overlay */}
                  <div
                    className="absolute inset-0 mix-blend-overlay opacity-40"
                    style={{
                      background: `radial-gradient(ellipse at center, rgba(${plan.accent},0.35) 0%, transparent 65%)`,
                    }}
                  />
                  {/* bottom fade into card */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom, transparent 20%, #0f1215 98%)' }}
                  />
                  {/* vignette */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)' }}
                  />
                </div>

                {/* Body */}
                <div className="relative flex-1 flex flex-col px-7 pb-7 -mt-4 z-10">
                  {/* Name */}
                  <h3 className="text-[1.625rem] font-bold tracking-tight mb-1 leading-none" style={{ color: 'rgba(255,255,255,0.97)' }}>
                    {plan.name}
                  </h3>
                  <p className="text-[12.5px] mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className="font-black tracking-tight tabular-nums"
                      style={{
                        fontSize: '2.25rem',
                        letterSpacing: '-0.04em',
                        color: 'rgba(255,255,255,0.98)',
                        lineHeight: 1,
                      }}
                    >
                      {plan.price}
                    </span>
                    <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {plan.cadence}
                    </span>
                  </div>
                  <p className="text-[12.5px] mb-5" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.005em', lineHeight: 1.45 }}>
                    {plan.note}
                  </p>

                  {/* Divider */}
                  <div className="h-px w-full mb-5" style={{ background: `linear-gradient(to right, transparent, rgba(${plan.accent},0.15), transparent)` }} />

                  {/* Features */}
                  <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat.label} className="flex items-start gap-3">
                        {feat.included ? (
                          <div
                            className="flex items-center justify-center w-[18px] h-[18px] rounded-full mt-px shrink-0"
                            style={{
                              backgroundColor: `rgba(${plan.accent},0.14)`,
                              border: `1px solid rgba(${plan.accent},0.3)`,
                            }}
                          >
                            <Check
                              aria-hidden="true"
                              className="w-2.5 h-2.5"
                              style={{ color: `rgb(${plan.accent})` }}
                              strokeWidth={3}
                            />
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-center w-[18px] h-[18px] rounded-full mt-px shrink-0"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            <Minus
                              aria-hidden="true"
                              className="w-2.5 h-2.5"
                              style={{ color: 'rgba(255,255,255,0.2)' }}
                              strokeWidth={3}
                            />
                          </div>
                        )}
                        <span
                          className="text-[13px] leading-snug"
                          style={{
                            color: feat.included
                              ? 'rgba(255,255,255,0.82)'
                              : 'rgba(255,255,255,0.28)',
                          }}
                        >
                          {feat.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.href}
                    prefetch={false}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-[12.5px] font-bold tracking-widest uppercase transition-all"
                    style={{
                      backgroundColor: plan.highlight ? `rgb(${plan.accent})` : 'rgba(255,255,255,0.06)',
                      color: plan.highlight ? '#0a0c0e' : 'rgba(255,255,255,0.9)',
                      border: plan.highlight ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '14px',
                      letterSpacing: '0.18em',
                      boxShadow: plan.highlight ? `0 8px 30px rgba(${plan.accent},0.25)` : undefined,
                    }}
                    onMouseOver={(e) => {
                      if (plan.highlight) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 14px 40px rgba(${plan.accent},0.4)`;
                      } else {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (plan.highlight) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 8px 30px rgba(${plan.accent},0.25)`;
                      } else {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      }
                    }}
                  >
                    {plan.cta}
                    <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p
            className="text-center text-xs mt-10"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Cancel anytime. Keep your Free access forever.
          </p>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-20 lg:h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── CTA Section ────────────────────────────────────────────────────── */}
      <section className="py-28 lg:py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <div
            className="relative overflow-hidden text-center px-8 py-20"
            style={{
              backgroundColor: '#181c20',
              borderRadius: '22px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Battery hero — full-bleed, centered */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <Image
                src="/landing-cta-battery.png"
                alt=""
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover object-center"
              />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <h2
                className="text-4xl lg:text-5xl font-bold tracking-tight mb-4"
                style={{ lineHeight: 1.08 }}
              >
                Start learning today.
              </h2>
              <Link
                href="/login"
                prefetch={false}
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
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </Link>

              <p
                className="mt-4 text-xs"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Sign in with Google or GitHub
              </p>
            </div>
          </div>
        </div>
      </section>
      </main>

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
