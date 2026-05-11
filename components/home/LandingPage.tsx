import Link from 'next/link';
import { ArrowDown, ArrowRight, Check, Minus } from 'lucide-react';
import { BrandCell } from '@/components/brand/BrandCell';
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks, type TheoryTrackSummary } from '@/data/learn/theory/tracks';
import { getSampleLesson } from '@/lib/landing/sampleLesson';
import { highlightCode } from '@/lib/codeHighlight';
import { CookiePreferencesButton } from '@/components/home/landing/CookiePreferencesButton';
import { LandingMasthead } from '@/components/home/landing/LandingMasthead';
import { Lesson3DCard } from '@/components/home/landing/Lesson3DCard';

// Editorial syntax palette — restrained, ink-toned. Source Serif body next to
// JetBrains Mono code shouldn't read like a dark IDE bolted to a printed page.
const EDITORIAL_CODE_VARS = {
  '--rm-code-keyword': '#a33800', // primary (rust) — keywords, types
  '--rm-code-string': '#3d6b3a', // muted forest green — string literals (distinct from function calls)
  '--rm-code-number': '#a33800', // primary — numeric literals
  '--rm-code-comment': '#7a655a', // warm taupe (darker than outline) — comments still legible
  '--rm-code-function': '#1c1c16' // ink — function calls (read as the spine of the snippet)
} as React.CSSProperties;

// ─── Static section data ─────────────────────────────────────────────────────

const WHAT_IT_IS = [
  {
    eyebrow: 'Curriculum',
    title: 'Thirty modules. Junior to Senior.',
    body: 'Three tiers — Junior, Mid, Senior. Plans, partitioning, joins, Delta, streaming. Read top-to-bottom or skip in.',
    meta: '30 modules · 300 lessons'
  },
  {
    eyebrow: 'Practice',
    title: 'Four loops, server-graded.',
    body: 'Module drills paired 1:1 with theory. Fundamentals for recognition. Spark UI speed reading for triage. Function atlas for the pyspark.sql.functions you keep googling.',
    meta: '30 sets · server-graded'
  },
  {
    eyebrow: 'Grid game',
    title: 'Earn kWh from study. Restore Saulėgrid.',
    body: 'Sessions and drills earn kWh. Spend them deploying substations, batteries, switchgear across ten districts. Bring the grid back online.',
    meta: '10 components to deploy'
  }
] as const;

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

interface ComparisonRow {
  feature: string;
  cells: ['us' | 'yes' | 'partial' | 'no', 'yes' | 'partial' | 'no', 'yes' | 'partial' | 'no', 'yes' | 'partial' | 'no'];
}

const COMPARISON_HEADERS = ['stablegrid.io', 'DataCamp', 'Coursera', 'Udemy'] as const;

const COMPARISON: ComparisonRow[] = [
  { feature: 'PySpark depth (joins, AQE, partitioning, Delta, streaming)', cells: ['us', 'partial', 'partial', 'partial'] },
  { feature: 'Theory paired one-to-one with practice', cells: ['us', 'partial', 'no', 'no'] },
  { feature: 'Server-graded code answers, not multiple choice', cells: ['us', 'yes', 'no', 'no'] },
  { feature: 'No autoplay video, no presenter ego', cells: ['us', 'partial', 'no', 'no'] },
  { feature: 'Editorial typography, written like a journal', cells: ['us', 'no', 'no', 'no'] },
  { feature: 'Lifetime access, no subscription', cells: ['us', 'no', 'no', 'partial'] }
];

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

