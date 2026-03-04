'use client';

import Link from 'next/link';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

export const CTASection = () => {
  return (
    <section className="border-t border-[#1a2a22] py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="mb-4 text-4xl font-bold text-[#e3efe8]" style={{ fontFamily: 'Georgia, serif' }}>
          Start Theory Beta now.
          <br />
          Expand later with confidence.
        </h2>
        <p className="mb-8 text-lg text-[#9ab8a9]">
          Finish the core PySpark route with reliable progress tracking. Practice and mission layers are rolling out after this scope is complete.
        </p>
        <Link
          href="/signup"
          onClick={() => {
            void trackProductEvent('landing_cta', {
              source: 'final_cta'
            });
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#4ade80] px-8 py-4 text-lg font-medium text-[#08110b] transition-colors hover:bg-[#6fe89a]"
        >
          Start free
        </Link>
        <p className="mt-4 text-xs text-[#6f8f7d]">No credit card required for Free tier.</p>
      </div>
    </section>
  );
};
