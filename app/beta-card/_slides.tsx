import type { ReactNode } from 'react';
import { StableGridBrand } from '@/components/brand/StableGridLogo';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';
const SANS = 'var(--font-inter), system-ui, sans-serif';

const COLOR = {
  black: '#0A0A0A',
  yellow: '#F4C44A',
  yellowAccent: '#E8B14F',
  red: '#D14D4D',
  green: '#6FB85F',
  codeOrange: '#E89A4F',
  codeGreen: '#6FB85F',
  codeGray: '#6B7280',
};

interface SlideShellProps {
  bg: 'black' | 'yellow';
  topLeft: string;
  topRight: ReactNode;
  bottomRight?: ReactNode;
  children: ReactNode;
  width?: number;
  height?: number;
}

function SlideShell({
  bg,
  topLeft,
  topRight,
  bottomRight,
  children,
  width = 1080,
  height = 1080,
}: SlideShellProps) {
  const isBlack = bg === 'black';
  const bgColor = isBlack ? COLOR.black : COLOR.yellow;
  const subtle = isBlack ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.55)';
  const logoTone = isBlack ? '#FFFFFF' : '#0A0A0A';

  return (
    <div
      data-slide-card
      style={{
        position: 'relative',
        width,
        height,
        backgroundColor: bgColor,
        overflow: 'hidden',
        fontFamily: SANS,
      }}
    >
      {isBlack && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% -10%, rgba(232,177,79,0.06) 0%, transparent 55%)',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 56,
          right: 56,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: MONO,
          fontSize: 17,
          letterSpacing: '0.2em',
          color: subtle,
          textTransform: 'uppercase',
        }}
      >
        <span>{topLeft}</span>
        <span>{topRight}</span>
      </div>

      {children}

      <div
        style={{ position: 'absolute', bottom: 56, left: 56, color: logoTone }}
      >
        <StableGridBrand className="text-[26px]" />
      </div>

      {bottomRight && (
        <div style={{ position: 'absolute', bottom: 56, right: 56 }}>
          {bottomRight}
        </div>
      )}
    </div>
  );
}

function SwipePill() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 22px',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.85)',
        fontFamily: MONO,
        fontSize: 13,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          backgroundColor: COLOR.yellowAccent,
          boxShadow: `0 0 12px ${COLOR.yellowAccent}`,
          display: 'inline-block',
        }}
      />
      Swipe →
    </div>
  );
}

function MonoLink({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 14,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
      }}
    >
      {children}
    </span>
  );
}

function Pill({
  children,
  variant,
}: {
  children: ReactNode;
  variant: 'dark' | 'red';
}) {
  const styles =
    variant === 'dark'
      ? { bg: '#0A0A0A', color: '#FFF' }
      : { bg: COLOR.red, color: '#FFF' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 14px',
        borderRadius: 999,
        backgroundColor: styles.bg,
        color: styles.color,
        fontFamily: MONO,
        fontSize: 16,
        fontWeight: 500,
        marginLeft: 12,
      }}
    >
      {children}
    </span>
  );
}

export function SlideHero() {
  return (
    <div
      data-slide-card
      style={{
        position: 'relative',
        width: 1080,
        height: 1350,
        backgroundColor: '#000',
        overflow: 'hidden',
        fontFamily: SANS,
      }}
    >
      <img
        src="/landing-hero.jpg"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0) 38%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.88) 100%)',
        }}
      />
      <div style={{ position: 'absolute', top: 64, left: 64 }}>
        <StableGridBrand className="text-[40px]" />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          bottom: 64,
          color: '#FFF',
        }}
      >
        <h1
          style={{
            fontWeight: 600,
            fontSize: 64,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            margin: 0,
          }}
        >
          For people who&apos;d rather
          <br />
          read a query plan
          <br />
          than another certificate.
        </h1>
        <div style={{ height: 28 }} />
        <div
          style={{
            fontSize: 20,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.02em',
          }}
        >
          Private beta — May 2026
        </div>
        <div style={{ height: 4 }} />
        <div
          style={{
            fontSize: 20,
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 500,
          }}
        >
          stablegrid.io
        </div>
      </div>
    </div>
  );
}

export function Slide01() {
  return (
    <SlideShell
      bg="black"
      topLeft="StableGrid.io · Cover"
      topRight="01 / 7"
      bottomRight={<SwipePill />}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 56,
          right: 56,
          transform: 'translateY(-50%)',
        }}
      >
        <div
          style={{
            color: '#FFF',
            fontWeight: 700,
            fontSize: 78,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
          }}
        >
          You don&apos;t need
          <br />
          another{' '}
          <span style={{ color: COLOR.yellowAccent }}>certificate.</span>
          <br />
          You need to read
          <br />
          a <span style={{ color: COLOR.yellowAccent }}>query plan.</span>
        </div>
      </div>
    </SlideShell>
  );
}

