import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const APPLE_FONT =
  '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

interface PracticeCategoryCard {
  id: string;
  title: string;
  category: string;
  /** Subtopic chip line — kept short so it reads on the card without wrap. */
  subtopics: string;
  description: string;
  /** Banner background image path. Same set used by /practice (PracticeHub). */
  image: string;
  /** Accent colour as `r,g,b` — drives the category pill, halo, and arrow. */
  catRgb: string;
  href: string;
  comingSoon: boolean;
  /** Live tracks for the footer rollup ("4 topic ladders" etc.). */
  rollup: string;
}

// Order matches PracticeHub. Coding is live; the other three flag
// `comingSoon: true` so this card grid stays honest with the practice hub
// state — every nested topic in the CS / Logic / Math selectors ships
// `comingSoon: true` today.
const CATEGORIES: PracticeCategoryCard[] = [
  {
    id: 'coding',
    title: 'Coding',
    category: 'Distributed',
    subtopics: 'Joins · Aggregations · Memory & Skew · Plan Reading',
    description:
      'PySpark and pandas drills against fictional power-grid datasets. Server-graded answers, deep-link back into the lesson when you miss.',
    image: '/brand/practice-coding.png',
    catRgb: '153,247,255',
    // Public landing page that sells the Coding section before the user
    // hits the auth-gated /practice/coding picker. Same pattern theory
    // uses with /topics/[slug].
    href: '/practice/coding/landing',
    comingSoon: false,
    rollup: '4 topic ladders · 3 tiers',
  },
  {
    id: 'computer-science',
    title: 'Computer Science',
    category: 'Foundations',
    subtopics: 'Algorithms · Systems · Data Structures',
    description:
      'Data structures, algorithms, complexity, distributed systems, concurrency. The foundations under everything.',
    image: '/brand/practice-cs.png',
    catRgb: '34,197,94',
    href: '/practice/computer-science/landing',
    comingSoon: true,
    rollup: 'Landing soon',
  },
  {
    id: 'logic',
    title: 'Logic',
    category: 'Reasoning',
    subtopics: 'Predicate · Set · Pattern · Structural',
    description:
      'Predicate logic, set reasoning, pattern recognition, structural deduction. The thinking muscle behind engineering decisions.',
    image: '/brand/practice-logic.png',
    catRgb: '191,129,255',
    href: '/practice/logic/landing',
    comingSoon: true,
    rollup: 'Landing soon',
  },
  {
    id: 'math-statistics',
    title: 'Math & Statistics',
    category: 'Quant',
    subtopics: 'Distributions · Sampling · Regression · Time Series',
    description:
      'Descriptive stats, distributions, sampling, regression, time series. Statistical reasoning for data engineers.',
    image: '/brand/practice-math.png',
    catRgb: '255,201,101',
    href: '/practice/math-statistics/landing',
    comingSoon: true,
    rollup: 'Landing soon',
  },
];

