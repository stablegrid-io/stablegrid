import Link from 'next/link';
import { ArrowDown, ArrowRight, Check, Minus, Instagram, Facebook } from 'lucide-react';
import { BrandCell } from '@/components/brand/BrandCell';
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks, type TheoryTrackSummary } from '@/data/learn/theory/tracks';
import { getSampleLesson } from '@/lib/landing/sampleLesson';
import { highlightCode } from '@/lib/codeHighlight';
import { CookiePreferencesButton } from '@/components/home/landing/CookiePreferencesButton';
import { LandingMasthead } from '@/components/home/landing/LandingMasthead';
import { Lesson3DCard } from '@/components/home/landing/Lesson3DCard';
import { ScadaMimicBackground } from '@/components/home/landing/ScadaMimicBackground';
import { PracticeTaskCard } from '@/components/home/landing/PracticeTaskCard';
import { GridComponentGallery } from '@/components/home/landing/GridComponentGallery';
import { SAMPLE_TASK, GRID_COMPONENTS } from '@/components/home/landing/landingSamples';

// Editorial syntax palette — tuned for DARK editorial canvas (#14140f).
// Cream ink for function spines, Spark orange for keywords/numbers, dimmed
// patina-green for strings, muted taupe for comments.
const EDITORIAL_CODE_VARS = {
  '--rm-code-keyword': '#ffb59a', // light salmon — keywords, types
  '--rm-code-string': '#9ab89a',  // dimmed sage — string literals
  '--rm-code-number': '#e25a1c',  // Spark — numeric literals
  '--rm-code-comment': '#a8a59f', // warm taupe — comments still legible on dark
  '--rm-code-function': '#e6e2d9' // cream ink — function calls (spine of snippet)
} as React.CSSProperties;

// ─── Static section data ─────────────────────────────────────────────────────

const FOR_WHOM = [
  'Engineers shipping pipelines who want depth, not another intro.',
  'Analysts moving from pandas/SQL who need PySpark idioms that scale.',
  'Senior data folks brushing up before interviews or platform reviews.',
  'Self-directed readers who prefer typography over talking heads.'
] as const;

const NOT_FOR_WHOM = [
  'Absolute programming beginners — assumes Python comfort and basic SQL.',
  'People who want video tutorials with autoplay and sticky chapter timers.',
  'Anyone shopping for a credential. There is no certificate.',
  'Tool-of-the-month tourists. This is PySpark, deeply, and nothing else.'
] as const;

// ─── Subcomponents ───────────────────────────────────────────────────────────

const SectionLabel = ({ index, title }: { index: string; title: string }) => (
  <div className="flex items-baseline gap-4 mb-12">
    <span className="font-data-mono uppercase text-[12px] tracking-wider text-on-surface-variant tabular-nums">
      § {index}
    </span>
    <span className="font-data-mono uppercase text-[12px] tracking-wider text-on-surface">
      {title}
    </span>
    <span className="flex-1 h-px bg-surface-dim" />
  </div>
);