export function Slide02() {
  return (
    <SlideShell
      bg="yellow"
      topLeft="StableGrid.io · Stat"
      topRight="02 / 7"
      bottomRight={<MonoLink>Why we built this →</MonoLink>}
    >
      <div
        style={{
          position: 'absolute',
          top: 320,
          left: 56,
          right: 56,
        }}
      >
        <div
          style={{
            color: COLOR.black,
            fontWeight: 700,
            fontSize: 320,
            lineHeight: 0.88,
            letterSpacing: '-0.05em',
          }}
        >
          73<span style={{ fontSize: 180 }}>%</span>
        </div>
        <div style={{ height: 32 }} />
        <div
          style={{
            color: 'rgba(0,0,0,0.85)',
            fontWeight: 500,
            fontSize: 32,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            maxWidth: 760,
          }}
        >
          of slow queries are slow because of a missing index or a bad join
          order — not data volume.
        </div>
      </div>
    </SlideShell>
  );
}

export function Slide03() {
  return (
    <SlideShell
      bg="black"
      topLeft="StableGrid.io · Before"
      topRight="03 / 7"
      bottomRight={<SwipePill />}
    >
      <div
        style={{
          position: 'absolute',
          top: 380,
          left: 56,
          right: 56,
        }}
      >
        <div
          style={{
            color: '#FFF',
            fontWeight: 700,
            fontSize: 56,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
          }}
        >
          Why is this query{' '}
          <span style={{ color: COLOR.yellowAccent }}>22× slower</span>
          <br />
          on Tuesday?
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 600,
          left: 56,
          right: 56,
          padding: '28px 32px',
          borderRadius: 18,
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontFamily: MONO,
          fontSize: 22,
          lineHeight: 1.5,
          color: '#E8E8E8',
        }}
      >
        <div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>{' '}
          <span style={{ color: COLOR.codeOrange }}>EXPLAIN ANALYZE SELECT</span>{' '}
          user_id, <span style={{ color: COLOR.codeOrange }}>COUNT</span>(*)
        </div>
        <div>
          <span style={{ color: COLOR.codeOrange }}>FROM</span> events
        </div>
        <div>
          <span style={{ color: COLOR.codeOrange }}>WHERE</span> created_at ≥{' '}
          <span style={{ color: COLOR.codeGreen }}>
            &apos;2026-04-01&apos;
          </span>
        </div>
        <div>
          <span style={{ color: COLOR.codeOrange }}>GROUP BY</span> user_id;
        </div>
        <div style={{ height: 18 }} />
        <div style={{ color: COLOR.codeGray, fontStyle: 'italic' }}>
          -- Seq Scan on events (cost=0..847291.13 rows=12M)
        </div>
        <div style={{ color: COLOR.codeGray, fontStyle: 'italic' }}>
          -- ↑ no index on created_at. swap to BRIN, save 4.2s.
        </div>
      </div>
    </SlideShell>
  );
}

export function Slide04() {
  return (
    <SlideShell
      bg="black"
      topLeft="StableGrid.io · After"
      topRight="04 / 7"
      bottomRight={<SwipePill />}
    >
      <div
        style={{
          position: 'absolute',
          top: 380,
          left: 56,
          right: 56,
        }}
      >
        <div
          style={{
            color: '#FFF',
            fontWeight: 700,
            fontSize: 56,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
          }}
        >
          Same query.{' '}
          <span style={{ color: COLOR.green }}>180&nbsp;ms.</span>
          <br />
          One BRIN index.
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 600,
          left: 56,
          right: 56,
          padding: '28px 32px',
          borderRadius: 18,
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontFamily: MONO,
          fontSize: 22,
          lineHeight: 1.5,
          color: '#E8E8E8',
        }}
      >
        <div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>{' '}
          <span style={{ color: COLOR.codeOrange }}>CREATE INDEX</span>{' '}
          events_created_brin
        </div>
        <div>
          <span style={{ color: COLOR.codeOrange }}>ON</span> events{' '}
          <span style={{ color: COLOR.codeOrange }}>USING</span> BRIN
          (created_at);
        </div>
        <div style={{ height: 18 }} />
        <div style={{ color: COLOR.codeGray, fontStyle: 'italic' }}>
          -- BitmapHeapScan (cost=12.4..1408 rows=12M)
        </div>
        <div style={{ color: COLOR.codeGray, fontStyle: 'italic' }}>
          -- 4,200 ms → 180 ms. plan changed. that&apos;s the win.
        </div>
      </div>
    </SlideShell>
  );
}

