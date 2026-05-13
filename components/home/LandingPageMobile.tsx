import Link from 'next/link';
import { ArrowRight, Check, Instagram, Facebook } from 'lucide-react';
import { BrandCell } from '@/components/brand/BrandCell';
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
import { CookiePreferencesButton } from '@/components/home/landing/CookiePreferencesButton';
import { PracticeTaskCard } from '@/components/home/landing/PracticeTaskCard';
import { GridComponentGallery } from '@/components/home/landing/GridComponentGallery';
import { ScadaMimicBackground } from '@/components/home/landing/ScadaMimicBackground';
import { SAMPLE_TASK, GRID_COMPONENTS } from '@/components/home/landing/landingSamples';

/**
 * Phone-first landing page. Sibling to `LandingPage.tsx` (desktop). Server
 * routing in `app/page.tsx` picks the right variant from the User-Agent;
 * this file is *not* a responsive shrink of the desktop tree, it's a
 * deliberately leaner story:
 *
 *   - Compressed hero (no spinning mark, two stacked CTAs).
 *   - Three "what it is" rows with one-line bodies.
 *   - Curriculum surfaced as 3 tier counts, not 30 module nodes.
 *   - Self-selection (for/not-for) lists.
 *   - Differences as a vermillion bullet list (no horizontal-scroll table).
 *   - Single pricing card — no comparison column.
 *   - Minimal footer.
 *
 * Skipped on mobile (kept on desktop): GridFlowSection parallax chapters,
 * Lesson3DCard specimen, full ComparisonSection table, ComponentCatalogDemo.
 */

const FOR_WHOM_MOBILE = [
  'Engineers shipping pipelines, wanting depth.',
  'Analysts moving from pandas/SQL.',
  'Seniors prepping for interviews.',
] as const;

const NOT_FOR_WHOM_MOBILE = [
  'Absolute beginners.',
  'Certificate shoppers.',
  'Tool-of-the-month tourists.',
] as const;

