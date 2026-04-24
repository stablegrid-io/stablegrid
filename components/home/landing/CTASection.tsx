'use client';

import Link from 'next/link';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

export const CTASection = () => {
  return (
    <section className="border-t border-grid-border py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="mb-4 text-4xl font-bold text-[#e3efe8]" style={{ fontFamily: 'Georgia, serif' }}>
          Start your theory route now.
          <br />
          Expand later with confidence.
        </h2>
        <p className="mb-8 text-lg text-grid-text">
          Finish the core PySpark route with reliable progress tracking. Practice and mission layers are rolling out after this scope is complete.
        </p>
        <Link
          href="/login"
          onClick={() => {
            void trackProductEvent('landing_cta', {
              source: 'final_cta'
            });
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-grid-glow px-8 py-4 text-lg font-medium text-grid-ink transition-colors hover:bg-grid-glow-bright"
        >
          Get started
        </Link>
        <p className="mt-4 text-xs text-grid-text-dim">No credit card required for Free tier.</p>
      </div>
    </section>
  );
};
