import Image from 'next/image';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { StableGridMark } from '@/components/brand/StableGridLogo';
import {
  COMPARISON_COMPETITORS,
  COMPARISON_FEATURES,
  COMPARISON_STABLEGRID_PRICE,
} from '@/lib/landing/comparison';

const APPLE_FONT =
  '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

// Dark-mode palette tuned to sit alongside the rest of the landing —
// elevated card surfaces match the Pricing card (#181c20), text colors
// match the page's primary/secondary/faint scale, accents reuse the
// existing cyan brand glow.
const TEXT_INK = 'rgba(255,255,255,0.97)';
const TEXT_MUTED = 'rgba(255,255,255,0.55)';
const TEXT_FAINT = 'rgba(255,255,255,0.35)';
const SURFACE_BG = '#0a0c0e';
const SURFACE_BRAND_CARD = '#181c20';
const SURFACE_TABLE_BG = 'rgba(255,255,255,0.025)';
const ROW_STRIPE = 'rgba(255,255,255,0.025)';
const ROW_DIVIDER = 'rgba(255,255,255,0.05)';
const CHECK_GREEN = '#34d399';     // slightly brighter on dark than #22c55e
const X_RED = '#f87171';
// Match the rest of the landing's primary CTA: off-white pill, dark text.
const CTA_BG = '#f0f0f3';
const CTA_BG_HOVER = '#ffffff';
const CTA_TEXT = '#0a0c0e';

// One height per logical row so the brand card on the left and the table
// on the right align exactly. Tweak in one place if labels grow.
const HEADER_ROW_PX = 56;
const FEATURE_ROW_PX = 60;
const PRICE_ROW_PX = 72;