export function LandingPageMobile() {
  const pyTracks = getTheoryTracks(theoryDocs.pyspark);

  return (
    <main className="bg-surface min-h-screen text-on-surface">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="m-hero-title"
        className="bg-grid-pattern px-5 pt-16 pb-14 text-center"
      >
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <BrandCell size={28} marker="self" />
          <span className="font-serif lowercase text-[28px] tracking-tight text-on-surface">
            stable<span className="text-primary">grid</span>
            <span className="text-on-surface-variant">.io</span>
          </span>
        </div>
        <h1
          id="m-hero-title"
          className="font-serif text-[36px] leading-[1.05] tracking-tight text-on-surface mb-5"
        >
          Handle big data with ease —
          <br />
          learn <span className="text-primary">PySpark</span>.
        </h1>
        <div className="flex flex-col items-stretch gap-2 max-w-[280px] mx-auto mt-8">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-primary text-on-primary border border-primary font-data-mono uppercase text-[12px] tracking-wider hover:bg-primary-dim hover:border-primary-dim transition-colors"
          >
            Start free <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <Link
            href="#what-it-is"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-surface text-on-surface border border-on-surface font-data-mono uppercase text-[12px] tracking-wider hover:bg-surface-container-low transition-colors"
          >
            What you’ll get
          </Link>
        </div>
        <p className="mt-6 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
          Free during beta · no credit card
        </p>
      </section>

      {/* ── § 02 · Curriculum at a glance ─────────────────────────────── */}
      <section
        id="what-it-is"
        aria-labelledby="m-curriculum-title"
        className="border-t border-on-surface px-5 py-14"
      >
        <div className="flex items-baseline gap-3 mb-8">
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant tabular-nums">
            § 02
          </span>
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface">
            The curriculum
          </span>
          <span className="flex-1 h-px bg-surface-dim" />
        </div>
        <h2
          id="m-curriculum-title"
          className="font-serif text-[28px] leading-tight tracking-tight text-on-surface mb-3 max-w-[22ch]"
        >
          Three tiers, top to bottom.
        </h2>
        <p className="font-body text-[14px] leading-relaxed text-on-surface-variant mb-8 max-w-[44ch]">
          Read end-to-end or jump in. Mid unlocks after Junior.
        </p>
        <ul className="flex flex-col gap-3">
          {pyTracks.map((track, i) => (
            <li key={track.slug}>
              <Link
                href={`/theory/${track.slug}`}
                className="block border border-on-surface bg-surface px-5 py-5 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface-variant">
                    Tier · {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-data-mono tabular-nums text-[12px] text-on-surface-variant">
                    {track.chapters.length} modules
                  </span>
                </div>
                <h3 className="font-serif text-[22px] leading-snug text-on-surface">
                  {track.label}
                </h3>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── § 03 · The practice ───────────────────────────────────────── */}
      <section
        aria-labelledby="m-practice-title"
        className="border-t border-on-surface bg-surface-container-low px-5 py-14"
      >
        <div className="flex items-baseline gap-3 mb-8">
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant tabular-nums">
            § 03
          </span>
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface">
            The practice
          </span>
          <span className="flex-1 h-px bg-surface-dim" />
        </div>
        <h2
          id="m-practice-title"
          className="font-serif text-[28px] leading-tight tracking-tight text-on-surface mb-6 max-w-[22ch]"
        >
          One task, mid-tier.
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
      </section>

      {/* ── § 04 · Grid game asset gallery ────────────────────────────── */}
      <section
        aria-labelledby="m-grid-title"
        className="border-t border-on-surface px-5 py-14"
      >
        <div className="flex items-baseline gap-3 mb-8">
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant tabular-nums">
            § 04
          </span>
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface">
            The grid game
          </span>
          <span className="flex-1 h-px bg-surface-dim" />
        </div>
        <h2
          id="m-grid-title"
          className="font-serif text-[28px] leading-tight tracking-tight text-on-surface mb-6 max-w-[22ch]"
        >
          Earn kWh. Deploy ten.
        </h2>
        <GridComponentGallery components={GRID_COMPONENTS} />
      </section>

      {/* ── § 05 · Self-selection ─────────────────────────────────────── */}
      <section
        aria-labelledby="m-audience-title"
        className="border-t border-on-surface bg-surface-container-low px-5 py-14"
      >
        <div className="flex items-baseline gap-3 mb-8">
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant tabular-nums">
            § 05
          </span>
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface">
            Self-selection
          </span>
          <span className="flex-1 h-px bg-surface-dim" />
        </div>
        <h2
          id="m-audience-title"
          className="font-serif text-[28px] leading-tight tracking-tight text-on-surface mb-8 max-w-[22ch]"
        >
          Honest about who this is for.
        </h2>

        <div className="border border-on-surface bg-surface p-5 mb-4">
          <p className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-primary mb-3">
            For you if
          </p>
          <ul className="flex flex-col gap-2.5">
            {FOR_WHOM_MOBILE.map((line) => (
              <li key={line} className="flex gap-2 font-body text-[14px] leading-relaxed text-on-surface">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-surface-dim bg-surface-container-low p-5">
          <p className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface-variant mb-3">
            Not for you if
          </p>
          <ul className="flex flex-col gap-2.5">
            {NOT_FOR_WHOM_MOBILE.map((line) => (
              <li key={line} className="flex gap-2 font-body text-[14px] leading-relaxed text-on-surface-variant">
                <span aria-hidden className="text-on-surface-variant/60 mt-0.5">—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── § 06 · Pricing ────────────────────────────────────────────── */}
      <section
        aria-labelledby="m-pricing-title"
        className="relative overflow-hidden border-t border-on-surface px-5 py-14"
      >
        <ScadaMimicBackground />
        <div className="relative z-10">
        <div className="flex items-baseline gap-3 mb-8">
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant tabular-nums">
            § 06
          </span>
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface">
            Subscription
          </span>
          <span className="flex-1 h-px bg-surface-dim" />
        </div>
        <h2
          id="m-pricing-title"
          className="font-serif text-[32px] leading-[1.1] tracking-tight text-on-surface mb-5 max-w-[22ch]"
        >
          <span className="text-primary">Free</span> during beta.
          <br />
          €14.99 once after.
        </h2>
        <p className="font-body text-[15px] leading-relaxed text-on-surface-variant max-w-[44ch] mb-8">
          Everyone gets the whole platform during beta. Supporters chip in
          once — no subscription, no renewals, no upsells.
        </p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center gap-2 px-5 py-4 bg-primary text-on-primary border border-primary font-data-mono uppercase text-[12px] tracking-wider hover:bg-primary-dim hover:border-primary-dim transition-colors"
        >
          Start free <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <p className="mt-3 text-center font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
          No credit card during beta
        </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer
        role="contentinfo"
        aria-label="Site footer"
        className="bg-white text-ink-light px-5 py-10"
      >
        <div className="flex items-center gap-2.5 mb-6 text-ink-light">
          <BrandCell size={20} mono />
          <span className="font-serif text-[18px] lowercase tracking-tight text-ink-light">
            stable<span className="text-vermillion">grid</span>
            <span className="text-ink-light/60">.io</span>
          </span>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4 mb-6">
            {[
              { href: '/login', label: 'Sign in', primary: true },
              { href: '/privacy', label: 'Privacy' },
              { href: '/terms', label: 'Terms' },
              { href: '/support', label: 'Support' },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`font-data-mono uppercase text-[11px] tracking-wider transition-colors ${
                    item.primary
                      ? 'text-ink-light hover:text-vermillion'
                      : 'text-ink-light/70 hover:text-ink-light'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <CookiePreferencesButton tone="light" />
            </li>
          </ul>
        </nav>
        <div className="flex items-center gap-4 mb-6">
          <a
            href="https://www.instagram.com/stablegrid.io/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="stablegrid.io on Instagram"
            className="text-ink-light/70 hover:text-vermillion transition-colors"
          >
            <Instagram className="h-5 w-5" strokeWidth={1.75} />
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61589515568612"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="stablegrid.io on Facebook"
            className="text-ink-light/70 hover:text-vermillion transition-colors"
          >
            <Facebook className="h-5 w-5" strokeWidth={1.75} />
          </a>
        </div>
        <div className="border-t border-ink-light/15 pt-4 flex flex-wrap justify-between gap-3 font-data-mono uppercase text-[10px] tracking-wider text-ink-light/70">
          <span>© 2026 stablegrid.io</span>
          <span>Free during beta</span>
        </div>
      </footer>
    </main>
  );
}
