import { ImageResponse } from 'next/og';
import { getLandingTopicBySlug, LANDING_TOPICS } from '@/lib/landing/topics';

export const alt = 'StableGrid topic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateImageMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const topic = getLandingTopicBySlug(params.slug);
  return [
    {
      id: 'default',
      contentType: 'image/png',
      size: { width: 1200, height: 630 },
      alt: topic ? `${topic.name} — Junior to Senior on StableGrid` : alt,
    },
  ];
}

export function generateStaticParams() {
  return LANDING_TOPICS.map((t) => ({ slug: t.slug }));
}

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const topic = getLandingTopicBySlug(params.slug);

  const fallback = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0c0e',
        color: '#ffffff',
        fontSize: 80,
        fontWeight: 700,
      }}
    >
      stablegrid.io
    </div>
  );

  if (!topic) return new ImageResponse(fallback, size);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0c0e',
          color: '#ffffff',
          padding: 80,
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Ambient color glow seeded from category */}
        <div
          style={{
            position: 'absolute',
            top: -260,
            left: -260,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background: `radial-gradient(circle, rgba(${topic.catRgb},0.28), transparent 70%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -300,
            right: -300,
            width: 800,
            height: 800,
            borderRadius: 9999,
            background: `radial-gradient(circle, rgba(${topic.catRgb},0.16), transparent 70%)`,
            display: 'flex',
          }}
        />

        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 26,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: -0.5,
            fontWeight: 600,
          }}
        >
          stablegrid.io
        </div>

        {/* Center: category + name + description */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color: `rgb(${topic.catRgb})`,
              marginBottom: 32,
              fontWeight: 700,
            }}
          >
            {topic.category} Track
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: topic.name.length > 14 ? 92 : 110,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1,
              marginBottom: 36,
              color: 'rgba(255,255,255,0.97)',
            }}
          >
            {topic.name}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.62)',
              maxWidth: 1000,
            }}
          >
            {topic.description}
          </div>
        </div>

        {/* Footer: tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            color: 'rgba(255,255,255,0.42)',
            letterSpacing: 0.3,
          }}
        >
          Junior to Senior · Free during beta
        </div>
      </div>
    ),
    size,
  );
}
