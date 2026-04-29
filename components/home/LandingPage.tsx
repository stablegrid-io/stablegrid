'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Lock, Minus } from 'lucide-react';
import { LANDING_TOPICS } from '@/lib/landing/topics';
import { LANDING_FAQS as FAQS } from '@/lib/landing/faqs';
import { TopicCard } from '@/components/topics/TopicCard';
import { useTopicScores } from '@/lib/hooks/useTopicScores';
import { ComponentCatalogDemo } from '@/components/home/landing/ComponentCatalogDemo';
import { StableGridMark } from '@/components/brand/StableGridLogo';

// ─── Nav on scroll ───────────────────────────────────────────────────────────

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 lg:py-24 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-x-16 gap-y-12">
        {/* Left — heading + intro */}
        <div>
          <p
            className="font-mono font-bold text-xs uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em' }}
          >
            FAQ
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6" style={{ lineHeight: 1.1 }}>
            Let&rsquo;s clear<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>things up.</span>
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 460 }}>
            A few honest answers about what stablegrid is, who it&rsquo;s for, and what you&rsquo;ll actually walk away with.
          </p>
        </div>

        {/* Right — accordion */}
        <ul className="space-y-0">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <li
                key={item.q}
                style={{ borderTop: i === 0 ? '1px solid rgba(255,255,255,0.08)' : undefined, borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-6 py-5 text-left transition-colors"
                  style={{ color: 'rgba(255,255,255,0.92)' }}
                >
                  <span className="text-[17px] lg:text-[18px] font-semibold tracking-tight">{item.q}</span>
                  <span
                    aria-hidden
                    className="shrink-0 flex items-center justify-center w-6 h-6"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 280ms cubic-bezier(.16,1,.3,1)',
                      color: isOpen ? '#99f7ff' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <ChevronRight className="w-4 h-4 rotate-90" strokeWidth={2.2} />
                  </span>
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p
                      className="pb-5 pr-10 text-[15px] leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

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
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-semibold tracking-tight"
          style={{ letterSpacing: '-0.015em', fontSize: 16 }}
        >
          <StableGridMark className="h-5 w-5 shrink-0" style={{ color: 'rgba(255,255,255,0.95)' }} />
          <span>
            <span style={{ color: 'rgba(255,255,255,0.96)' }}>stablegrid</span>
            <span
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.4) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              .io
            </span>
          </span>
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

// ─── Topics Carousel ─────────────────────────────────────────────────────────
//
// Always 3 cards visible on desktop, 1 on mobile. Auto-rotates through every
// position; pauses while the pointer hovers the carousel so users can read.

const VISIBLE_DESKTOP = 3;
const AUTO_INTERVAL_MS = 4500;
const GAP_PX = 24;

const TopicsCarousel = ({
  topicScores,
}: {
  topicScores: Record<string, { average: number; count: number }>;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 5 cards / 3 visible → 3 stop positions (0, 1, 2). Wraps back to 0.
  const totalPages = Math.max(
    1,
    LANDING_TOPICS.length - VISIBLE_DESKTOP + 1,
  );

  // Scroll the track to a given page (one card-width step per page).
  const scrollToPage = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-carousel-card]');
    const step = (card?.offsetWidth ?? 0) + GAP_PX;
    el.scrollTo({ left: idx * step, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToPage(pageIndex);
  }, [pageIndex]);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % totalPages);
    }, AUTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPaused, totalPages]);

  const goPrev = () =>
    setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
  const goNext = () => setPageIndex((prev) => (prev + 1) % totalPages);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .topics-carousel-track::-webkit-scrollbar { display: none; }
            .topics-carousel-track { scrollbar-width: none; -ms-overflow-style: none; }
            .topics-carousel-btn { transition: opacity 200ms ease, transform 200ms ease, background-color 200ms ease; }
            .topics-carousel-btn:hover { background-color: rgba(255,255,255,0.16); transform: translateY(-50%) scale(1.05); }
            .topics-carousel-dot { transition: width 280ms cubic-bezier(.16,1,.3,1), background-color 200ms ease; }
          `,
        }}
      />

      <div
        ref={trackRef}
        className="topics-carousel-track flex overflow-x-auto snap-x snap-mandatory pb-2"
        style={{ gap: GAP_PX, scrollSnapType: 'x mandatory' }}
      >
        {LANDING_TOPICS.map((topic, i) => (
          <div
            key={topic.name}
            data-carousel-card
            className="snap-start shrink-0 w-full md:w-[calc((100%-48px)/3)]"
          >
            <TopicCard
              topic={topic}
              index={i}
              score={topicScores[topic.topicId] ?? null}
            />
          </div>
        ))}
      </div>

      {/* Prev / Next buttons */}
      <button
        type="button"
        aria-label="Previous topics"
        onClick={goPrev}
        className="topics-carousel-btn absolute -left-3 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'rgba(255,255,255,0.9)',
        }}
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
      </button>
      <button
        type="button"
        aria-label="Next topics"
        onClick={goNext}
        className="topics-carousel-btn absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'rgba(255,255,255,0.9)',
        }}
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
      </button>

      {/* Page dots */}
      <div
        className="mt-6 flex justify-center gap-2"
        role="tablist"
        aria-label="Topic page"
      >
        {Array.from({ length: totalPages }).map((_, i) => {
          const active = i === pageIndex;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Page ${i + 1} of ${totalPages}`}
              onClick={() => setPageIndex(i)}
              className="topics-carousel-dot h-1.5 rounded-full"
              style={{
                width: active ? 24 : 6,
                backgroundColor: active
                  ? 'rgba(255,255,255,0.85)'
                  : 'rgba(255,255,255,0.2)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const LandingPage = () => {
  const topicScores = useTopicScores();
  return (
    <div
      className="relative min-h-screen text-white"
      style={{ backgroundColor: '#0a0c0e', fontFamily: 'Inter, sans-serif' }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes fadeSlideUp {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
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
          {/* Headline — two lines staggered for a smoother reveal */}
          <h1
            style={{
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.03,
              color: 'rgba(255,255,255,0.97)',
              marginBottom: 28,
            }}
          >
            <span
              style={{
                display: 'block',
                opacity: 0,
                animation: 'fadeSlideUp 1.1s cubic-bezier(.16,1,.3,1) 120ms forwards',
              }}
            >
              Understanding <span style={{ color: '#ffc965' }}>data</span>
            </span>
            <span
              style={{
                display: 'block',
                opacity: 0,
                animation: 'fadeSlideUp 1.1s cubic-bezier(.16,1,.3,1) 340ms forwards',
              }}
            >
              is your edge.
            </span>
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
              animation: 'fadeSlideUp 1s cubic-bezier(.16,1,.3,1) 580ms forwards',
            }}
          >
            Ed-tech for analysts and engineers who&rsquo;d rather understand a query plan than collect another certificate.
          </p>

          {/* CTAs — one primary pill + one text link */}
          <div
            className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4"
            style={{ opacity: 0, animation: 'fadeSlideUp 1s cubic-bezier(.16,1,.3,1) 800ms forwards' }}
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

            <Link
              href="/topics"
              prefetch={false}
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
            </Link>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-8 lg:h-12 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />


      {/* ── Topics Showcase ────────────────────────────────────────────────── */}
      <section id="topics" className="py-16 lg:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            className="font-mono font-bold text-xs uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em' }}
          >
            Topics
          </p>
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ lineHeight: 1.1 }}>
              Five tracks.<br />
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Junior to Senior.</span>
            </h2>
            <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              PySpark, Microsoft Fabric, Airflow, SQL, Python — each track takes you from foundations to production-ready depth.
            </p>
          </div>

          <TopicsCarousel topicScores={topicScores} />

          {/* Apple-style explore link — centered text + arrow that animates on hover */}
          <div
            className="mt-8 flex justify-center"
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
              <span className="landing-hero-link__label">Explore all 5 topics</span>
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
      <div className="h-8 lg:h-12 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── Tier Showcase ────────────────────────────────────────────────── */}
      <section id="tiers" className="py-16 lg:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <p
              className="font-mono font-bold text-xs uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em' }}
            >
              Progression
            </p>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6" style={{ lineHeight: 1.1 }}>
            Three levels of depth.<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>One clear path forward.</span>
          </h2>
          <p className="text-[15px] leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '540px' }}>
            Every topic is structured into Junior, Mid, and Senior tiers. Start with foundations, progress to advanced systems, and master platform architecture.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                level: 'JUNIOR', subtitle: 'FOUNDATIONAL MODULES', color: '#99f7ff', rgb: '153,247,255',
                description:
                  'Other platforms teach SQL in isolation, Python in isolation. We teach the systems behind production data — joins, schemas, scheduling — grounded in real warehouses from module one. Foundations that actually transfer.',
                cta: 'Start track', locked: false,
              },
              {
                level: 'MID', subtitle: 'ADVANCED SYSTEMS', color: '#ffc965', rgb: '255,201,101',
                description:
                  'Where most courses stop at intermediate, ours starts. Partitioning, query plans, broadcast joins, and the tradeoffs senior engineers weigh daily. Depth-first — no skim, no fluff.',
                cta: 'Start track', locked: false,
              },
              {
                level: 'SENIOR', subtitle: 'PLATFORM ARCHITECTURE', color: '#ff716c', rgb: '255,113,108',
                description:
                  "Most platforms don't have senior content. Ours does. Optimizer internals, multi-tenant governance, capacity planning — the depth you need to architect distributed systems, not just author scripts.",
                cta: 'Start track', locked: false,
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

                  {/* Banner: tier-tinted brand mark */}
                  <div className="relative h-44 overflow-hidden shrink-0">
                    {!tier.locked ? (
                      <>
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 transition-opacity duration-700 group-hover:opacity-80"
                          style={{
                            background: `radial-gradient(60% 70% at 50% 45%, rgba(${tier.rgb},0.18) 0%, rgba(${tier.rgb},0.05) 40%, transparent 75%)`,
                          }}
                        />
                        <div
                          className="absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
                          style={{
                            color: tier.color,
                            filter: `drop-shadow(0 0 18px rgba(${tier.rgb},0.35))`,
                          }}
                        >
                          <StableGridMark className="h-24 w-24 lg:h-28 lg:w-28" />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Lock aria-hidden="true" className="h-10 w-10 text-white/[0.12]" />
                      </div>
                    )}
                    {/* bottom gradient fade into card */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(to bottom, transparent 30%, #181c20 95%)' }}
                    />
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

                    {/* Why-it-stands-out copy */}
                    <div
                      className="flex-1 pt-4"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <p
                        style={{
                          fontFamily:
                            '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: 'rgba(255,255,255,0.72)',
                          letterSpacing: '-0.005em',
                        }}
                      >
                        {tier.description}
                      </p>
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
      <div className="h-8 lg:h-12 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── Grid Game ──────────────────────────────────────────────────────── */}
      <section id="grid" className="py-16 lg:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            className="font-mono font-bold text-xs uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em' }}
          >
            The Grid
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6" style={{ lineHeight: 1.1 }}>
            Learn. Earn.<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Rebuild the grid.</span>
          </h2>
          <p className="text-[15px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '560px' }}>
            Every lesson charges your kWh reserve. Spend it in the shop to bring ten power components online across an interactive 3D map of a real regional grid (Lithuania).
          </p>
          <p
            className="font-mono text-[11px] uppercase mb-10"
            style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em' }}
          >
            kWh = kilowatt-hour · earned per completed lesson
          </p>

          {/* Interactive catalog — live filters + toggleable deploy state */}
          <ComponentCatalogDemo />
        </div>
      </section>

      {/* Section divider */}
      <div className="h-8 lg:h-12 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 lg:py-24 px-6">
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
          <p className="text-[15px] leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '520px' }}>
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
                price: '€14.99',
                cadence: 'one-time · beta',
                note: '€14.99 once. Lifetime access — no subscription, no renewals.',
                cta: 'Back the beta',
                href: `/login?next=${encodeURIComponent('/settings?tab=billing&auto_upgrade=1')}`,
                highlight: true,
                badge: 'Beta · limited',
                accent: '255,201,101',
                eyebrow: 'FOUNDING SUPPORTER',
                tagline: 'Back the build. Pay once. Lifetime access.',
                features: [
                  { included: true, label: 'Everything Free gets — no limits' },
                  { included: true, label: 'Lifetime access — paid once, no recurring fee' },
                  { included: true, label: 'Founding Supporter — you were here first' },
                  { included: true, label: 'Your €14.99 pays servers, coffee, and shipping' },
                  { included: true, label: 'No ads, no upsells, no dark patterns' },
                  { included: true, label: 'Pay once, keep your progress forever' },
                ],
              },
            ].map((plan, i) => (
              <div
                key={plan.name}
                className="relative flex flex-col overflow-hidden group"
                style={{
                  backgroundColor: '#181c20',
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

                {/* Hero banner: tier-tinted brand mark */}
                <div className="relative h-32 overflow-hidden shrink-0">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 transition-opacity duration-700 group-hover:opacity-80"
                    style={{
                      background: `radial-gradient(60% 70% at 50% 45%, rgba(${plan.accent},0.18) 0%, rgba(${plan.accent},0.05) 40%, transparent 75%)`,
                    }}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
                    style={{
                      color: plan.highlight ? `rgb(${plan.accent})` : 'rgba(255,255,255,0.95)',
                      filter: plan.highlight
                        ? `drop-shadow(0 0 18px rgba(${plan.accent},0.35))`
                        : 'drop-shadow(0 0 18px rgba(255,255,255,0.25))',
                    }}
                  >
                    <StableGridMark className="h-20 w-20" />
                  </div>
                  {/* bottom fade into card */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, transparent 20%, #181c20 98%)' }}
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
                              backgroundColor: plan.highlight
                                ? `rgba(${plan.accent},0.14)`
                                : 'rgba(255,255,255,0.08)',
                              border: plan.highlight
                                ? `1px solid rgba(${plan.accent},0.3)`
                                : '1px solid rgba(255,255,255,0.18)',
                            }}
                          >
                            <Check
                              aria-hidden="true"
                              className="w-2.5 h-2.5"
                              style={{
                                color: plan.highlight
                                  ? `rgb(${plan.accent})`
                                  : 'rgba(255,255,255,0.95)',
                              }}
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
      <div className="h-8 lg:h-12 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <FaqSection />

      {/* Section divider */}
      <div className="h-8 lg:h-12 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0e 40%, #0a0c0e 60%, transparent)' }} />

      {/* ── CTA Section ────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div
            className="relative overflow-hidden text-center px-8 py-14"
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
              <div
                className="inline-flex items-center gap-2.5 font-semibold tracking-tight mb-1"
                style={{ letterSpacing: '-0.015em', fontSize: 16 }}
              >
                <StableGridMark className="h-5 w-5 shrink-0" style={{ color: '#0c0e10' }} />
                <span>
                  <span style={{ color: '#0c0e10' }}>stablegrid</span>
                  <span
                    style={{
                      background:
                        'linear-gradient(180deg, #0c0e10 0%, rgba(12,14,16,0.4) 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    .io
                  </span>
                </span>
              </div>
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
              © 2026 stablegrid.io
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