export function ComparisonSection() {
  const totalCompetitors = COMPARISON_COMPETITORS.length;

  return (
    <section
      id="compare"
      className="px-6 py-20 lg:py-28"
      style={{ backgroundColor: SURFACE_BG, color: TEXT_INK }}
    >
      <div className="max-w-6xl mx-auto">
        {/* ── Centered heading, no eyebrow / subtitle ────────────────── */}
        <h2
          className="text-center font-bold tracking-tight mb-14 lg:mb-20"
          style={{
            fontFamily: APPLE_FONT,
            fontSize: 'clamp(2.25rem, 4vw, 3.25rem)',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            color: TEXT_INK,
          }}
        >
          How we compare
        </h2>

        {/* ── Desktop layout (≥ lg) ──────────────────────────────────── */}
        <div className="relative hidden lg:block">
          <div
            className="grid items-stretch gap-x-0"
            style={{
              gridTemplateColumns: `minmax(280px,1.1fr) repeat(${totalCompetitors}, minmax(0,1fr))`,
            }}
          >
            {/* ── Left column: StableGrid brand card ────────────────── */}
            <div
              className="relative z-10 flex flex-col"
              style={{
                backgroundColor: SURFACE_BRAND_CARD,
                borderRadius: 24,
                padding: '28px 28px 26px',
                border: '1px solid rgba(255,255,255,0.22)',
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.04), 0 30px 80px rgba(0,0,0,0.55)',
              }}
            >
              {/* Brand mark + name */}
              <div
                className="flex items-center gap-2.5"
                style={{ height: HEADER_ROW_PX, marginBottom: 4 }}
              >
                <StableGridMark
                  className="h-5 w-5 shrink-0"
                  style={{ color: TEXT_INK }}
                />
                <span
                  className="font-bold tracking-tight"
                  style={{
                    fontFamily: APPLE_FONT,
                    fontSize: 18,
                    letterSpacing: '-0.02em',
                    color: TEXT_INK,
                  }}
                >
                  StableGrid
                  <span style={{ color: TEXT_FAINT, fontWeight: 600 }}>.io</span>
                </span>
              </div>

              {/* Feature rows — height-locked to FEATURE_ROW_PX so they
                  align exactly with the right-side table cells. */}
              <ul className="flex flex-col">
                {COMPARISON_FEATURES.map((feature) => (
                  <li
                    key={feature.label}
                    className="flex items-center gap-3"
                    style={{ height: FEATURE_ROW_PX }}
                  >
                    <Check
                      className="h-[18px] w-[18px] shrink-0"
                      style={{ color: CHECK_GREEN }}
                      strokeWidth={3}
                    />
                    <span
                      style={{
                        fontFamily: APPLE_FONT,
                        fontSize: 14.5,
                        lineHeight: 1.35,
                        color: TEXT_INK,
                      }}
                    >
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Price row */}
              <div
                className="flex items-center"
                style={{ height: PRICE_ROW_PX, marginTop: 4 }}
              >
                <PriceLabel value={COMPARISON_STABLEGRID_PRICE} suffix="beta" />
              </div>

              {/* CTA */}
              <Link
                href="/login"
                prefetch={false}
                className="mt-2 inline-flex w-full items-center justify-center transition-colors"
                style={{
                  padding: '14px 18px',
                  borderRadius: 14,
                  backgroundColor: CTA_BG,
                  color: CTA_TEXT,
                  fontFamily: APPLE_FONT,
                  fontSize: 14.5,
                  fontWeight: 600,
                  letterSpacing: '-0.005em',
                  boxShadow: '0 0 12px rgba(240,240,243,0.1)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = CTA_BG_HOVER;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = CTA_BG;
                }}
              >
                Get started
              </Link>
            </div>

            {/* ── Right side: faded table that runs across all
                competitor columns. We render it as one block so row
                stripes / dividers are continuous, then place column
                cells inside via subgrid-style positioning. */}
            <div
              className="relative col-span-4"
              style={{ gridColumn: `2 / span ${totalCompetitors}` }}
            >
              <div
                className="relative h-full flex flex-col overflow-hidden"
                style={{
                  backgroundColor: SURFACE_TABLE_BG,
                  borderRadius: 24,
                  border: `1px solid ${ROW_DIVIDER}`,
                  // Pull slightly under the brand card so the card visually
                  // floats over the table, matching the screenshot's overlap.
                  marginLeft: -8,
                }}
              >
                {/* Header row */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${totalCompetitors}, minmax(0,1fr))`,
                    height: HEADER_ROW_PX,
                  }}
                >
                  {COMPARISON_COMPETITORS.map((competitor) => (
                    <div
                      key={competitor.name}
                      className="flex items-center justify-center gap-2"
                    >
                      <div
                        style={{
                          color: TEXT_FAINT,
                          opacity: 0.65,
                          display: 'inline-flex',
                        }}
                      >
                        <Image
                          src={competitor.logo}
                          alt=""
                          width={16}
                          height={16}
                          style={{
                            height: 16,
                            width: 'auto',
                            // Logos are already white. Drop opacity so they
                            // read as the same muted tone as the column name.
                            opacity: 0.55,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: APPLE_FONT,
                          fontSize: 14.5,
                          fontWeight: 600,
                          color: TEXT_MUTED,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {competitor.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Feature rows */}
                {COMPARISON_FEATURES.map((feature, rowIdx) => (
                  <div
                    key={feature.label}
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${totalCompetitors}, minmax(0,1fr))`,
                      height: FEATURE_ROW_PX,
                      backgroundColor:
                        rowIdx % 2 === 0 ? ROW_STRIPE : 'transparent',
                      borderTop: `1px solid ${ROW_DIVIDER}`,
                    }}
                  >
                    {COMPARISON_COMPETITORS.map((competitor, ci) => {
                      const supported = feature.competitors[ci];
                      return (
                        <div
                          key={`${ci}-${rowIdx}`}
                          className="flex items-center justify-center"
                        >
                          {supported ? (
                            <Check
                              className="h-[18px] w-[18px]"
                              style={{ color: CHECK_GREEN }}
                              strokeWidth={3}
                            />
                          ) : (
                            <X
                              className="h-[18px] w-[18px]"
                              style={{ color: X_RED }}
                              strokeWidth={3}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Price row */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${totalCompetitors}, minmax(0,1fr))`,
                    height: PRICE_ROW_PX,
                    borderTop: `1px solid ${ROW_DIVIDER}`,
                  }}
                >
                  {COMPARISON_COMPETITORS.map((competitor) => (
                    <div
                      key={competitor.name}
                      className="flex items-center justify-center"
                    >
                      <span
                        style={{
                          fontFamily: APPLE_FONT,
                          fontSize: 14.5,
                          color: TEXT_MUTED,
                          letterSpacing: '-0.005em',
                        }}
                      >
                        {competitor.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile / tablet — brand card only ─────────────────────── */}
        <div className="lg:hidden">
          <div
            className="relative flex flex-col"
            style={{
              backgroundColor: SURFACE_BRAND_CARD,
              borderRadius: 24,
              padding: '28px 24px 26px',
              border: '1px solid rgba(255,255,255,0.22)',
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.04), 0 30px 80px rgba(0,0,0,0.55)',
            }}
          >
            <div className="flex items-center gap-2.5 mb-6">
              <StableGridMark
                className="h-5 w-5 shrink-0"
                style={{ color: TEXT_INK }}
              />
              <span
                className="font-bold tracking-tight"
                style={{
                  fontFamily: APPLE_FONT,
                  fontSize: 18,
                  letterSpacing: '-0.02em',
                  color: TEXT_INK,
                }}
              >
                StableGrid
                <span style={{ color: TEXT_FAINT, fontWeight: 600 }}>.io</span>
              </span>
            </div>

            <ul className="flex flex-col gap-4 mb-7">
              {COMPARISON_FEATURES.map((feature) => (
                <li key={feature.label} className="flex items-center gap-3">
                  <Check
                    className="h-[18px] w-[18px] shrink-0"
                    style={{ color: CHECK_GREEN }}
                    strokeWidth={3}
                  />
                  <span
                    style={{
                      fontFamily: APPLE_FONT,
                      fontSize: 14.5,
                      lineHeight: 1.4,
                      color: TEXT_INK,
                    }}
                  >
                    {feature.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mb-5">
              <PriceLabel value={COMPARISON_STABLEGRID_PRICE} suffix="beta" />
            </div>

            <Link
              href="/login"
              prefetch={false}
              className="inline-flex w-full items-center justify-center"
              style={{
                padding: '14px 18px',
                borderRadius: 14,
                backgroundColor: CTA_BG,
                color: CTA_TEXT,
                fontFamily: APPLE_FONT,
                fontSize: 14.5,
                fontWeight: 600,
                letterSpacing: '-0.005em',
                boxShadow: '0 0 12px rgba(240,240,243,0.1)',
              }}
            >
              Get started
            </Link>

            <p
              className="font-mono text-center mt-6"
              style={{
                fontSize: 11,
                color: TEXT_FAINT,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                lineHeight: 1.5,
              }}
            >
              vs {COMPARISON_COMPETITORS.map((c) => c.name).join(' · ')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * "EUR 20 /mo" style price label, where the currency code is small and the
 * value is the loud element. For StableGrid we render "Free" big and the
 * suffix small so the slot looks balanced regardless of value.
 */
function PriceLabel({ value, suffix }: { value: string; suffix: string }) {
  const isCurrency = /^EUR\b/i.test(value);
  if (isCurrency) {
    const numeric = value.replace(/^EUR\s*/i, '');
    return (
      <span className="inline-flex items-baseline gap-1.5">
        <span
          style={{
            fontFamily: APPLE_FONT,
            fontSize: 13,
            fontWeight: 500,
            color: TEXT_MUTED,
            letterSpacing: '0.02em',
          }}
        >
          EUR
        </span>
        <span
          className="tabular-nums"
          style={{
            fontFamily: APPLE_FONT,
            fontSize: 30,
            fontWeight: 700,
            color: TEXT_INK,
            letterSpacing: '-0.025em',
          }}
        >
          {numeric}
        </span>
        <span
          style={{
            fontFamily: APPLE_FONT,
            fontSize: 13,
            fontWeight: 500,
            color: TEXT_MUTED,
          }}
        >
          /{suffix}
        </span>
      </span>
    );
  }
  // "Free", "Custom", etc. — render the value loud and the suffix small.
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        style={{
          fontFamily: APPLE_FONT,
          fontSize: 30,
          fontWeight: 700,
          color: TEXT_INK,
          letterSpacing: '-0.025em',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: APPLE_FONT,
          fontSize: 13,
          fontWeight: 500,
          color: TEXT_MUTED,
        }}
      >
        /{suffix}
      </span>
    </span>
  );
}
