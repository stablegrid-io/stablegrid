'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import {
  trackProductEvent,
  trackProductEventOnce,
} from '@/lib/analytics/productAnalytics';
import { completeOnboarding } from '@/app/onboarding/actions';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface OnboardingFlowProps {
  displayName: string;
  /**
   * Preview mode — when true, the flow renders the same UI but skips the
   * `completeOnboarding()` write and the analytics events. Reached via
   * `/onboarding?preview=1`. Used to walk an already-onboarded user through
   * the flow without resetting their progress or polluting telemetry.
   */
  previewMode?: boolean;
}

interface Slide {
  eyebrow: string;
  title: string;
  /**
   * Either a `src` for a real photo (e.g. /grid/components/...) or a render
   * function for a typographic hero that uses the editorial system instead
   * of imagery. Matches the rhythm of ComponentSpecSheet — large hero up
   * top, caption under, footer below.
   */
  heroSrc?: string;
  hero?: React.ReactNode;
  caption: string;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export function OnboardingFlow({ displayName, previewMode = false }: OnboardingFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [index, setIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const signupTrackedRef = useRef(false);
  const firstName = displayName.split(' ')[0];

  const SLIDES: Slide[] = [
    {
      eyebrow: 'Stablegrid · Briefing',
      title: `Welcome aboard, ${firstName}.`,
      hero: <WelcomeHero />,
      caption:
        'Glad you’re here. PySpark is the language data teams reach for when one machine isn’t enough — terabytes of telemetry, billions of events, the work that powers streaming, fraud detection, and most of modern analytics. Five short screens to show you the shape of the course.',
    },
    {
      eyebrow: 'Step 02 · Theory',
      title: 'Read first. Short lessons.',
      hero: <TheoryHero />,
      caption:
        'Each module unpacks one concept across ten lessons of prose plus runnable PySpark snippets. Five to ten minutes per lesson — read on the train, finish over lunch.',
    },
    {
      eyebrow: 'Step 03 · Practice',
      title: 'Then check it landed.',
      hero: <PracticeHero />,
      caption:
        'Six multiple-choice tasks per module. No code editor — just questions that prove the lesson stuck. Every answer comes with a short rationale you keep.',
    },
    {
      eyebrow: 'Step 04 · The economy',
      title: 'Every minute earns kWh.',
      hero: <GenerationChartHero />,
      caption:
        'Five kWh per lesson read, twenty-five per module finished, more on higher tiers. The dashboard tracks your generation in real time — the battery caps at 5,000, the surplus is yours to spend.',
    },
    {
      eyebrow: 'Step 05 · Saulėgrid',
      title: 'Spend kWh. Restore the grid.',
      heroSrc: '/grid/components/primary-substation.jpg',
      caption:
        'The fictional Baltic utility went dark in April. Deploy substations, transformers, and storage to bring it back online — each component you ship reveals an essay on how that part of the grid actually works.',
    },
  ];

  const total = SLIDES.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const slide = SLIDES[index];

  const next = () => {
    if (isLast) {
      void finish();
    } else {
      setIndex((i) => Math.min(total - 1, i + 1));
    }
  };

  const prev = () => {
    setIndex((i) => Math.max(0, i - 1));
  };

  // Keyboard nav — left/right step through slides, Esc skips.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') void skip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isLast]);

  useEffect(() => {
    if (signupTrackedRef.current) return;
    if (searchParams.get('signup') !== '1') return;
    signupTrackedRef.current = true;
    void trackProductEventOnce('signup_completed', 'signup_completed', {
      method: searchParams.get('method') ?? 'unknown',
    });
  }, [searchParams]);

  const finish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    setFinishError(null);
    const destination = '/theory';
    if (previewMode) {
      router.push(destination);
      return;
    }
    await trackProductEvent('onboarding_completed', {
      selectedTopics: ['pyspark'],
      selectedGoal: null,
      selectedLevel: null,
      destination,
    });
    const result = await completeOnboarding();
    if (!result.ok) {
      setIsFinishing(false);
      setFinishError(result.error);
      return;
    }
    router.push(destination);
    router.refresh();
  };

  const skip = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    if (previewMode) {
      router.push('/home');
      return;
    }
    await trackProductEvent('onboarding_completed', {
      selectedTopics: ['pyspark'],
      selectedGoal: null,
      selectedLevel: null,
      destination: '/home',
      skipped: true,
      skippedAtStep: `slide-${index + 1}`,
    });
    const result = await completeOnboarding();
    router.push('/home');
    if (result.ok) router.refresh();
  };

