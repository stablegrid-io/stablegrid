'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, Database, FileText } from 'lucide-react';
import { highlightCode } from '@/lib/codeHighlight';
import type { SamplePracticeQuestion } from '@/lib/landing/samplePracticeQuestion';

const APPLE_FONT =
  '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';
const MONO_FONT =
  '"SF Mono", "JetBrains Mono", Menlo, Monaco, Consolas, monospace';

// Pitch-black palette — Apple TV / Vision Pro vibe. The preview reads as
// a single dark slab floating on the dark landing, defined by a hairline
// border and a soft white halo rather than a bright fill.
const SURFACE = '#000000';
const PANEL = '#08090b';
const PANEL_RAISED = '#0d0e10';
const INK = 'rgba(255,255,255,0.96)';
const INK_MUTED = 'rgba(255,255,255,0.62)';
const INK_FAINT = 'rgba(255,255,255,0.36)';
const HAIRLINE = 'rgba(255,255,255,0.08)';
const HAIRLINE_SOFT = 'rgba(255,255,255,0.04)';

interface Props {
  sample: SamplePracticeQuestion;
}

/**
 * Static high-fidelity render of the in-app practice session. Treated as
 * a product hero shot — bright cream surface, floating on the dark
 * landing with a strong shadow, no interactivity. The user sees exactly
 * what the rep looks like before signing up.
 */