export function Slide05() {
  return (
    <SlideShell
      bg="yellow"
      topLeft="StableGrid.io · Visual"
      topRight="05 / 7"
      bottomRight={<MonoLink>Full guide →</MonoLink>}
    >
      <div
        style={{
          position: 'absolute',
          top: 360,
          left: 56,
          right: 56,
        }}
      >
        <div
          style={{
            color: COLOR.black,
            fontWeight: 700,
            fontSize: 60,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            maxWidth: 880,
          }}
        >
          What an EXPLAIN plan
          <br />
          is actually telling you
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 620,
          left: 56,
          right: 56,
          padding: '32px 36px',
          borderRadius: 18,
          backgroundColor: 'rgba(0,0,0,0.06)',
          fontFamily: MONO,
          fontSize: 26,
          lineHeight: 1.6,
          color: COLOR.black,
        }}
      >
        <div style={{ fontWeight: 700 }}>
          HashAggregate{' '}
          <span style={{ color: 'rgba(0,0,0,0.5)', fontWeight: 400 }}>
            (cost=12.40..14.80 rows=240)
          </span>
        </div>
        <div style={{ paddingLeft: 28 }}>
          └─ Hash Join{' '}
          <span style={{ color: 'rgba(0,0,0,0.5)' }}>(cost=8.20..12.40)</span>
        </div>
        <div style={{ paddingLeft: 56, display: 'flex', alignItems: 'center' }}>
          ├─ Index Scan
          <Pill variant="dark">← good</Pill>
        </div>
        <div style={{ paddingLeft: 56, display: 'flex', alignItems: 'center' }}>
          └─ Seq Scan
          <Pill variant="red">← bad</Pill>
        </div>
      </div>
    </SlideShell>
  );
}

export function Slide06() {
  return (
    <SlideShell
      bg="black"
      topLeft="StableGrid.io · Manifesto"
      topRight="06 / 7"
      bottomRight={<SwipePill />}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 56,
          right: 56,
          transform: 'translateY(-50%)',
        }}
      >
        <div
          style={{
            color: 'rgba(255,255,255,0.32)',
            fontWeight: 600,
            fontSize: 88,
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
            textDecoration: 'line-through',
            textDecorationThickness: 5,
          }}
        >
          Collect the badge.
        </div>
        <div style={{ height: 24 }} />
        <div
          style={{
            color: '#FFF',
            fontWeight: 700,
            fontSize: 122,
            lineHeight: 0.98,
            letterSpacing: '-0.04em',
          }}
        >
          Read the
          <br />
          <span style={{ color: COLOR.yellowAccent }}>plan.</span>
        </div>
      </div>
    </SlideShell>
  );
}

export function Slide07() {
  return (
    <SlideShell
      bg="yellow"
      topLeft="StableGrid.io · Beta"
      topRight="07 / 7"
      bottomRight={
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 22px',
            borderRadius: 999,
            backgroundColor: COLOR.black,
            color: '#FFF',
            fontFamily: MONO,
            fontSize: 13,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: COLOR.yellowAccent,
              display: 'inline-block',
            }}
          />
          Reserve →
        </div>
      }
    >
      <div
        style={{
          position: 'absolute',
          top: 380,
          left: 56,
          right: 56,
        }}
      >
        <div
          style={{
            color: 'rgba(0,0,0,0.55)',
            fontFamily: MONO,
            fontSize: 18,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          ▌Private beta
        </div>
        <div
          style={{
            color: COLOR.black,
            fontWeight: 700,
            fontSize: 140,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
          }}
        >
          May 2026.
        </div>
        <div style={{ height: 36 }} />
        <div
          style={{
            color: 'rgba(0,0,0,0.85)',
            fontSize: 30,
            fontWeight: 500,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            maxWidth: 800,
          }}
        >
          For people who&apos;d rather read a query plan than another
          certificate.
        </div>
      </div>
    </SlideShell>
  );
}

export interface SlideEntry {
  id: string;
  label: string;
  width: number;
  height: number;
  Component: () => JSX.Element;
}

export const SLIDES: SlideEntry[] = [
  { id: 'hero', label: 'Hero (portrait)', width: 1080, height: 1350, Component: SlideHero },
  { id: '01', label: '01 · Cover', width: 1080, height: 1080, Component: Slide01 },
  { id: '02', label: '02 · Stat', width: 1080, height: 1080, Component: Slide02 },
  { id: '03', label: '03 · Before', width: 1080, height: 1080, Component: Slide03 },
  { id: '04', label: '04 · After', width: 1080, height: 1080, Component: Slide04 },
  { id: '05', label: '05 · Visual', width: 1080, height: 1080, Component: Slide05 },
  { id: '06', label: '06 · Manifesto', width: 1080, height: 1080, Component: Slide06 },
  { id: '07', label: '07 · CTA', width: 1080, height: 1080, Component: Slide07 },
];