const ComparisonCell = ({ kind }: { kind: ComparisonRow['cells'][number] }) => {
  if (kind === 'us') {
    return (
      <span aria-label="Yes" className="inline-flex items-center justify-center">
        <Check className="h-4 w-4 text-primary" strokeWidth={2.25} />
      </span>
    );
  }
  if (kind === 'yes') {
    return (
      <span aria-label="Yes" className="inline-flex items-center justify-center">
        <Check className="h-4 w-4 text-on-surface" strokeWidth={1.75} />
      </span>
    );
  }
  if (kind === 'partial') {
    return (
      <span aria-label="Partial" className="inline-flex items-center justify-center">
        <Minus className="h-4 w-4 text-on-surface-variant" strokeWidth={1.75} />
      </span>
    );
  }
  return (
    <span
      aria-label="No"
      className="font-data-mono text-[14px] text-on-surface-variant/50"
    >
      ·
    </span>
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
        className="bg-grid-pattern min-h-[100dvh] flex flex-col items-center justify-center text-center px-6 py-20"
      >
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

        <p className="font-serif text-[20px] sm:text-[26px] leading-relaxed text-on-surface-variant max-w-[48ch] mb-12">
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
      </section>

      {/* ── 02 · Why PySpark ───────────────────────────────────────────── */}
      <section
        aria-labelledby="why-title"
        className="border-b border-on-surface scroll-mt-20"
      >
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20">
          <SectionLabel index="02" title="Why PySpark" />
          <h2
            id="why-title"
            className="font-serif text-[36px] sm:text-[48px] leading-tight text-on-surface mb-12 max-w-[22ch]"
          >
            The data outgrew your laptop. Now what.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10 border-t border-surface-dim pt-10">
            <article>
              <p className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant mb-3">
                Necessity
              </p>
              <h3 className="font-serif text-[22px] lg:text-[24px] leading-snug text-on-surface mb-4">
                Pandas stops scaling. SQL stops being expressive.
              </h3>
              <p className="font-body text-[15px] leading-relaxed text-on-surface-variant">
                The moment your data outgrows one machine — or your team needs
                reliability under load — every serious shop reaches for the
                same tool. PySpark is what Databricks, Microsoft Fabric, AWS
                EMR, and every utility&rsquo;s daily pipeline runs. The lingua franca
                of distributed data.
              </p>
            </article>
            <article>
              <p className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant mb-3">
                Why it matters
              </p>
              <h3 className="font-serif text-[22px] lg:text-[24px] leading-snug text-on-surface mb-4">
                The career ceiling between query and ship.
              </h3>
              <p className="font-body text-[15px] leading-relaxed text-on-surface-variant">
                The gap between an analyst who can run a query and an engineer
                who can ship a production pipeline is mostly this skill. Salary
                ceiling, role ceiling, what teams trust you with after the
                first interview. The asymmetry compounds across a decade.
              </p>
            </article>
            <article>
              <p className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant mb-3">
                What it trains
              </p>
              <h3 className="font-serif text-[22px] lg:text-[24px] leading-snug text-on-surface mb-4">
                You stop thinking in rows. You start thinking in plans.
              </h3>
              <p className="font-body text-[15px] leading-relaxed text-on-surface-variant">
                Partitions, shuffles, lazy evaluation, the gap between the code
                you wrote and what the cluster actually runs. A mental model
                closer to a compiler than a script. Once you have it, you read
                every dataset the same way for the rest of your career.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Editorial section-break dingbat — a centered asterisk acts as
          a quiet "new chapter" mark between Why PySpark and the
          What-it-is section. Replaces a bare horizontal rule that would
          read as a divider; the ornament reads as intention. */}
      <div className="bg-surface-container-high border-b border-on-surface">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-12 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/shapes/asterisk.svg"
            alt=""
            aria-hidden="true"
            className="w-7 h-7 opacity-70 select-none pointer-events-none"
            draggable={false}
          />
        </div>
      </div>

      {/* ── 03 · What it is ────────────────────────────────────────────── */}
      <section
        id="what-it-is"
        aria-labelledby="what-title"
        className="border-b border-on-surface bg-surface-container-high scroll-mt-20"
      >
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20">
          <SectionLabel index="03" title="What it is" />
          {/* Stamp + headline grid — the editorial "LIVE · ON THE GRID ·
              VILNIUS · LITHUANIA" wax-seal stamp anchors the right side
              of the section opener and ties the provenance of the
              fictional energy operator to the actual one-publication
              voice. Visual weight comes from the stamp, not from another
              illustration; the headline keeps its breathing room. */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-10 gap-y-4 items-start mb-16">
            <div>
              <h2
                id="what-title"
                className="font-serif text-[36px] sm:text-[48px] leading-tight text-on-surface mb-6 max-w-[20ch]"
              >
                Three things, tightly bound. Nothing else.
              </h2>
              <p className="font-body text-[16px] sm:text-[18px] leading-relaxed text-on-surface-variant max-w-[58ch]">
                One continuous story. A Lithuanian utility recovering from a
                cascading failure — every dataset, every drill is its data. You
                learn PySpark by running it.
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/shapes/stamp-live.svg"
              alt=""
              aria-hidden="true"
              className="hidden md:block w-[160px] lg:w-[200px] h-auto shrink-0 self-start mt-2 -rotate-6 opacity-95 select-none pointer-events-none"
              draggable={false}
            />
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 border-t border-surface-dim">
            {WHAT_IT_IS.map((item, i) => (
              <li
                key={item.eyebrow}
                className="flex flex-col gap-3 border-b border-surface-dim py-8 md:border-b-0 md:border-r md:py-10 md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-data-mono tabular-nums text-[12px] text-on-surface-variant">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant text-right whitespace-nowrap">
                    {item.meta}
                  </span>
                </div>
                <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
                  {item.eyebrow}
                </span>
                <h3 className="font-serif text-[22px] lg:text-[26px] leading-tight text-on-surface">
                  {item.title}
                </h3>
                <p className="font-body text-[15px] leading-relaxed text-on-surface-variant">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 03 · Sample lesson ─────────────────────────────────────────── */}
      {sampleLesson ? (
        <section
          aria-labelledby="sample-title"
          className="border-b border-on-surface"
        >
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20">
            <SectionLabel index="04" title="A specimen lesson" />
            <h2
              id="sample-title"
              className="font-serif text-[36px] sm:text-[48px] leading-tight text-on-surface mb-4 max-w-[24ch]"
            >
              The writing, before you decide.
            </h2>
            <p className="font-body text-[16px] leading-relaxed text-on-surface-variant max-w-[60ch] mb-12">
              An excerpt from the curriculum. No screenshots, no marketing
              paraphrase — the actual prose and the actual code.
            </p>

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
          </div>
        </section>
      ) : null}

      {/* ── 04 · Curriculum ────────────────────────────────────────────── */}
      {tracks.length > 0 ? (
        <section
          aria-labelledby="curriculum-title"
          className="border-b border-on-surface bg-surface-container-high"
        >
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20">
            <SectionLabel index="05" title="The curriculum" />
            <h2
              id="curriculum-title"
              className="font-serif text-[36px] sm:text-[48px] leading-tight text-on-surface mb-4 max-w-[22ch]"
            >
              Thirty modules. The full table of contents.
            </h2>
            <p className="font-body text-[16px] leading-relaxed text-on-surface-variant max-w-[60ch] mb-16">
              Every chapter is written, paired with a practice set, and ordered
              so each tier can be read end-to-end. No filler.
            </p>
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
        </section>
      ) : null}

      {/* ── 05 · For / Not for ─────────────────────────────────────────── */}
      <section aria-labelledby="audience-title" className="border-b border-on-surface">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20">
          <SectionLabel index="06" title="Self-selection" />
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

      {/* ── 06 · Comparison ────────────────────────────────────────────── */}
      <section aria-labelledby="compare-title" className="border-b border-on-surface bg-surface-container-high">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20">
          <SectionLabel index="07" title="Set against the field" />
          <h2
            id="compare-title"
            className="font-serif text-[36px] sm:text-[48px] leading-tight text-on-surface mb-4 max-w-[22ch]"
          >
            How it differs.
          </h2>
          <p className="font-body text-[16px] leading-relaxed text-on-surface-variant max-w-[60ch] mb-12">
            Every comparable platform has its place. None of them ship the
            combination below.
          </p>
          <div className="overflow-x-auto -mx-6 lg:mx-0">
            {/* min-w bumped from 640 → 720 because the leftmost feature
                column needs ~280px to read at all on phones; the previous
                640 was crushing it to ~140px once the 4 score columns
                claimed their share. */}
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-y-2 border-on-surface">
                  <th className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant text-left py-3 px-3 sm:px-4 w-[44%]">
                    Feature
                  </th>
                  {COMPARISON_HEADERS.map((header, i) => (
                    <th
                      key={header}
                      className={`font-data-mono uppercase text-[10px] sm:text-[11px] tracking-wider text-center py-3 px-2 sm:px-4 ${
                        i === 0 ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-surface-dim">
                    <td className="font-serif text-[14px] sm:text-[15px] leading-snug text-on-surface py-4 px-3 sm:px-4 max-w-[28rem]">
                      {row.feature}
                    </td>
                    {row.cells.map((cell, i) => (
                      <td key={i} className="text-center py-4 px-2 sm:px-4">
                        <ComparisonCell kind={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 px-6 lg:px-0 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant sm:hidden">
            Scroll horizontally for the full comparison →
          </p>
        </div>
      </section>

      {/* ── 07 · Pricing ───────────────────────────────────────────────── */}
      <section aria-labelledby="pricing-title" className="border-b border-on-surface">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-24">
          <SectionLabel index="08" title="Subscription" />
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
        className="bg-surface-container-high/40"
      >
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <BrandCell size={20} marker="self" />
                <span className="font-serif text-[18px] lowercase tracking-tight text-on-surface">
                  stable<span className="text-primary">grid</span>
                  <span className="text-on-surface-variant">.io</span>
                </span>
              </div>
              <p className="font-body text-[14px] leading-relaxed text-on-surface-variant max-w-[44ch]">
                Gamified PySpark training for data engineers and analysts —
                Junior, Mid, and Senior modules with server-graded practice,
                XP, streaks, and energy rewards. Free during beta · no credit
                card required.
              </p>
            </div>
            <nav aria-label="Footer">
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href="/login"
                    className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface hover:text-primary transition-colors"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Support
                  </Link>
                </li>
                <li>
                  <CookiePreferencesButton />
                </li>
              </ul>
            </nav>
          </div>
          <div className="border-t border-surface-dim pt-6 flex flex-wrap justify-between gap-4 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
            <span>© 2026 stablegrid.io</span>
            <span>Beta · Vilnius</span>
          </div>
        </div>
      </footer>
    </main>
  );
};
