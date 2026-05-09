import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { StableGridMark } from '@/components/brand/StableGridLogo';
import type { ComingSoonCategory } from '@/lib/landing/comingSoonCategories';

const APPLE_FONT =
  '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

interface Props {
  category: ComingSoonCategory;
}

/**
 * Public landing page for a practice category that has no live tracks
 * yet — Computer Science / Logic / Math & Statistics. Sets the vision,
 * names the planned topics, points people back to the live Coding
 * landing while the catalogue is in build.
 *
 * Same structural rhythm as `CodingPracticeLandingPage` (sticky nav →
 * hero → why → planned topics → final CTA), minus the "Live tracks"
 * gallery and the "A Question Inside" sample (no content to embed yet).
 */
export function ComingSoonCategoryLandingPage({ category }: Props) {
  const rgb = category.accentRgb;

  return (
    <div
      className="relative min-h-screen text-on-surface overflow-x-hidden"
      style={{ backgroundColor: '#0a0c0e', fontFamily: 'Inter, sans-serif' }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeSlideUp {
              from { opacity: 0; transform: translateY(18px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .topic-hero-cta { transition: transform 240ms ease, box-shadow 240ms ease; }
            .topic-hero-cta:hover { transform: translateY(-1px); box-shadow: 0 0 24px rgba(240,240,243,0.18); }
            .topic-hero-link { transition: opacity 200ms ease; }
            .topic-hero-link:hover { opacity: 1 !important; }
            .topic-hero-link__arrow { transition: transform 320ms cubic-bezier(.16,1,.3,1); }
            .topic-hero-link:hover .topic-hero-link__arrow { transform: translateX(4px); }
          `,
        }}
      />

      {/* ── Sticky nav ─────────────────────────────────────────────────── */}
      <nav
        aria-label="Top navigation"
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
            <StableGridMark
              className="h-5 w-5 shrink-0"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            />
            <span>
              <span style={{ color: 'rgba(255,255,255,0.96)' }}>stablegrid</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>.io</span>
            </span>
          </Link>
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back home
          </Link>
        </div>
      </nav>

      <main>
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <header className="relative px-6 pt-32 lg:pt-40 pb-20 lg:pb-28">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(800px 500px at 50% 0%, rgba(${rgb},0.12), transparent 70%)`,
              animation: 'fadeIn 1.2s ease-out forwards',
              opacity: 0,
            }}
          />

          <div className="relative max-w-5xl mx-auto text-center">
            {/* Coming-soon badge */}
            <div
              className="inline-flex self-center mb-7"
              style={{
                opacity: 0,
                animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 0ms forwards',
              }}
            >
              <span
                className="font-mono uppercase"
                style={{
                  fontSize: 11,
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: `1px dashed rgba(${rgb},0.35)`,
                  backgroundColor: `rgba(${rgb},0.05)`,
                  color: `rgb(${rgb})`,
                  letterSpacing: '0.22em',
                  fontWeight: 700,
                }}
              >
                Coming Soon · {category.category}
              </span>
            </div>

            <p
              className="font-mono uppercase mb-6"
              style={{
                fontSize: 11,
                letterSpacing: '0.22em',
                color: `rgba(${rgb},0.85)`,
                opacity: 0,
                animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 80ms forwards',
              }}
            >
              {category.eyebrow}
            </p>

            <h1
              className="font-bold tracking-tight"
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                fontWeight: 600,
                letterSpacing: '-0.035em',
                lineHeight: 1.05,
                color: 'rgba(255,255,255,0.97)',
                marginBottom: 24,
                opacity: 0,
                animation: 'fadeSlideUp .7s cubic-bezier(.16,1,.3,1) 160ms forwards',
              }}
            >
              {category.headlineLine1}
              <br />
              <span style={{ color: 'rgba(255,255,255,0.32)' }}>
                {category.headlineLine2}
              </span>
            </h1>

            <p
              className="max-w-2xl mx-auto"
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 'clamp(1rem, 1.4vw, 1.25rem)',
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.62)',
                marginBottom: 40,
                opacity: 0,
                animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 260ms forwards',
              }}
            >
              {category.tagline}
            </p>

            <div
              className="flex flex-wrap items-center justify-center gap-4"
              style={{
                opacity: 0,
                animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 360ms forwards',
              }}
            >
              <Link
                href="/practice/coding/landing"
                prefetch={false}
                className="topic-hero-cta inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-semibold"
                style={{
                  backgroundColor: '#f0f0f3',
                  color: '#0a0c0e',
                  borderRadius: 14,
                  boxShadow: '0 0 12px rgba(240,240,243,0.1)',
                }}
              >
                Drill what is live
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#planned"
                className="topic-hero-link inline-flex items-center gap-1.5 text-[15px] font-medium"
                style={{
                  color: 'rgba(255,255,255,0.78)',
                  opacity: 0.85,
                }}
              >
                <span>See what is coming</span>
                <ArrowRight className="topic-hero-link__arrow h-4 w-4" />
              </a>
            </div>
          </div>
        </header>

        {/* ── Banner image strip — sets the visual identity ──────────── */}
        <section className="px-6 pb-20 lg:pb-28">
          <div className="max-w-5xl mx-auto">
            <div
              className="relative overflow-hidden"
              style={{
                height: 280,
                borderRadius: 22,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Image
                src={category.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover object-center"
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(60% 70% at 50% 50%, rgba(${rgb},0.12) 0%, transparent 70%)`,
                }}
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, transparent 0%, #0a0c0e 100%)',
                }}
              />
            </div>
          </div>
        </section>

        {/* ── Why this discipline ────────────────────────────────────── */}
        <section
          className="px-6 py-24 lg:py-36 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="max-w-3xl mx-auto">
            <p
              className="font-mono uppercase mb-8"
              style={{
                fontSize: 11,
                letterSpacing: '0.22em',
                color: `rgba(${rgb},0.85)`,
              }}
            >
              Why {category.name}
            </p>
            <p
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 'clamp(1.5rem, 2.4vw, 2rem)',
                fontWeight: 600,
                letterSpacing: '-0.022em',
                lineHeight: 1.2,
                color: 'rgba(255,255,255,0.97)',
                marginBottom: 24,
              }}
            >
              {category.whyLead}
            </p>
            <p
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 'clamp(1rem, 1.2vw, 1.125rem)',
                fontWeight: 400,
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.62)',
                letterSpacing: '-0.005em',
              }}
            >
              {category.whyBody}
            </p>
          </div>
        </section>

        {/* ── What's coming — planned topics ─────────────────────────── */}
        <section
          id="planned"
          className="px-6 py-24 lg:py-32 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="max-w-5xl mx-auto">
            <p
              className="font-mono uppercase mb-4"
              style={{
                fontSize: 11,
                letterSpacing: '0.22em',
                color: `rgba(${rgb},0.85)`,
              }}
            >
              On the build queue
            </p>
            <h2
              className="font-bold tracking-tight"
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                color: 'rgba(255,255,255,0.97)',
                marginBottom: 14,
              }}
            >
              {category.plannedTopics.length} topic ladders.
              <br />
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                Junior · Mid · Senior on each one.
              </span>
            </h2>
            <p
              className="mb-12"
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 'clamp(1rem, 1.2vw, 1.125rem)',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.55)',
                maxWidth: 640,
              }}
            >
              Same shape as the Coding catalogue: read-and-diagnose
              recognition tracks, server-graded answers, deep-link back
              into the lesson when you miss. Tracks land here as they ship.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.plannedTopics.map((topic) => (
                <div
                  key={topic.name}
                  className="relative overflow-hidden"
                  style={{
                    backgroundColor: '#181c20',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 18,
                    padding: '20px 22px',
                  }}
                >
                  <div className="flex items-baseline justify-between mb-2 gap-3">
                    <h3
                      className="font-bold tracking-tight"
                      style={{
                        fontFamily: APPLE_FONT,
                        fontSize: 17,
                        letterSpacing: '-0.015em',
                        color: 'rgba(255,255,255,0.95)',
                      }}
                    >
                      {topic.name}
                    </h3>
                    <span
                      className="font-mono uppercase shrink-0"
                      style={{
                        fontSize: 9,
                        padding: '2px 8px',
                        borderRadius: 999,
                        border: '1px dashed rgba(255,255,255,0.10)',
                        color: 'rgba(255,255,255,0.35)',
                        letterSpacing: '0.16em',
                        fontWeight: 700,
                      }}
                    >
                      Soon
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: APPLE_FONT,
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {topic.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────── */}
        <section
          className="px-6 py-28 lg:py-40 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
                fontWeight: 600,
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                color: 'rgba(255,255,255,0.97)',
                marginBottom: 16,
              }}
            >
              While {category.name} ships,
              <br />
              keep the reps going.
            </h2>
            <p
              className="mb-10"
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 'clamp(1rem, 1.4vw, 1.2rem)',
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              The Coding catalogue is live today — PySpark, pandas, Junior
              to Senior. Drill there until {category.name} lands.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/practice/coding/landing"
                prefetch={false}
                className="topic-hero-cta inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-semibold"
                style={{
                  backgroundColor: '#f0f0f3',
                  color: '#0a0c0e',
                  borderRadius: 14,
                  boxShadow: '0 0 12px rgba(240,240,243,0.1)',
                }}
              >
                Drill Coding now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="topic-hero-link inline-flex items-center gap-1.5 text-[15px] font-medium"
                style={{ color: 'rgba(255,255,255,0.78)', opacity: 0.85 }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back home</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
