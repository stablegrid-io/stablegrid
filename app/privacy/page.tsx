import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { COOKIE_CATEGORY_COPY, COOKIE_SERVICE_REGISTRY } from '@/lib/cookies/cookie-config';

export const metadata: Metadata = {
  title: 'Privacy · stableGrid.io',
  description: 'How stableGrid collects, uses, and protects user data.'
};

const policyCategories = [
  COOKIE_CATEGORY_COPY.necessary,
  COOKIE_CATEGORY_COPY.analytics,
  COOKIE_CATEGORY_COPY.marketing,
  COOKIE_CATEGORY_COPY.preferences
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: '#0a0c0e' }}>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>

        <header className="space-y-3">
          <p className="font-bold text-sm tracking-tight" style={{ color: '#99f7ff', letterSpacing: '0.08em' }}>STABLEGRID.IO</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Privacy Policy</h1>
          <p className="text-sm text-on-surface-variant/50">Effective date: March 9, 2026</p>
        </header>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-6">
          <h2 className="text-lg font-semibold text-on-surface">What we collect</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            We collect account information (name, email), reading progress, session usage,
            and optional analytics events only after consent for the Analytics category.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-6">
          <h2 className="text-lg font-semibold text-on-surface">Why we collect it</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            Data is used to authenticate your account, persist chapter progress, improve
            reliability, and understand core funnel behavior for launch quality decisions.
          </p>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-6">
          <h2 className="text-lg font-semibold text-on-surface">Your controls</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            You can request a GDPR export or permanently delete your account in Settings &gt; Danger Zone. These actions require authentication.
          </p>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            You can change cookie choices at any time from the persistent <span className="font-medium text-on-surface/80">Cookie settings</span> control shown across the site.
          </p>
        </section>

        <section className="space-y-4 rounded-[22px] border border-white/[0.06] bg-[#111416] p-6">
          <h2 className="text-lg font-semibold text-on-surface">Cookie Policy</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            We use necessary cookies to operate the website. Analytics, marketing, and preference cookies stay off by default until you opt in.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {policyCategories.map((category) => (
              <article key={category.label} className="rounded-[14px] border border-white/[0.06] bg-[#0c0e10] p-4">
                <h3 className="text-sm font-semibold text-on-surface">{category.label}</h3>
                <p className="mt-1 text-xs leading-6 text-on-surface-variant/50">{category.description}</p>
              </article>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant/40">Cookie and service inventory</h3>
            <div className="overflow-x-auto rounded-[14px] border border-white/[0.06]">
              <table className="min-w-full divide-y divide-white/[0.06] text-left text-sm">
                <thead className="bg-[#0c0e10] text-xs uppercase tracking-wide text-on-surface-variant/40">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Provider</th>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 font-semibold">Purpose</th>
                    <th className="px-3 py-2 font-semibold">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-on-surface-variant/60">
                  {COOKIE_SERVICE_REGISTRY.map((service) => (
                    <tr key={service.id}>
                      <td className="px-3 py-2 font-medium text-on-surface/80">{service.name}</td>
                      <td className="px-3 py-2">{service.provider}</td>
                      <td className="px-3 py-2">{COOKIE_CATEGORY_COPY[service.category].label}</td>
                      <td className="px-3 py-2">{service.purpose}</td>
                      <td className="px-3 py-2">{service.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-[22px] border border-white/[0.06] bg-[#111416] p-6">
          <h2 className="text-lg font-semibold text-on-surface">Contact</h2>
          <p className="text-sm leading-7 text-on-surface-variant/60">
            For privacy questions, contact{' '}
            <a href="mailto:support@stablegrid.io" className="font-medium text-primary hover:underline">support@stablegrid.io</a>.
          </p>
        </section>

        <footer className="pt-8 pb-4 text-center text-[11px] text-on-surface-variant/25">
          © 2026 stableGrid.io
        </footer>
      </div>
    </main>
  );
}
