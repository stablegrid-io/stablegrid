import Link from 'next/link';

export const CTASection = () => {
  return (
    <section className="border-t border-[#1a2a22] py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="mb-4 text-4xl font-bold text-[#e3efe8]" style={{ fontFamily: 'Georgia, serif' }}>
          Deploy infrastructure.
          <br />
          Build real data skills.
        </h2>
        <p className="mb-8 text-lg text-[#9ab8a9]">
          StableGrid turns every solved query into deployment authority for renewable grid stability.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-[#4ade80] px-8 py-4 text-lg font-medium text-[#08110b] transition-colors hover:bg-[#6fe89a]"
        >
          Start Learning
        </Link>
        <p className="mt-4 text-xs text-[#6f8f7d]">No credit card required for Free tier.</p>
      </div>
    </section>
  );
};
