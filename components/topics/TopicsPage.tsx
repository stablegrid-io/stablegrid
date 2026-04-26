'use client';

import Link from 'next/link';
import { LANDING_TOPICS } from '@/lib/landing/topics';
import { StableGridMark } from '@/components/brand/StableGridLogo';
import { TopicCard } from './TopicCard';

export function TopicsPage() {
  return (
    <div
      className="relative min-h-screen text-white"
      style={{ backgroundColor: '#0a0c0e', fontFamily: 'Inter, sans-serif' }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeSlideUp {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `,
        }}
      />

      {/* Slim sticky nav — matches the landing post-scroll bar */}
      <nav
        aria-label="Topic categories"
        className="fixed top-0 w-full z-50 border-b"
        style={{
          backgroundColor: 'rgba(10, 12, 14, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.06)',
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
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(240,240,243,0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 0 12px rgba(240,240,243,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Get started
          </Link>
        </div>
      </nav>

      <main>
      {/* Header */}
      <header className="pt-32 pb-12 lg:pt-40 lg:pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            className="text-xs uppercase tracking-widest mb-4"
            style={{
              color: 'rgba(255,255,255,0.58)',
              letterSpacing: '0.18em',
              opacity: 0,
              animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 0ms forwards',
            }}
          >
            All Topics
          </p>
          <h1
            className="font-bold tracking-tight"
            style={{
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              fontSize: 'clamp(2.25rem, 5.5vw, 4rem)',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: 'rgba(255,255,255,0.97)',
              marginBottom: 16,
              opacity: 0,
              animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 80ms forwards',
            }}
          >
            Every topic.<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Three tiers each.</span>
          </h1>
          <p
            className="text-[15px] leading-relaxed max-w-xl"
            style={{
              color: 'rgba(255,255,255,0.5)',
              opacity: 0,
              animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 160ms forwards',
            }}
          >
            From Junior fundamentals to Senior architecture — every track follows the same structured progression.
            Each card opens the full theory + practice library when you sign in.
          </p>
          <div
            aria-hidden="true"
            className="h-px w-full mt-10 bg-gradient-to-r from-transparent via-white/15 to-transparent"
            style={{ opacity: 0, animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 240ms forwards' }}
          />
        </div>
      </header>

      {/* Cards grid */}
      <section className="px-6 pb-28 lg:pb-40" aria-labelledby="topics-grid-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="topics-grid-heading" className="sr-only">
            Tracks
          </h2>
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
          >
            {LANDING_TOPICS.map((topic, i) => (
              <TopicCard key={topic.name} topic={topic} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA — back to landing or sign in */}
      <section className="px-6 pb-28 lg:pb-40">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl lg:text-3xl font-bold tracking-tight mb-6"
            style={{ lineHeight: 1.15, color: 'rgba(255,255,255,0.95)' }}
          >
            Ready to start your first track?
          </h2>
          <Link
            href="/login"
            prefetch={false}
            className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-semibold transition-all"
            style={{
              backgroundColor: '#f0f0f3',
              color: '#0a0c0e',
              borderRadius: 14,
              boxShadow: '0 0 12px rgba(240,240,243,0.1)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(240,240,243,0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 0 12px rgba(240,240,243,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Get started
          </Link>
        </div>
      </section>
      </main>
    </div>
  );
}