export function PracticeUiPreview({ sample }: Props) {
  const inputSample = sample.evidence.find((e) => e.type === 'text');
  const codeBlocks = sample.evidence.filter((e) => e.type === 'code_block');

  // Pagination dots — simulate position in a multi-question track.
  const TOTAL_DOTS = 18;
  const ACTIVE_INDEX = 0;

  // Scroll-reveal — the slab tilts upright + content fills in cascade
  // when the section first crosses the viewport. Once revealed it stays
  // visible (no re-animate on scroll-out).
  const sectionRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: skip the reveal animation entirely on environments
      // without IntersectionObserver (very old browsers, SSR sanity).
      setRevealed(true);
      return;
    }
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Stagger helper — attaches an inline animation to a child so it fades
  // up + tilts into place after `delay` ms once the section reveals.
  const reveal = (delayMs: number): React.CSSProperties => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'translateY(0)' : 'translateY(10px)',
    transition: `opacity 600ms cubic-bezier(.16,1,.3,1) ${delayMs}ms, transform 700ms cubic-bezier(.16,1,.3,1) ${delayMs}ms`,
  });

  return (
    <section
      ref={sectionRef}
      className="px-6 py-24 lg:py-32 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Eyebrow + heading */}
        <p
          className="text-center font-mono uppercase mb-6"
          style={{
            fontSize: 11,
            letterSpacing: '0.24em',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          Inside the rep
        </p>
        <h2
          className="text-center font-bold tracking-tight"
          style={{
            fontFamily: APPLE_FONT,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            color: 'rgba(255,255,255,0.97)',
            marginBottom: 16,
          }}
        >
          Read. Reason. Submit.
        </h2>
        <p
          className="text-center mx-auto"
          style={{
            fontFamily: APPLE_FONT,
            fontSize: 'clamp(1rem, 1.2vw, 1.125rem)',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.5)',
            maxWidth: 600,
            marginBottom: 64,
          }}
        >
          Every question opens with the concept laid out, the artifact you
          are reading, and a single decision. No scaffolding tricks — the
          rep is what you would do at work, scaled down to one focused
          minute.
        </p>

        {/* 3D stage — perspective parent lets the slab inside tilt
            on the X axis. The tilt eases out as the user scrolls past
            so it ends standing fully upright. */}
        <div
          className="mx-auto"
          style={{
            perspective: '1800px',
            perspectiveOrigin: '50% 0%',
            maxWidth: 1100,
          }}
        >
        {/* Floating product shot — pitch black with a soft white halo +
            a top-edge highlight so it reads as a panel lit from above. */}
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: SURFACE,
            borderRadius: 24,
            border: `1px solid ${HAIRLINE}`,
            // Layered shadow: hairline ring + ambient deep shadow + soft
            // contact shadow + faint top-light halo. Together they make
            // the panel feel like an object floating off the page rather
            // than a flat fill.
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.04), 0 80px 160px rgba(0,0,0,0.7), 0 30px 60px rgba(0,0,0,0.5), 0 0 100px rgba(255,255,255,0.03)',
            // Reveal motion: starts tilted forward (top edge tipped
            // toward viewer) and rotates to upright as the section
            // enters the viewport. Subtle — too much rotation looks
            // gimmicky.
            transform: revealed
              ? 'rotateX(0deg) translateY(0)'
              : 'rotateX(7deg) translateY(20px)',
            transformOrigin: '50% 0%',
            transformStyle: 'preserve-3d',
            opacity: revealed ? 1 : 0,
            transition:
              'transform 1100ms cubic-bezier(.16,1,.3,1), opacity 800ms ease-out',
          }}
        >
          {/* Top-edge light — a narrow white gradient strip that reads
              as light hitting the front face of the slab. Pure cosmetic,
              sells the 3D illusion. */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: 1,
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
              zIndex: 5,
            }}
          />
          {/* Pagination strip — top */}
          <div
            className="flex items-center justify-center gap-1.5 px-6 py-5"
            style={{ borderBottom: `1px solid ${HAIRLINE_SOFT}` }}
          >
            {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
              const isActive = i === ACTIVE_INDEX;
              return (
                <span
                  key={i}
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: isActive
                      ? 'rgba(255,255,255,0.92)'
                      : 'rgba(255,255,255,0.14)',
                    transition: 'background 280ms ease',
                  }}
                />
              );
            })}
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr]" style={{ minHeight: 520 }}>
            {/* ── LEFT — Context + Evidence ───────────────────────── */}
            <div className="px-6 lg:px-8 py-6 lg:py-7" style={{ borderRight: `1px solid ${HAIRLINE_SOFT}` }}>
              {/* Tab bar */}
              <div className="flex items-center gap-1 mb-5">
                <Tab icon={FileText} label="Context" active />
                <Tab icon={Database} label="Dataset" />
              </div>

              {/* Time estimate */}
              <div className="flex items-center gap-1.5 mb-3" style={{ color: INK_FAINT }}>
                <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="font-mono" style={{ fontSize: 11.5 }}>~8 min</span>
              </div>

              {/* Task title */}
              <h3
                className="font-bold tracking-tight"
                style={{
                  fontFamily: APPLE_FONT,
                  fontSize: 22,
                  letterSpacing: '-0.02em',
                  color: INK,
                  marginBottom: 22,
                  ...reveal(120),
                }}
              >
                {sample.title}
              </h3>

              {/* Context */}
              <p
                className="font-mono uppercase mb-2.5"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  color: INK_FAINT,
                  fontWeight: 700,
                }}
              >
                Context
              </p>
              <p
                style={{
                  fontFamily: APPLE_FONT,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: INK_MUTED,
                  marginBottom: 22,
                  ...reveal(220),
                }}
              >
                {sample.context}
              </p>

              {/* Evidence */}
              <p
                className="font-mono uppercase mb-2.5"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  color: INK_FAINT,
                  fontWeight: 700,
                }}
              >
                Evidence
              </p>

              {inputSample && (
                <div
                  className="mb-4"
                  style={{
                    backgroundColor: PANEL,
                    border: `1px solid ${HAIRLINE_SOFT}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                    ...reveal(320),
                  }}
                >
                  {inputSample.title && (
                    <p
                      className="font-mono uppercase"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        color: INK_FAINT,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      {inputSample.title}
                    </p>
                  )}
                  <p
                    style={{
                      // `pre-wrap` so multi-line input samples (newlines in
                      // the source JSON) render as the structured key/value
                      // blocks the in-app practice UI shows, instead of
                      // collapsing into a wall of text.
                      whiteSpace: 'pre-wrap',
                      fontFamily: APPLE_FONT,
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: INK_MUTED,
                    }}
                  >
                    {inputSample.content}
                  </p>
                </div>
              )}

              {codeBlocks.map((cb, blockIdx) => {
                const lang = cb.language ?? 'python';
                const lines = highlightCode(lang, cb.content).split('\n');
                return (
                  <div
                    key={blockIdx}
                    className={`overflow-hidden ${blockIdx > 0 ? 'mt-3' : ''}`}
                    style={{
                      backgroundColor: PANEL_RAISED,
                      borderRadius: 12,
                      border: `1px solid ${HAIRLINE}`,
                      ...reveal(420 + blockIdx * 140),
                    }}
                  >
                    <div
                      className="flex items-center gap-2 px-4 py-2.5"
                      style={{ borderBottom: `1px solid ${HAIRLINE_SOFT}` }}
                    >
                      {/* macOS-style traffic lights — three muted dots,
                          IDE-faithful. */}
                      <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,93,82,0.55)' }} />
                      <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,189,46,0.55)' }} />
                      <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: 'rgba(40,201,64,0.55)' }} />
                      <span
                        className="font-mono ml-2"
                        style={{
                          fontSize: 11,
                          color: INK_FAINT,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {cb.label ?? 'snippet.py'}
                      </span>
                    </div>
                    <pre
                      className="overflow-x-auto"
                      style={{
                        margin: 0,
                        padding: '14px 18px',
                        fontFamily: MONO_FONT,
                        fontSize: 12.5,
                        lineHeight: 1.65,
                        color: 'rgba(255,255,255,0.86)',
                      }}
                    >
                      <code style={{ display: 'block' }}>
                        {lines.map((html, i) => (
                          <span key={i} style={{ display: 'block' }}>
                            <span
                              aria-hidden
                              style={{
                                display: 'inline-block',
                                width: 22,
                                color: 'rgba(255,255,255,0.22)',
                                userSelect: 'none',
                                textAlign: 'right',
                                marginRight: 14,
                              }}
                            >
                              {i + 1}
                          </span>
                            <span dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />
                          </span>
                        ))}
                      </code>
                    </pre>
                  </div>
                );
              })}
            </div>

            {/* ── RIGHT — Question panel ──────────────────────────── */}
            <div
              className="flex flex-col px-6 lg:px-8 py-6 lg:py-7"
              style={{ backgroundColor: PANEL }}
            >
              <p
                className="font-mono uppercase mb-4"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  color: INK_FAINT,
                  fontWeight: 700,
                }}
              >
                Question
              </p>

              <p
                style={{
                  fontFamily: APPLE_FONT,
                  fontSize: 16,
                  lineHeight: 1.45,
                  color: INK,
                  fontWeight: 600,
                  letterSpacing: '-0.005em',
                  marginBottom: 18,
                  ...reveal(220),
                }}
              >
                {sample.prompt}
              </p>

              <ol className="flex flex-col gap-2.5">
                {sample.options.map((opt, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3"
                    style={{
                      backgroundColor: PANEL_RAISED,
                      border: `1px solid ${HAIRLINE}`,
                      borderRadius: 12,
                      padding: '12px 14px',
                      ...reveal(380 + i * 80),
                    }}
                  >
                    {/* Empty radio circle — unselected resting state */}
                    <span
                      aria-hidden
                      style={{
                        flexShrink: 0,
                        width: 16,
                        height: 16,
                        borderRadius: 999,
                        border: '1.5px solid rgba(255,255,255,0.22)',
                        marginTop: 2,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: APPLE_FONT,
                        fontSize: 13,
                        lineHeight: 1.55,
                        color: INK_MUTED,
                        flex: 1,
                      }}
                    >
                      {opt}
                    </span>
                  </li>
                ))}
              </ol>

              {/* Check Answer — disabled resting state */}
              <div className="mt-auto pt-5" style={reveal(740)}>
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex items-center justify-center"
                  style={{
                    padding: '12px 18px',
                    borderRadius: 12,
                    backgroundColor: PANEL_RAISED,
                    border: `1px solid ${HAIRLINE}`,
                    color: 'rgba(255,255,255,0.30)',
                    fontFamily: APPLE_FONT,
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: '-0.005em',
                    cursor: 'default',
                  }}
                >
                  Check Answer
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Subtle caption under the shot — Apple style. Tier label is
            derived from `sample.trackLevel` so the caption stays correct
            if the pinned task changes tier later. */}
        <p
          className="text-center mt-10 font-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.32)',
            textTransform: 'uppercase',
          }}
        >
          Live preview ·{' '}
          {sample.trackLevel.charAt(0).toUpperCase() + sample.trackLevel.slice(1)}{' '}
          {sample.topic.charAt(0).toUpperCase() + sample.topic.slice(1)} ·{' '}
          {sample.setTitle.replace(/^Practice Set /, '')}
        </p>
      </div>
    </section>
  );
}

/* ── Tab pill helper ──────────────────────────────────────────────────── */

function Tab({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof FileText;
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        padding: '6px 12px',
        borderRadius: 10,
        backgroundColor: active ? PANEL_RAISED : 'transparent',
        border: active ? `1px solid ${HAIRLINE}` : '1px solid transparent',
        color: active ? INK : INK_FAINT,
      }}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      <span
        style={{
          fontFamily: APPLE_FONT,
          fontSize: 12.5,
          fontWeight: active ? 600 : 500,
          letterSpacing: '-0.005em',
        }}
      >
        {label}
      </span>
    </span>
  );
}