const CurriculumColumn = ({
  index,
  track
}: {
  index: string;
  track: TheoryTrackSummary;
}) => {
  const titleParts = track.label.split(/[—·]/);
  const tier = (titleParts[0] ?? track.label).trim();
  const subtitle = (titleParts[1] ?? track.eyebrow).trim();
  return (
    <div className="border-t border-on-surface pt-6">
      <div className="mb-6">
        <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-1">
          {index} · {tier}
        </span>
        <h3 className="font-serif text-[22px] text-on-surface leading-snug">
          {subtitle || tier}
        </h3>
      </div>
      <ol className="flex flex-col">
        {track.chapters.map((chapter, i) => {
          const cleanTitle = chapter.title.replace(/^module\s*\d+\s*[:.]?\s*/i, '');
          const description = (chapter.description ?? '').trim();
          return (
            <li key={chapter.id} className="border-b border-surface-dim">
              <details className="group">
                <summary className="list-none cursor-pointer py-3 flex items-baseline gap-3 hover:text-primary transition-colors [&::-webkit-details-marker]:hidden">
                  <span className="font-data-mono tabular-nums text-[12px] text-on-surface-variant w-6 shrink-0">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="font-serif text-[15px] leading-snug flex-1">
                    {cleanTitle}
                  </span>
                  <span
                    aria-hidden
                    className="font-data-mono text-[14px] text-on-surface-variant shrink-0 transition-transform duration-200 group-open:rotate-45 leading-none translate-y-[1px]"
                  >
                    +
                  </span>
                </summary>
                {description ? (
                  <p className="font-body text-[14px] leading-relaxed text-on-surface-variant pl-9 pr-2 pb-4 max-w-[60ch]">
                    {description}
                  </p>
                ) : null}
              </details>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

export const LandingPage = () => {
  const doc = theoryDocs['pyspark'];
  const tracks = doc ? getTheoryTracks(doc) : [];
  const sampleLesson = getSampleLesson('pyspark');

  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <main className="bg-surface min-h-screen text-on-surface">
      <LandingMasthead issueDate={issueDate} />

      {/* ── Cover (first viewport) ─────────────────────────────────────── */}
      <style>{`
        @keyframes hero-mark-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .hero-mark-spin {
          animation: hero-mark-spin 30s linear infinite;
          transform-origin: 50% 50%;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-mark-spin { animation: none; }
        }
      `}</style>
      <section
        aria-labelledby="hero-title"
        className="relative overflow-hidden min-h-[100dvh] flex flex-col items-center justify-center text-center px-6 py-20"
      >
        <ScadaMimicBackground />
        <div className="relative z-10 flex flex-col items-center">
        <h1
          id="hero-title"
          className="font-serif lowercase text-[56px] sm:text-[80px] lg:text-[104px] leading-[0.95] tracking-tight text-on-surface mb-10 flex items-center justify-center gap-4 sm:gap-6 flex-wrap"
        >
          {/* Brand cell — replaces the all-ink StableGridMark on the hero
              with the vermillion-accented variant the rest of the editorial
              system uses (NextUp card on /home, etc.). The keyframe spin
              still applies; the BrandCell's `marker="self"` is the same
              mid-left vermillion you see elsewhere. */}
          <BrandCell
            marker="self"
            className="hero-mark-spin shrink-0"
            style={{ width: '0.85em', height: '0.85em' }}
          />
          <span>
            stable<span className="text-primary">grid</span>
            <span className="text-on-surface-variant">.io</span>
          </span>
        </h1>

        <p className="font-serif text-[20px] sm:text-[26px] leading-relaxed text-on-surface max-w-[48ch] mb-12">
          Handle big data with ease — learn{' '}
          <span className="text-primary">PySpark</span>.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-on-primary border border-primary hover:bg-primary-dim hover:border-primary-dim transition-colors font-data-mono uppercase text-[12px] tracking-wider"
          >
            Start free <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <a
            href="#what-it-is"
            className="inline-flex items-center gap-2 px-6 py-3.5 border border-on-surface text-on-surface hover:bg-surface-container-low transition-colors font-data-mono uppercase text-[12px] tracking-wider"
          >
            Explore <ArrowDown className="h-4 w-4" strokeWidth={1.75} />
          </a>
        </div>
        </div>
      </section>

      {/* ── 03 · Sample lesson + Curriculum ────────────────────────────── */}
      {sampleLesson ? (
        <section
          aria-labelledby="sample-title"
          className="border-b border-on-surface"
        >
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20">
            <SectionLabel index="02" title="The curriculum" />
            <h2
              id="sample-title"
              className="font-serif text-[36px] sm:text-[48px] leading-tight text-on-surface mb-12 max-w-[22ch]"
            >
              One lesson, then thirty more.
            </h2>

            <Lesson3DCard>
              <article className="border border-on-surface bg-surface-container-high/40">
                <header className="px-6 sm:px-10 py-6 border-b border-surface-dim">
                  <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-2">
                    Module {sampleLesson.chapterNumber} of {sampleLesson.totalChapters} ·{' '}
                    {sampleLesson.chapterTitle.replace(/^module\s*\d+\s*[:.]?\s*/i, '')}
                  </span>
                  <h3 className="font-serif text-[26px] sm:text-[32px] text-on-surface leading-snug">
                    {sampleLesson.sectionTitle}
                  </h3>
                </header>
                <div className="px-6 sm:px-10 py-8 overflow-x-auto bg-surface-container-lowest">
                  <pre
                    className="font-data-mono text-[14px] leading-[1.75] text-on-surface whitespace-pre overflow-x-auto"
                    style={EDITORIAL_CODE_VARS}
                    dangerouslySetInnerHTML={{
                      __html: `<code>${highlightCode(
                        sampleLesson.language || 'python',
                        sampleLesson.code
                      )}</code>`
                    }}
                  />
                </div>
                <footer className="px-6 sm:px-10 py-5 border-t border-surface-dim flex flex-wrap items-center justify-between gap-4">
                  <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
                    Lesson {sampleLesson.chapterSections.findIndex((s) => s.id === sampleLesson.sectionId) + 1} of{' '}
                    {sampleLesson.chapterSections.length} in this module
                  </span>
                  <Link
                    href={sampleLesson.href}
                    className="inline-flex items-center gap-2 font-data-mono uppercase text-[11px] tracking-wider text-on-surface hover:text-primary transition-colors border-b border-on-surface hover:border-primary pb-1"
                  >
                    Open the lesson <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Link>
                </footer>
              </article>
            </Lesson3DCard>

            {/* Curriculum browse — Junior / Mid / Senior columns, the full
                table of contents folded into the same section so the visitor
                sees one excerpt + the whole map without a separate scroll. */}
            {tracks.length > 0 ? (
              <div className="mt-20 pt-16 border-t border-outline-variant">
                <div className="flex items-baseline justify-between flex-wrap gap-3 mb-12">
                  <h3 className="font-serif text-[28px] sm:text-[34px] leading-tight text-on-surface max-w-[28ch]">
                    Thirty modules. Junior to Senior.
                  </h3>
                  <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
                    300 LESSONS · WRITTEN IN FULL
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                  {tracks.slice(0, 3).map((track, i) => (
                    <CurriculumColumn
                      key={track.slug}
                      index={(i + 1).toString().padStart(2, '0')}
                      track={track}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── 04 · Practice task ─────────────────────────────────────────── */}
      <section
        aria-labelledby="task-title"
        className="border-b border-on-surface"
      >
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20">
          <SectionLabel index="03" title="The practice" />
          <h2
            id="task-title"
            className="font-serif text-[36px] sm:text-[48px] leading-tight text-on-surface mb-12 max-w-[24ch]"
          >
            One task, mid-tier. Thirty more behind it.
          </h2>

          <PracticeTaskCard
            setTitle={SAMPLE_TASK.setTitle}
            tier={SAMPLE_TASK.tier}
            taskNumber={SAMPLE_TASK.taskNumber}
            title={SAMPLE_TASK.title}
            context={SAMPLE_TASK.context}
            task={SAMPLE_TASK.task}
            question={SAMPLE_TASK.question}
            options={SAMPLE_TASK.options.map((o) => ({ ...o }))}
            explanation={SAMPLE_TASK.explanation}
          />
        </div>
      </section>

      {/* ── 05 · Grid game asset gallery ───────────────────────────────── */}
      <section
        aria-labelledby="grid-game-title"
        className="border-b border-on-surface"
      >
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20">
          <SectionLabel index="04" title="The grid game" />
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-10 gap-y-4 items-start mb-12">
            <div>
              <h2
                id="grid-game-title"
                className="font-serif text-[36px] sm:text-[48px] leading-tight text-on-surface mb-4 max-w-[22ch]"
              >
                Earn kWh from study. Deploy it on the grid.
              </h2>
              <p className="font-body text-[16px] leading-relaxed text-on-surface-variant max-w-[60ch]">
                Sessions and drills earn kWh. Spend them deploying these ten
                components across the country until the grid is back online.
              </p>
            </div>
            <span className="font-data-mono uppercase text-[11px] tracking-wider text-primary self-start whitespace-nowrap">
              10 COMPONENTS · 6 CATEGORIES
            </span>
          </div>

          <GridComponentGallery components={GRID_COMPONENTS} />
        </div>
      </section>

      {/* ── 05 · For / Not for ─────────────────────────────────────────── */}
      <section aria-labelledby="audience-title" className="border-b border-on-surface">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20">
          <SectionLabel index="05" title="Self-selection" />
          <h2
            id="audience-title"
            className="font-serif text-[36px] sm:text-[48px] leading-tight text-on-surface mb-16 max-w-[24ch]"
          >
            Honest about who this is for.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <span className="font-data-mono uppercase text-[12px] tracking-wider text-on-surface block mb-6 pb-3 border-b border-on-surface">
                For
              </span>
              <ul className="flex flex-col">
                {FOR_WHOM.map((line) => (
                  <li
                    key={line}
                    className="border-b border-surface-dim py-4 flex items-baseline gap-3"
                  >
                    <Check
                      className="h-3.5 w-3.5 text-primary mt-1 shrink-0"
                      strokeWidth={2.25}
                    />
                    <span className="font-serif text-[17px] leading-snug text-on-surface">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-data-mono uppercase text-[12px] tracking-wider text-on-surface-variant block mb-6 pb-3 border-b border-surface-dim">
                Not for
              </span>
              <ul className="flex flex-col">
                {NOT_FOR_WHOM.map((line) => (
                  <li
                    key={line}
                    className="border-b border-surface-dim py-4 flex items-baseline gap-3"
                  >
                    <Minus
                      className="h-3.5 w-3.5 text-on-surface-variant mt-1 shrink-0"
                      strokeWidth={1.75}
                    />
                    <span className="font-serif text-[17px] leading-snug text-on-surface-variant">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 06 · Pricing ───────────────────────────────────────────────── */}
      <section
        aria-labelledby="pricing-title"
        className="relative overflow-hidden border-b border-on-surface"
      >
        <ScadaMimicBackground />
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-12 py-24">
          <SectionLabel index="06" title="Subscription" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-end">
            <div>
              <h2
                id="pricing-title"
                className="font-serif text-[44px] sm:text-[64px] leading-[1.05] text-on-surface mb-6 max-w-[22ch]"
              >
                <span className="text-primary">Free</span> during beta. €14.99
                once if you want to back it.
              </h2>
              <p className="font-body text-[17px] leading-relaxed text-on-surface-variant max-w-[60ch]">
                Everyone gets the whole platform during beta. Supporters chip in
                once so we can keep shipping — €14.99 lifetime, no subscription,
                no renewals, no upsells. There is no second plan. There is no
                annual option. There is no decoy column.
              </p>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 font-data-mono uppercase text-[12px] tracking-wider text-on-primary px-7 py-4 border border-primary bg-primary hover:bg-primary-dim hover:border-primary-dim transition-colors"
              >
                Start free <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
              <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
                No credit card during beta
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Colophon ───────────────────────────────────────────────────── */}
      <footer
        role="contentinfo"
        aria-label="Site footer"
        className="bg-white text-ink-light"
      >
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-12">
            <div className="flex items-center gap-3 text-ink-light">
              <BrandCell size={20} mono />
              <span className="font-serif text-[20px] lowercase tracking-tight text-ink-light">
                stable<span className="text-vermillion">grid</span>
                <span className="text-ink-light/60">.io</span>
              </span>
            </div>
            <nav aria-label="Footer">
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <li>
                  <Link
                    href="/login"
                    className="font-data-mono uppercase text-[11px] tracking-wider text-ink-light hover:text-vermillion transition-colors"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="font-data-mono uppercase text-[11px] tracking-wider text-ink-light/70 hover:text-ink-light transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="font-data-mono uppercase text-[11px] tracking-wider text-ink-light/70 hover:text-ink-light transition-colors"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="font-data-mono uppercase text-[11px] tracking-wider text-ink-light/70 hover:text-ink-light transition-colors"
                  >
                    Support
                  </Link>
                </li>
                <li>
                  <CookiePreferencesButton tone="light" />
                </li>
                <li className="flex items-center gap-3 pl-2 border-l border-ink-light/20 ml-2">
                  <a
                    href="https://www.instagram.com/stablegrid.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="stablegrid.io on Instagram"
                    className="text-ink-light/70 hover:text-vermillion transition-colors"
                  >
                    <Instagram className="h-4 w-4" strokeWidth={1.75} />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61589515568612"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="stablegrid.io on Facebook"
                    className="text-ink-light/70 hover:text-vermillion transition-colors"
                  >
                    <Facebook className="h-4 w-4" strokeWidth={1.75} />
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          <div className="border-t border-ink-light/15 pt-6 flex flex-wrap justify-between gap-4 font-data-mono uppercase text-[10px] tracking-wider text-ink-light/70">
            <span>© 2026 stablegrid.io</span>
            <span>Beta · Vilnius</span>
          </div>
        </div>
      </footer>
    </main>
  );
};