  return (
    <main
      className="fixed inset-0 z-40 flex items-center justify-center bg-surface bg-grid-pattern px-4 sm:px-6 pt-14 sm:pt-20 pb-4 sm:pb-6 overflow-hidden"
      style={{ animation: 'editorial-fade 200ms ease-out' }}
    >
      {previewMode && (
        <p className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 font-data-mono uppercase text-[9px] tracking-[0.22em] text-primary bg-surface px-2.5 py-1 border border-primary/40">
          Preview · Nothing will be saved
        </p>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes editorial-fade {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes editorial-fill {
              from { transform: scaleX(0); }
              to { transform: scaleX(1); }
            }
          `,
        }}
      />

      {/* Modal frame — matches ComponentSpecSheet's silhouette: cream bg,
          ink hairline, vermillion left strip, capped at 92vh so the layout
          never demands a scroll. */}
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative bg-surface border border-on-surface w-full max-w-[920px] flex flex-col overflow-hidden"
        style={{
          // Explicit height (not max-h) so the inner `flex-1` hero container
          // has a real value to grow into. Sized off the dynamic viewport
          // unit minus the parent padding so the modal always fits — capped
          // at 640px on tall screens so it doesn't stretch awkwardly. The
          // 4rem buffer (vs the page's 1rem padding) leaves room above and
          // below for the PREVIEW chip + a comfortable margin so the top
          // edge of the modal never touches the viewport edge.
          height: 'min(calc(100dvh - 4rem), 640px)',
          borderLeftWidth: 3,
          borderLeftColor: '#a33800',
        }}
      >
        {/* Header — eyebrow + title left, close X right. */}
        <header className="flex items-start justify-between gap-6 px-6 sm:px-8 py-4 sm:py-5 border-b border-surface-dim">
          <div className="min-w-0">
            <p className="font-data-mono uppercase text-[9px] sm:text-[10px] tracking-[0.22em] text-on-surface-variant mb-1.5">
              {slide.eyebrow}
            </p>
            <h1
              id="onboarding-title"
              className="font-serif text-[22px] sm:text-[26px] leading-tight tracking-tight text-on-surface truncate"
            >
              {slide.title}
            </h1>
          </div>
          <button
            type="button"
            onClick={skip}
            disabled={isFinishing}
            aria-label="Skip the briefing"
            className="shrink-0 inline-flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </header>

        {/* Hero — flex-1 + min-h-0 lets the image shrink to whatever's left
            after header / caption / footer claim their fixed heights, so the
            modal always fits the viewport regardless of screen height. */}
        <div className="flex-1 min-h-0 px-6 sm:px-8 pt-3 sm:pt-4">
          <div
            key={index}
            className="relative w-full h-full overflow-hidden border border-surface-dim bg-surface-container-low"
            style={{ animation: 'editorial-fade 320ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {slide.heroSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={slide.heroSrc}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: 'saturate(0.7) contrast(0.97)' }}
              />
            ) : (
              slide.hero
            )}
          </div>
        </div>

        {/* Caption — italic serif, the lede that explains the hero. */}
        <p
          key={`caption-${index}`}
          className="px-6 sm:px-8 pt-3 pb-4 font-serif italic text-[14px] sm:text-[15px] leading-relaxed text-on-surface max-w-[68ch]"
          style={{ animation: 'editorial-fade 360ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {slide.caption}
        </p>

        {/* Footer — Prev (left) · dots + counter (center) · Next (right). */}
        <footer className="flex items-center justify-between gap-4 px-6 sm:px-8 py-3.5 border-t border-surface-dim">
          <button
            type="button"
            onClick={prev}
            disabled={isFirst}
            className="inline-flex items-center gap-2 font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            Prev
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" role="presentation">
              {SLIDES.map((s, i) => (
                <span
                  key={s.eyebrow}
                  aria-hidden
                  className="h-1.5 transition-all duration-300"
                  style={{
                    width: i === index ? 22 : 8,
                    backgroundColor:
                      i === index
                        ? '#1c1c16'
                        : i < index
                          ? 'rgba(28,28,22,0.35)'
                          : 'rgba(28,28,22,0.12)',
                  }}
                />
              ))}
            </div>
            <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant tabular-nums">
              {index + 1} / {total}
            </span>
          </div>

          <button
            type="button"
            onClick={next}
            disabled={isFinishing}
            className="inline-flex items-center gap-2 px-5 py-2.5 font-data-mono uppercase text-[11px] tracking-wider text-primary border border-primary hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLast ? (isFinishing ? 'Loading…' : 'Start') : 'Next'}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </footer>

        {finishError && (
          <p className="absolute bottom-20 left-1/2 -translate-x-1/2 font-data-mono uppercase text-[10px] tracking-[0.18em] text-primary bg-surface px-3 py-1.5 border border-primary">
            Something went wrong — {finishError}. Try again.
          </p>
        )}
      </article>
    </main>
  );
}

/* ── Hero variants — typographic, no portrait imagery ─────────────────────── */

function WelcomeHero() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-grid-pattern">
      <div className="text-center">
        <p className="font-data-mono uppercase text-[10px] sm:text-[11px] tracking-[0.32em] text-on-surface-variant mb-4">
          File 001 · Operator briefing
        </p>
        <p className="font-serif lowercase text-[44px] sm:text-[64px] leading-none tracking-tight text-on-surface">
          stable<span className="text-primary">grid</span>
          <span className="text-on-surface-variant">.io</span>
        </p>
      </div>
    </div>
  );
}

/* Slide 2 — a mock theory lesson card with prose + a small PySpark
   snippet. The snippet is the standard "open a SparkSession, read a CSV"
   pattern shown in lesson PS1; it's deliberately the simplest possible
   example so the slide reads as a *style preview*, not a teaching moment. */
function TheoryHero() {
  const SNIPPET_LINES: Array<Array<{ t: string; cls: string }>> = [
    [{ t: 'from', cls: 'kw' }, { t: ' pyspark.sql ', cls: '' }, { t: 'import', cls: 'kw' }, { t: ' SparkSession', cls: '' }],
    [{ t: '', cls: '' }],
    [{ t: 'spark = SparkSession.builder.appName(', cls: '' }, { t: '"nordgrid"', cls: 'str' }, { t: ').getOrCreate()', cls: '' }],
    [{ t: '', cls: '' }],
    [{ t: 'df = spark.read.csv(', cls: '' }, { t: '"meters.csv"', cls: 'str' }, { t: ', header=', cls: '' }, { t: 'True', cls: 'kw' }, { t: ')', cls: '' }],
    [{ t: 'df.show(', cls: '' }, { t: '5', cls: 'num' }, { t: ')', cls: '' }],
  ];
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-grid-pattern p-6 sm:p-10 overflow-hidden">
      <div className="w-full max-w-[640px] bg-surface border border-on-surface p-6 sm:p-8">
        <p className="font-data-mono uppercase text-[9px] sm:text-[10px] tracking-[0.22em] text-on-surface-variant mb-3">
          Module PS1 · Lesson 02
        </p>
        <h3 className="font-serif text-[20px] sm:text-[24px] leading-tight text-on-surface mb-3">
          Your first DataFrame
        </h3>
        <p className="font-body text-[12px] sm:text-[13px] leading-relaxed text-on-surface-variant mb-4">
          A DataFrame is a table that knows its own shape. Spark builds the
          execution plan first and runs it later when you ask for an answer.
        </p>
        <pre className="font-data-mono text-[11px] sm:text-[12px] leading-[1.7] bg-surface-container-low border border-surface-dim p-3 sm:p-4 overflow-hidden whitespace-pre">
          <code>
            {SNIPPET_LINES.map((line, i) => (
              <span key={i} className="block">
                {line.map((tok, j) => (
                  <span
                    key={j}
                    style={{
                      color:
                        tok.cls === 'kw'
                          ? '#a33800'
                          : tok.cls === 'str'
                            ? '#6b6a2e'
                            : tok.cls === 'num'
                              ? '#a33800'
                              : 'var(--on-surface, #1c1c16)',
                    }}
                  >
                    {tok.t}
                  </span>
                ))}
                {line.length === 1 && line[0].t === '' && ' '}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

/* Slide 3 — practice MCQ mock matching the chip-nav layout used on
   /practice/modules. One question, three options, the second pre-selected
   to show the active state. */
function PracticeHero() {
  const OPTIONS = [
    { code: '.filter(col("kw") > 100)', selected: false, correct: false },
    { code: '.show(5)', selected: true, correct: true },
    { code: '.withColumn("kwh", col("kw") * col("h"))', selected: false, correct: false },
  ];
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-grid-pattern p-6 sm:p-10 overflow-hidden">
      <div className="w-full max-w-[560px] bg-surface border border-on-surface flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-dim">
          <span className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface-variant">
            Question
          </span>
          <span className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface-variant tabular-nums">
            03 / 06
          </span>
        </div>
        <div className="px-5 pt-5 pb-4">
          <h3 className="font-body text-[14px] sm:text-[15px] font-semibold text-on-surface leading-snug mb-4">
            Which of the following triggers Spark to actually compute the result?
          </h3>
          <ul className="flex flex-col gap-2">
            {OPTIONS.map((opt, i) => (
              <li
                key={i}
                className="flex items-start gap-3 px-3 py-2.5"
                style={{
                  border: opt.selected
                    ? '1.5px solid rgba(163, 56, 0, 0.55)'
                    : '1px solid rgba(28, 28, 22, 0.15)',
                  backgroundColor: opt.selected ? 'rgba(163, 56, 0, 0.06)' : 'transparent',
                }}
              >
                <span
                  aria-hidden
                  className="w-[18px] h-[18px] shrink-0 mt-0.5 inline-flex items-center justify-center"
                  style={{
                    backgroundColor: opt.selected ? '#a33800' : 'transparent',
                    border: opt.selected ? 'none' : '1.5px solid rgba(28, 28, 22, 0.25)',
                  }}
                >
                  {opt.selected && <Check className="h-3 w-3 text-on-primary" strokeWidth={3} />}
                </span>
                <code
                  className="font-data-mono text-[11px] sm:text-[12px] leading-relaxed"
                  style={{ color: opt.selected ? '#a33800' : '#1c1c16' }}
                >
                  {opt.code}
                </code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* Slide 4 — generation chart mimicking the home dashboard's kWh accrual
   line. Cumulative curve, vermillion stroke, low-alpha fill underneath,
   tick labels along the X axis. Pure SVG so it scales without imagery. */
function GenerationChartHero() {
  const POINTS: Array<[number, number]> = [
    [0, 96],
    [22, 88],
    [40, 76],
    [60, 70],
    [82, 56],
    [105, 48],
    [128, 38],
    [150, 28],
    [175, 18],
    [200, 12],
  ];
  const linePath = POINTS.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const fillPath = `${linePath} L 200 100 L 0 100 Z`;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-grid-pattern p-6 sm:p-10 overflow-hidden">
      <div className="w-full max-w-[600px] bg-surface border border-on-surface p-6 sm:p-8">
        <div className="flex items-center justify-between mb-3 border-b border-surface-dim pb-3">
          <span className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface">
            Generation today
          </span>
          <span className="font-data-mono text-[12px] text-primary tabular-nums">
            +312.5 kWh
          </span>
        </div>
        <div className="relative h-[160px] sm:h-[200px] w-full">
          <svg
            viewBox="0 0 200 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
            aria-hidden
          >
            <line
              x1="0"
              y1="100"
              x2="200"
              y2="100"
              stroke="rgba(28,28,22,0.12)"
              strokeWidth="0.4"
              vectorEffect="non-scaling-stroke"
            />
            <path d={fillPath} fill="rgb(163,56,0)" fillOpacity="0.08" />
            <path
              d={linePath}
              fill="none"
              stroke="rgb(163,56,0)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {POINTS.map(([x, y], i) => (
            <span
              key={i}
              aria-hidden
              className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-primary"
              style={{ left: `${(x / 200) * 100}%`, top: `${y}%` }}
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between font-data-mono text-[10px] tabular-nums text-on-surface-variant">
          <span>06:00</span>
          <span>14:00</span>
          <span>22:00</span>
        </div>
      </div>
    </div>
  );
}
