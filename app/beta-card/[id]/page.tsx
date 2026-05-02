import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SLIDES } from '../_slides';

export const metadata: Metadata = {
  title: 'Beta card',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return SLIDES.map(({ id }) => ({ id }));
}

export const dynamicParams = false;

export default function BetaCardSlidePage({
  params,
}: {
  params: { id: string };
}) {
  const slide = SLIDES.find((s) => s.id === params.id);
  if (!slide) notFound();
  const { Component } = slide;

  return (
    <main
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <Component />
      </div>
    </main>
  );
}
