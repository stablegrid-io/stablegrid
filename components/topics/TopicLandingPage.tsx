import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { StableGridMark } from '@/components/brand/StableGridLogo';
import type { LandingTopic } from '@/lib/landing/topics';
import type { TheoryTrackSummary } from '@/data/learn/theory/tracks';

interface TopicLandingPageProps {
  topic: LandingTopic;
  tracks: TheoryTrackSummary[];
}

const TIERS = [
  {
    slug: 'junior',
    label: 'Junior',
    eyebrow: 'Foundational Modules',
    color: '#99f7ff',
    rgb: '153,247,255',
    multiplier: '1.0×',
  },
  {
    slug: 'mid',
    label: 'Mid',
    eyebrow: 'Advanced Systems',
    color: '#ffc965',
    rgb: '255,201,101',
    multiplier: '1.5×',
  },
  {
    slug: 'senior',
    label: 'Senior',
    eyebrow: 'Platform Architecture',
    color: '#ff716c',
    rgb: '255,113,108',
    multiplier: '3.0×',
  },
] as const;

const APPLE_FONT =
  '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

export function TopicLandingPage({ topic, tracks }: TopicLandingPageProps) {
  const tracksBySlug = new Map(tracks.map((t) => [t.slug, t] as const));

  const totalModules = tracks.reduce((s, t) => s + t.chapterCount, 0);
  const totalHours = Math.round(
    tracks.reduce((s, t) => s + t.totalMinutes, 0) / 60,
  );

  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden"
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
            @keyframes pulseGlow {
              0%, 100% { opacity: 0.35; }
              50% { opacity: 0.6; }
            }
            .topic-hero-cta { transition: transform 240ms ease, box-shadow 240ms ease; }
            .topic-hero-cta:hover { transform: translateY(-1px); box-shadow: 0 0 24px rgba(240,240,243,0.18); }
            .topic-hero-link { transition: opacity 200ms ease; }
            .topic-hero-link:hover { opacity: 1 !important; }
            .topic-hero-link__arrow { transition: transform 320ms cubic-bezier(.16,1,.3,1); }
            .topic-hero-link:hover .topic-hero-link__arrow { transform: translateX(4px); }
          `,
        }}
      />

      {/* ── Sticky nav ────────────────────────────────────────────────── */}
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
          <div className="flex items-center gap-3">
            <Link
              href="/topics"
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All topics
            </Link>
            <Link
              href="/login"
              prefetch={false}
              className="topic-hero-cta px-4 py-2 text-sm font-semibold whitespace-nowrap"
              style={{
                backgroundColor: '#f0f0f3',
                color: '#0a0c0e',
                borderRadius: 14,
                boxShadow: '0 0 12px rgba(240,240,243,0.1)',
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <header className="relative px-6 pt-32 lg:pt-40 pb-20 lg:pb-32">
          {/* Ambient glow seeded from category color */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(800px 500px at 50% 0%, rgba(${topic.catRgb},0.12), transparent 70%)`,
              animation: 'fadeIn 1.2s ease-out forwards',
              opacity: 0,
            }}
          />

          <div className="relative max-w-5xl mx-auto text-center">
            {/* Topic icon */}
            <div
              className="flex justify-center mb-10"
              style={{
                opacity: 0,
                animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 0ms forwards',
              }}
            >
              <div
                className="relative"
                style={{
                  filter: `drop-shadow(0 0 30px rgba(${topic.catRgb},0.25))`,
                }}
              >
                <Image
                  src={topic.icon}
                  alt={`${topic.name} logo`}
                  width={104}
                  height={104}
                  className="h-20 w-20 lg:h-[104px] lg:w-[104px] object-contain"
                />
              </div>
            </div>

            {/* Category eyebrow */}
            <p
              className="font-mono uppercase mb-6"
              style={{
                fontSize: 11,
                letterSpacing: '0.22em',
                color: `rgba(${topic.catRgb},0.95)`,
                opacity: 0,
                animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 80ms forwards',
              }}
            >
              {topic.category} Track
            </p>

            {/* Title */}
            <h1
              className="font-bold tracking-tight"
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 'clamp(2.75rem, 7vw, 5.75rem)',
                fontWeight: 600,
                letterSpacing: '-0.035em',
                lineHeight: 1.02,
                color: 'rgba(255,255,255,0.97)',
                marginBottom: 24,
                opacity: 0,
                animation: 'fadeSlideUp .7s cubic-bezier(.16,1,.3,1) 160ms forwards',
              }}
            >
              {topic.name}.
              <br />
              <span style={{ color: 'rgba(255,255,255,0.32)' }}>
                Junior to Senior.
              </span>
            </h1>

            {/* Tagline */}
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
              {topic.description}
            </p>

            {/* Dual CTA */}
            <div
              className="flex flex-wrap items-center justify-center gap-4"
              style={{
                opacity: 0,
                animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 360ms forwards',
              }}
            >
              <Link
                href="/login"
                prefetch={false}
                className="topic-hero-cta inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-semibold"
                style={{
                  backgroundColor: '#f0f0f3',
                  color: '#0a0c0e',
                  borderRadius: 14,
                  boxShadow: '0 0 12px rgba(240,240,243,0.1)',
                }}
              >
                Start the track
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#concepts"
                className="topic-hero-link inline-flex items-center gap-1.5 text-[15px] font-medium"
                style={{
                  color: 'rgba(255,255,255,0.78)',
                  opacity: 0.85,
                }}
              >
                <span>Explore the curriculum</span>
                <ArrowRight className="topic-hero-link__arrow h-4 w-4" />
              </a>
            </div>
          </div>
        </header>

        {/* ── Real-world users strip ─────────────────────────────────── */}
        <section className="px-6 pb-20 lg:pb-28">
          <div className="max-w-5xl mx-auto">
            <p
              className="text-center font-mono uppercase mb-6"
              style={{
                fontSize: 10,
                letterSpacing: '0.24em',
                color: 'rgba(255,255,255,0.32)',
              }}
            >
              In production at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {topic.realWorldUsers.map((user) => (
                <span
                  key={user}
                  className="font-bold tracking-tight"
                  style={{
                    fontFamily: APPLE_FONT,
                    fontSize: 'clamp(1.1rem, 1.4vw, 1.4rem)',
                    color: 'rgba(255,255,255,0.55)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {user}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why it matters ─────────────────────────────────────────── */}
        <section className="px-6 py-24 lg:py-36 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="max-w-3xl mx-auto">
            <p
              className="font-mono uppercase mb-8"
              style={{
                fontSize: 11,
                letterSpacing: '0.22em',
                color: `rgba(${topic.catRgb},0.85)`,
              }}
            >
              Why it matters
            </p>
            {(() => {
              const text = topic.whyItMatters;
              const splitIdx = text.indexOf('. ');
              const lead = splitIdx > 0 ? text.slice(0, splitIdx + 1) : text;
              const rest = splitIdx > 0 ? text.slice(splitIdx + 2) : '';
              return (
                <>
                  <p
                    style={{
                      fontFamily: APPLE_FONT,
                      fontSize: 'clamp(1.5rem, 2.4vw, 2rem)',
                      fontWeight: 600,
                      letterSpacing: '-0.022em',
                      lineHeight: 1.2,
                      color: 'rgba(255,255,255,0.97)',
                      marginBottom: rest ? 24 : 0,
                    }}
                  >
                    {lead}
                  </p>
                  {rest && (
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
                      {rest}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        </section>

        {/* ── Concepts you'll master ─────────────────────────────────── */}
        {tracks.length > 0 && (
          <section
            id="concepts"
            className="px-6 py-24 lg:py-32 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <div className="max-w-6xl mx-auto">
              <div className="max-w-2xl mb-14 lg:mb-16">
                <p
                  className="font-mono uppercase mb-4"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.22em',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  Curriculum
                </p>
                <h2
                  style={{
                    fontFamily: APPLE_FONT,
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 600,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.1,
                    color: 'rgba(255,255,255,0.97)',
                  }}
                >
                  Concepts you&rsquo;ll master.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
                {TIERS.map((tier) => {
                  const track = tracksBySlug.get(tier.slug);
                  if (!track) return null;
                  return (
                    <div key={tier.slug}>
                      <div className="flex items-center justify-between mb-5">
                        <span
                          className="font-mono uppercase"
                          style={{
                            fontSize: 10,
                            letterSpacing: '0.22em',
                            color: tier.color,
                            fontWeight: 700,
                          }}
                        >
                          {tier.label}
                        </span>
                        <span
                          className="font-mono uppercase"
                          style={{
                            fontSize: 10,
                            letterSpacing: '0.18em',
                            color: 'rgba(255,255,255,0.3)',
                          }}
                        >
                          {track.chapterCount} modules
                        </span>
                      </div>
                      <div
                        aria-hidden
                        className="h-px w-full mb-4"
                        style={{
                          background: `linear-gradient(to right, rgba(${tier.rgb},0.4), transparent)`,
                        }}
                      />
                      <ol className="space-y-2.5">
                        {track.chapters.map((chapter, i) => (
                          <li
                            key={chapter.id}
                            className="flex items-start gap-3"
                          >
                            <span
                              className="font-mono shrink-0 mt-[3px]"
                              style={{
                                fontSize: 10,
                                color: 'rgba(255,255,255,0.28)',
                                letterSpacing: '0.05em',
                                width: 22,
                              }}
                            >
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span
                              style={{
                                fontFamily: APPLE_FONT,
                                fontSize: 14,
                                lineHeight: 1.45,
                                color: 'rgba(255,255,255,0.82)',
                                fontWeight: 500,
                              }}
                            >
                              {chapter.title}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── By the numbers ─────────────────────────────────────────── */}
        <section className="px-6 py-24 lg:py-32 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="max-w-5xl mx-auto">
            <p
              className="font-mono uppercase mb-10 text-center"
              style={{
                fontSize: 11,
                letterSpacing: '0.22em',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              By the numbers
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 text-center">
              <BigStat label="Modules" value={String(totalModules)} />
              <BigStat label="Hours" value={`~${totalHours}`} />
              <BigStat label="Tiers" value="3" />
              <BigStat label="Path" value="Jr → Sr" valueIsText />
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────── */}
        <section className="px-6 py-28 lg:py-40 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
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
              Begin the {topic.name} track.
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
              Free to start. Sign in to unlock the full theory + practice library.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                prefetch={false}
                className="topic-hero-cta inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-semibold"
                style={{
                  backgroundColor: '#f0f0f3',
                  color: '#0a0c0e',
                  borderRadius: 14,
                  boxShadow: '0 0 12px rgba(240,240,243,0.1)',
                }}
              >
                Start the track
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/topics"
                className="topic-hero-link inline-flex items-center gap-1.5 text-[15px] font-medium"
                style={{ color: 'rgba(255,255,255,0.78)', opacity: 0.85 }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Browse all topics</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function BigStat({
  label,
  value,
  valueIsText,
}: {
  label: string;
  value: string;
  valueIsText?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: APPLE_FONT,
          fontSize: valueIsText
            ? 'clamp(1.5rem, 3vw, 2.25rem)'
            : 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 600,
          letterSpacing: '-0.025em',
          lineHeight: 1,
          color: 'rgba(255,255,255,0.97)',
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

