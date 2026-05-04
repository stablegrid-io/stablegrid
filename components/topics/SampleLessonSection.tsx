import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { SampleLesson } from '@/lib/landing/sampleLesson';
import { highlightCode } from '@/lib/codeHighlight';

const APPLE_FONT =
  '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';
const MONO_FONT =
  '"SF Mono", "JetBrains Mono", Menlo, Monaco, Consolas, monospace';

interface SampleLessonSectionProps {
  topicName: string;
  catRgb: string;
  sample: SampleLesson;
}

export function SampleLessonSection({
  topicName,
  catRgb,
  sample,
}: SampleLessonSectionProps) {
  const codeLines = sample.code.split('\n');
  const highlightedLines = highlightCode(sample.language, sample.code).split('\n');

  return (
    <section
      className="px-6 py-24 lg:py-32 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10 lg:gap-14">
          {/* ── Left: heading + code block ───────────────────────────── */}
          <div>
            <p
              className="font-mono uppercase mb-6"
              style={{
                fontSize: 11,
                letterSpacing: '0.22em',
                color: `rgba(${catRgb},0.85)`,
              }}
            >
              A Lesson Inside
            </p>
            <h2
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                fontWeight: 600,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                color: 'rgba(255,255,255,0.97)',
                marginBottom: 14,
              }}
            >
              {sample.sectionTitle}
            </h2>
            <p
              style={{
                fontFamily: APPLE_FONT,
                fontSize: 'clamp(1rem, 1.2vw, 1.125rem)',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.62)',
                marginBottom: 28,
                maxWidth: 640,
              }}
            >
              From{' '}
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                {sample.chapterTitle}
              </span>{' '}
              — chapter {sample.chapterNumber} of {sample.totalChapters} in the {topicName} junior track.
            </p>

            {/* Code card */}
            <div
              className="overflow-hidden"
              style={{
                backgroundColor: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
              }}
            >
              {/* Tab strip */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block px-2.5 py-1"
                    style={{
                      fontFamily: MONO_FONT,
                      fontSize: 10.5,
                      letterSpacing: '0.05em',
                      color: `rgb(${catRgb})`,
                      backgroundColor: `rgba(${catRgb},0.08)`,
                      border: `1px solid rgba(${catRgb},0.18)`,
                      borderRadius: 6,
                      textTransform: 'lowercase',
                    }}
                  >
                    {sample.language}
                  </span>
                  <span
                    className="hidden sm:inline"
                    style={{
                      fontFamily: MONO_FONT,
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {sample.sectionId.replace(/^module-/, '').replace(/-/g, ' · ')}
                  </span>
                </div>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    color: 'rgba(255,255,255,0.32)',
                    textTransform: 'uppercase',
                  }}
                >
                  {codeLines.length} lines
                </span>
              </div>

              {/* Code body with line numbers (server-side highlighted) */}
              <pre
                className="overflow-x-auto"
                style={{
                  margin: 0,
                  padding: '20px 22px',
                  fontFamily: MONO_FONT,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'rgba(255,255,255,0.86)',
                  backgroundColor: 'transparent',
                }}
              >
                <code style={{ display: 'block' }}>
                  {highlightedLines.map((html, i) => (
                    <span key={i} style={{ display: 'block' }}>
                      <span
                        aria-hidden
                        style={{
                          display: 'inline-block',
                          width: 28,
                          color: 'rgba(255,255,255,0.22)',
                          userSelect: 'none',
                          textAlign: 'right',
                          marginRight: 16,
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

            {/* CTA link */}
            <div className="mt-7">
              <Link
                href={sample.href}
                prefetch={false}
                className="topic-hero-link inline-flex items-center gap-1.5 text-[15px] font-medium"
                style={{
                  color: `rgba(${catRgb},0.95)`,
                  opacity: 0.92,
                }}
              >
                <span>Read this lesson</span>
                <ArrowRight
                  className="topic-hero-link__arrow h-4 w-4"
                  strokeWidth={2.2}
                />
              </Link>
            </div>
          </div>

          {/* ── Right: sibling-lesson list ──────────────────────────── */}
          <aside aria-label="Lessons in this chapter">
            <p
              className="font-mono uppercase mb-5"
              style={{
                fontSize: 10,
                letterSpacing: '0.22em',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Lessons in this chapter
            </p>
            <ol className="flex flex-col gap-1.5">
              {sample.chapterSections.map((s, i) => {
                const isCurrent = s.id === sample.sectionId;
                return (
                  <li
                    key={s.id}
                    className="flex items-baseline gap-3 py-1.5"
                    style={{
                      borderTop:
                        i === 0
                          ? 'none'
                          : '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span
                      className="font-mono tabular-nums"
                      style={{
                        fontSize: 11,
                        color: isCurrent
                          ? `rgb(${catRgb})`
                          : 'rgba(255,255,255,0.35)',
                        minWidth: 18,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        fontFamily: APPLE_FONT,
                        fontSize: 13.5,
                        lineHeight: 1.45,
                        color: isCurrent
                          ? 'rgba(255,255,255,0.97)'
                          : 'rgba(255,255,255,0.6)',
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      {s.title}
                    </span>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      </div>
    </section>
  );
}
