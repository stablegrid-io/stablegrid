import Image from 'next/image';

const APPLE_FONT =
  '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

interface LanguageTile {
  id: 'pyspark' | 'python' | 'sql';
  name: string;
  oneLiner: string;
  logo: string;
  rgb: string;
  status: 'live' | 'soon';
  /** "4 topic ladders · 3 tiers" or "Catalogue in build" */
  rollup: string;
}

const LANGUAGES: LanguageTile[] = [
  {
    id: 'pyspark',
    name: 'PySpark',
    oneLiner: 'Joins, aggregations, memory & skew, plan reading.',
    // Standalone star — same mark used by PracticeShowcase / language picker.
    // The badge-styled `pyspark-logo.svg` has a circular surround that
    // fights the tile's halo at this size.
    logo: '/brand/pyspark-track-star.svg',
    rgb: '255,154,96',
    status: 'live',
    rollup: '4 topic ladders · 3 tiers',
  },
  {
    id: 'python',
    name: 'Python',
    oneLiner: 'pandas the way data engineers actually write it.',
    logo: '/brand/python-logo.svg',
    rgb: '99,201,255',
    status: 'live',
    rollup: '1 topic ladder · 3 tiers',
  },
  {
    id: 'sql',
    name: 'SQL',
    oneLiner: 'Joins, windows, dimensional modeling, query plans.',
    logo: '/brand/sql-logo.svg',
    rgb: '180,160,255',
    status: 'soon',
    rollup: 'Catalogue in build',
  },
];

/**
 * Apple-premium three-up showcase of the languages on offer. Each tile is
 * a quiet vertical card with one big halo behind the brand mark — the
 * idea is to make the languages feel like product hero shots, not a
 * feature list.
 */
export function LanguagesShowcase() {
  return (
    <section
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
          Three languages
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
          One discipline.
        </h2>
        <p
          className="text-center mx-auto"
          style={{
            fontFamily: APPLE_FONT,
            fontSize: 'clamp(1rem, 1.2vw, 1.125rem)',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.5)',
            maxWidth: 560,
            marginBottom: 64,
          }}
        >
          Distributed pipelines, single-machine pandas, set-based SQL — the
          languages a data engineer reaches for, drilled with the same
          rigor on each.
        </p>

        {/* Three-up tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {LANGUAGES.map((lang, i) => (
            <article
              key={lang.id}
              className="group relative overflow-hidden flex flex-col"
              style={{
                background: '#0f1215',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 24,
                padding: '48px 28px 32px',
                minHeight: 360,
                opacity: 0,
                animation: `fadeSlideUp .6s cubic-bezier(.16,1,.3,1) ${i * 100 + 100}ms forwards`,
              }}
            >
              {/* Status pill — top-right */}
              <span
                className="font-mono absolute"
                style={{
                  top: 18,
                  right: 18,
                  fontSize: 9.5,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border:
                    lang.status === 'live'
                      ? `1px solid rgba(${lang.rgb},0.4)`
                      : '1px dashed rgba(255,255,255,0.14)',
                  backgroundColor:
                    lang.status === 'live'
                      ? `rgba(${lang.rgb},0.10)`
                      : 'rgba(255,255,255,0.02)',
                  color:
                    lang.status === 'live'
                      ? `rgb(${lang.rgb})`
                      : 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  zIndex: 2,
                }}
              >
                {lang.status === 'live' ? 'Live' : 'Soon'}
              </span>

              {/* Halo behind the brand mark — single big radial, fades up */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 pointer-events-none transition-opacity duration-700"
                style={{
                  height: 240,
                  background: `radial-gradient(50% 60% at 50% 35%, rgba(${lang.rgb},${lang.status === 'live' ? 0.22 : 0.10}) 0%, transparent 70%)`,
                }}
              />

              {/* Brand mark — large, centered */}
              <div className="relative flex items-center justify-center mb-9" style={{ height: 96 }}>
                <Image
                  src={lang.logo}
                  alt=""
                  width={88}
                  height={88}
                  style={{
                    height: 88,
                    width: 'auto',
                    filter: lang.status === 'soon'
                      ? 'grayscale(0.35) opacity(0.85)'
                      : `drop-shadow(0 0 24px rgba(${lang.rgb},0.3))`,
                    transition: 'transform 700ms cubic-bezier(.16,1,.3,1)',
                  }}
                  className="group-hover:scale-105"
                />
              </div>

              {/* Name */}
              <h3
                className="text-center font-bold tracking-tight"
                style={{
                  fontFamily: APPLE_FONT,
                  fontSize: 28,
                  letterSpacing: '-0.025em',
                  color: 'rgba(255,255,255,0.97)',
                  marginBottom: 10,
                }}
              >
                {lang.name}
              </h3>

              {/* One-liner */}
              <p
                className="text-center mx-auto"
                style={{
                  fontFamily: APPLE_FONT,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: 'rgba(255,255,255,0.55)',
                  marginBottom: 22,
                  maxWidth: 280,
                }}
              >
                {lang.oneLiner}
              </p>

              {/* Footer rollup — pushed to bottom */}
              <div className="mt-auto pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p
                  className="text-center font-mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: '0.16em',
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {lang.rollup}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
