import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { highlightCode } from '@/lib/codeHighlight';
import type { SamplePracticeQuestion } from '@/lib/landing/samplePracticeQuestion';

const APPLE_FONT =
  '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';
const MONO_FONT =
  '"SF Mono", "JetBrains Mono", Menlo, Monaco, Consolas, monospace';

interface Props {
  sample: SamplePracticeQuestion;
}

/**
 * Renders a real practice MCQ on the Coding landing page — the practice-side
 * counterpart to `SampleLessonSection` on /topics/[slug]. Server component:
 * pulls the sample from a static JSON import via getSamplePracticeQuestion,
 * highlights the code block server-side, ships zero JS for this slot.
 */
export function SamplePracticeQuestionSection({ sample }: Props) {
  const correctIdx = sample.options.indexOf(sample.correctAnswer);
  const tierLabel =
    sample.trackLevel.charAt(0).toUpperCase() + sample.trackLevel.slice(1);
  const topicLabel =
    sample.topic.charAt(0).toUpperCase() + sample.topic.slice(1);

  return (
    <section
      className="px-6 py-24 lg:py-32 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div className="max-w-5xl mx-auto">
        <p
          className="font-mono uppercase mb-4"
          style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'rgba(153,247,255,0.85)',
          }}
        >
          A Question Inside
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
          {sample.title}
        </h2>
        <p
          style={{
            fontFamily: APPLE_FONT,
            fontSize: 'clamp(1rem, 1.2vw, 1.125rem)',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.62)',
            marginBottom: 28,
            maxWidth: 720,
          }}
        >
          From{' '}
          <span style={{ color: 'rgba(255,255,255,0.85)' }}>
            {sample.setTitle}
          </span>{' '}
          — {tierLabel} {topicLabel}.
        </p>

        <p
          className="mb-7"
          style={{
            fontFamily: APPLE_FONT,
            fontSize: 14.5,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.72)',
            maxWidth: 760,
          }}
        >
          {sample.context}
        </p>

        {sample.evidence.length > 0 && (
          <div className="mb-7 space-y-4">
            {sample.evidence.map((item, idx) => {
              if (item.type === 'text') {
                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      padding: '14px 18px',
                    }}
                  >
                    {item.title && (
                      <p
                        className="font-mono uppercase mb-2"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.18em',
                          color: 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {item.title}
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: APPLE_FONT,
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        color: 'rgba(255,255,255,0.78)',
                      }}
                    >
                      {item.content}
                    </p>
                  </div>
                );
              }
              const lang = item.language ?? 'text';
              const lines = highlightCode(lang, item.content).split('\n');
              return (
                <div
                  key={idx}
                  className="overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: 10.5,
                        letterSpacing: '0.05em',
                        color: 'rgb(153,247,255)',
                        backgroundColor: 'rgba(153,247,255,0.08)',
                        border: '1px solid rgba(153,247,255,0.18)',
                        padding: '3px 9px',
                        borderRadius: 6,
                        textTransform: 'lowercase',
                      }}
                    >
                      {lang}
                    </span>
                    {item.label && (
                      <span
                        className="hidden sm:inline"
                        style={{
                          fontFamily: MONO_FONT,
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.45)',
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>
                  <pre
                    className="overflow-x-auto"
                    style={{
                      margin: 0,
                      padding: '16px 18px',
                      fontFamily: MONO_FONT,
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: 'rgba(255,255,255,0.86)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <code style={{ display: 'block' }}>
                      {lines.map((html, i) => (
                        <span key={i} style={{ display: 'block' }}>
                          <span
                            aria-hidden
                            style={{
                              display: 'inline-block',
                              width: 24,
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
        )}

        <div className="mb-2">
          <p
            style={{
              fontFamily: APPLE_FONT,
              fontSize: 15,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.95)',
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {sample.prompt}
          </p>
          <ol className="flex flex-col gap-2.5">
            {sample.options.map((opt, i) => {
              const isCorrect = i === correctIdx;
              const letter = String.fromCharCode(65 + i);
              return (
                <li
                  key={i}
                  className="flex items-start gap-3"
                  style={{
                    backgroundColor: isCorrect
                      ? 'rgba(52,211,153,0.06)'
                      : 'rgba(255,255,255,0.02)',
                    border: isCorrect
                      ? '1px solid rgba(52,211,153,0.45)'
                      : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: isCorrect
                        ? 'rgba(52,211,153,0.18)'
                        : 'rgba(255,255,255,0.06)',
                      color: isCorrect ? '#34d399' : 'rgba(255,255,255,0.55)',
                      marginTop: 1,
                    }}
                  >
                    {letter}
                  </span>
                  <span
                    style={{
                      fontFamily: APPLE_FONT,
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: isCorrect
                        ? 'rgba(255,255,255,0.95)'
                        : 'rgba(255,255,255,0.72)',
                      flex: 1,
                    }}
                  >
                    {opt}
                  </span>
                  {isCorrect && (
                    <Check
                      aria-hidden
                      className="h-4 w-4 shrink-0 mt-1"
                      style={{ color: '#34d399' }}
                      strokeWidth={3}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {sample.rationale && (
          <div
            className="mt-6"
            style={{
              backgroundColor: 'rgba(52,211,153,0.04)',
              border: '1px solid rgba(52,211,153,0.18)',
              borderRadius: 12,
              padding: '14px 18px',
            }}
          >
            <p
              className="font-mono uppercase mb-2"
              style={{
                fontSize: 10,
                letterSpacing: '0.22em',
                color: 'rgba(52,211,153,0.85)',
                fontWeight: 700,
              }}
            >
              The right call
            </p>
            <p
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 13.5,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.78)',
              }}
            >
              {sample.rationale}
            </p>
          </div>
        )}

        <div className="mt-8">
          <Link
            href={sample.href}
            prefetch={false}
            className="inline-flex items-center gap-2"
            style={{
              padding: '12px 20px',
              borderRadius: 14,
              backgroundColor: '#f0f0f3',
              color: '#0a0c0e',
              fontFamily: APPLE_FONT,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '-0.005em',
              boxShadow: '0 0 12px rgba(240,240,243,0.1)',
            }}
          >
            Try this track
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
