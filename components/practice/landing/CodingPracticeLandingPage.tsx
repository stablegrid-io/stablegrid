import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BrandCell } from '@/components/brand/BrandCell';
import { LanguagesShowcase } from './LanguagesShowcase';
import { PracticeUiPreview } from './PracticeUiPreview';
import { getSamplePracticeQuestion } from '@/lib/landing/samplePracticeQuestion';

const APPLE_FONT =
  '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

const ACCENT_RGB = '153,247,255'; // cyan — same accent the in-app /practice/coding gallery uses

// Numbers for the "By the numbers" stat block. Hardcoded against the live
// catalogue (5 topic ladders, ~30–40 tasks each); update when the
// catalogue grows.
const TOTAL_TASKS = 173;
const TOTAL_TOPICS = 5;

const REAL_WORLD_USERS = ['Netflix', 'Uber', 'Shopify', 'LinkedIn'] as const;

export function CodingPracticeLandingPage() {
  // Real MCQ from JA1 — fed into the static practice-UI preview as a
  // product hero shot. Server-resolved at module load, no fetch needed.
  const sampleQuestion = getSamplePracticeQuestion();
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
            <BrandCell
              mono
              size={20}
              className="shrink-0"
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
        <header className="relative px-6 pt-32 lg:pt-40 pb-20 lg:pb-32">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(800px 500px at 50% 0%, rgba(${ACCENT_RGB},0.12), transparent 70%)`,
              animation: 'fadeIn 1.2s ease-out forwards',
              opacity: 0,
            }}
          />

          <div className="relative max-w-5xl mx-auto text-center">
            <p
              className="font-mono uppercase mb-6"
              style={{
                fontSize: 11,
                letterSpacing: '0.22em',
                color: `rgba(${ACCENT_RGB},0.95)`,
                opacity: 0,
                animation: 'fadeSlideUp .6s cubic-bezier(.16,1,.3,1) 80ms forwards',
              }}
            >
              Practice · Coding
            </p>

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
              Drill the rep.
              <br />
              <span style={{ color: 'rgba(255,255,255,0.32)' }}>
                Until hesitation goes.
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
              PySpark and pandas drills against fictional power-grid datasets.
              Joins, aggregations, memory &amp; skew, plan reading — Junior to
              Senior. Server-graded, deep-linked back into the lesson when you
              miss.
            </p>

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
                Start practicing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/topics"
                className="topic-hero-link inline-flex items-center gap-1.5 text-[15px] font-medium"
                style={{
                  color: 'rgba(255,255,255,0.78)',
                  opacity: 0.85,
                }}
              >
                <span>Browse theory topics</span>
                <ArrowRight className="topic-hero-link__arrow h-4 w-4" />
              </Link>
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
              The same engines run in production at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {REAL_WORLD_USERS.map((user) => (
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
                color: `rgba(${ACCENT_RGB},0.85)`,
              }}
            >
              Why drills
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
              Theory builds the map. Practice builds the reflex.
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
              Every track is a fictional power-grid scenario at production
              scale. You write the transform, predict the plan, diagnose the
              stack trace — and the platform server-grades the answer the
              same way Spark would. Get it right and the kWh banks; get it
              wrong and you deep-link straight back into the lesson that
              taught the missing piece.
            </p>
          </div>
        </section>

        {/* ── Three languages, one discipline ─────────────────────────── */}
        <LanguagesShowcase />

        {/* ── Inside the rep — static product shot of the practice UI ─ */}
        {sampleQuestion && <PracticeUiPreview sample={sampleQuestion} />}

        {/* ── By the numbers ─────────────────────────────────────────── */}
        <section
          className="px-6 py-24 lg:py-32 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
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
              <BigStat label="Tasks" value={String(TOTAL_TASKS)} />
              <BigStat label="Topics" value={String(TOTAL_TOPICS)} />
              <BigStat label="Tiers" value="3" />
              <BigStat label="Languages" value="2" />
            </div>
            <p
              className="text-center mt-10"
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 13,
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              SQL ladder coming soon. Computer Science, Logic, Math &amp;
              Statistics drills landing after that.
            </p>
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
              Pick a topic. Drill the rep.
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
              Free during beta. Sign in to start banking kWh.
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
                Start practicing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/topics"
                className="topic-hero-link inline-flex items-center gap-1.5 text-[15px] font-medium"
                style={{ color: 'rgba(255,255,255,0.78)', opacity: 0.85 }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Browse theory topics</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="tabular-nums"
        style={{
          fontFamily: APPLE_FONT,
          fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: 'rgba(255,255,255,0.97)',
        }}
      >
        {value}
      </div>
      <div
        className="font-mono mt-3"
        style={{
          fontSize: 11,
          letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
}
