export interface LandingFaq {
  q: string;
  a: string;
}

/**
 * FAQ rendered on the landing page right after the Compare section.
 *
 * Editing rules
 * ─────────────
 * - Don't repeat what other landing sections already say. Topics, tiers,
 *   pricing, and the vs-DataCamp comparison are already covered above —
 *   the FAQ should answer the questions those sections leave open.
 * - Keep pricing in sync with the Pricing section. Today: free during beta,
 *   €14.99 one-time Supporter plan (lifetime access, not subscription).
 * - Avoid hour estimates and exact track counts in the answers; both drift
 *   as the catalogue grows. Prefer "tracks" over "hours".
 */
export const LANDING_FAQS: readonly LandingFaq[] = [
  {
    q: 'What is stablegrid.io?',
    a: "An ed-tech platform for working data engineers and analysts who'd rather understand a query plan than collect another certificate. Five tracks — PySpark, Microsoft Fabric, Apache Airflow, SQL, and Python — taught Junior to Senior on one fictional power-grid scenario. Every track pairs deep theory with server-graded practice.",
  },
  {
    q: 'Who is it for, and do I need prior experience?',
    a: "Working analysts, junior engineers, and self-taught learners moving toward data engineering. The Junior tier assumes only basic Python or SQL — we teach the systems part. Mid and Senior assume you've shipped real pipelines and want the architectural depth most courses skip.",
  },
  {
    q: 'How is practice graded?',
    a: 'Server-side. Practice tasks check your code against real assertions, not exact-match strings — you can write the transform any way you like as long as the output matches. When you miss, the platform deep-links you straight back to the lesson that taught the missing piece.',
  },
  {
    q: 'Will I get a certificate?',
    a: "No. The output is fluency you can demonstrate in a query plan or a code review, not a paper credential. If you're learning to pass an exam, this is the wrong platform. If you're learning to ship better data systems, it's built for that.",
  },
  {
    q: 'What does it cost?',
    a: 'Free during beta — every tier, every track, no card needed. If you want to back the build once we launch, the Supporter plan is €14.99 paid once, lifetime access, no subscription, no renewals.',
  },
];