function CategoryCard({ card, index }: { card: PracticeCategoryCard; index: number }) {
  const rgb = card.catRgb;
  return (
    <div
      className="group relative h-full"
      style={{
        opacity: 0,
        animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${index * 80 + 100}ms forwards`,
      }}
    >
      <div
        className="relative overflow-hidden h-full flex flex-col md:flex-row transition-all duration-300"
        style={{
          background: '#181c20',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 22,
          minHeight: 168,
        }}
        onMouseEnter={(e) => {
          // All cards link now — give every one the same hover lift, just
          // a softer shadow on coming-soon to match its faded treatment.
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          e.currentTarget.style.boxShadow = card.comingSoon
            ? '0 8px 28px rgba(0,0,0,0.25)'
            : '0 12px 40px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Banner image — top on mobile, left on desktop. Treatment matches
            the cards on /practice (PracticeHub) so the landing teaser and
            the in-app hub read as one family. */}
        <div className="relative h-28 md:h-auto md:w-60 md:shrink-0 overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage: `url(${card.image})`,
              filter: card.comingSoon ? 'grayscale(0.6) brightness(0.55)' : undefined,
            }}
          />
          {/* Fade — bottom on mobile, right on desktop */}
          <div
            aria-hidden
            className="absolute inset-0 md:hidden"
            style={{ background: 'linear-gradient(to bottom, transparent 20%, #181c20 95%)' }}
          />
          <div
            aria-hidden
            className="absolute inset-0 hidden md:block"
            style={{ background: 'linear-gradient(to right, transparent 55%, #181c20 100%)' }}
          />
          {/* Accent line — top on mobile, left on desktop */}
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 md:hidden transition-all duration-300"
            style={{
              height: 2,
              background: `linear-gradient(90deg, transparent 5%, rgba(${rgb},${card.comingSoon ? 0.18 : 0.5}), transparent 95%)`,
            }}
          />
          <div
            aria-hidden
            className="absolute top-0 bottom-0 left-0 hidden md:block transition-all duration-300"
            style={{
              width: 2,
              background: `linear-gradient(180deg, transparent 5%, rgba(${rgb},${card.comingSoon ? 0.18 : 0.5}), transparent 95%)`,
            }}
          />
        </div>

        {/* Body */}
        <div
          className={`relative px-5 pt-4 pb-5 md:px-5 md:py-4 flex flex-col flex-1 min-w-0 ${card.comingSoon ? 'opacity-70' : ''}`}
        >
          {/* Category pill */}
          <span
            className="inline-flex self-start font-mono"
            style={{
              fontSize: 9.5,
              padding: '3px 9px',
              borderRadius: 999,
              border: `1px solid rgba(${rgb},${card.comingSoon ? 0.18 : 0.32})`,
              backgroundColor: `rgba(${rgb},${card.comingSoon ? 0.04 : 0.08})`,
              color: `rgb(${rgb})`,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            {card.category}
          </span>

          <h3
            className="font-bold tracking-tight uppercase"
            style={{
              fontFamily: APPLE_FONT,
              fontSize: 19,
              letterSpacing: '-0.02em',
              color: 'rgba(255,255,255,0.97)',
              marginBottom: 4,
            }}
          >
            {card.title}
          </h3>

          <p
            className="font-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.14em',
              color: `rgba(${rgb},${card.comingSoon ? 0.55 : 0.9})`,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {card.subtopics}
          </p>

          <p
            style={{
              fontFamily: APPLE_FONT,
              fontSize: 12.5,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 12,
              maxWidth: 640,
            }}
          >
            {card.description}
          </p>

          {/* Footer — rollup line + arrow / coming-soon pill */}
          <div className="mt-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <span
              className="font-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
              }}
            >
              {card.rollup}
            </span>
            {card.comingSoon ? (
              <span
                className="font-mono w-full md:w-auto md:shrink-0 text-center"
                style={{
                  fontSize: 10,
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: '1px dashed rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.32)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                Coming Soon
              </span>
            ) : (
              <span
                className="font-mono w-full md:w-auto md:shrink-0 inline-flex items-center justify-center gap-2 transition-all duration-200 hover:bg-white/[0.04]"
                style={{
                  fontSize: 10,
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.85)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Explore
                <ArrowRight aria-hidden className="h-3 w-3" strokeWidth={2.4} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PracticeShowcase() {
  return (
    <section id="practice" className="py-16 lg:py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Heading row — same eyebrow / split-headline style as Topics */}
        <p
          className="font-mono font-bold text-xs uppercase tracking-widest mb-4"
          style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em' }}
        >
          Practice
        </p>
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ lineHeight: 1.1 }}>
            Four disciplines.<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Drilled to instinct.</span>
          </h2>
          <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
            Coding · Computer Science · Logic · Math &amp; Statistics — pick a discipline and rep until hesitation turns into instinct. Coding is live today; the other three are landing soon.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* Every card links — live ones go to the gallery, coming-soon
              ones go to a dedicated landing that sets the vision until
              tracks ship. */}
          {CATEGORIES.map((card, i) => (
            <Link key={card.id} href={card.href} prefetch={false} className="block h-full">
              <CategoryCard card={card} index={i} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
