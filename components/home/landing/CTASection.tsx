import Link from 'next/link';

export const CTASection = () => {
  return (
    <section className="border-t border-[#1f1f1f] py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="mb-4 text-4xl font-bold text-[#d8eaf8]" style={{ fontFamily: 'Georgia, serif' }}>
          Deploy infrastructure.
          <br />
          Build real data skills.
        </h2>
        <p className="mb-8 text-lg text-[#8aaece]">
          StableGrid turns every solved query into deployment authority for renewable grid stability.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-[#64a0dc] px-8 py-4 text-lg font-medium text-[#09111e] transition-colors hover:bg-[#8eb9de]"
        >
          Start Learning
        </Link>
        <p className="mt-4 text-xs text-[#6f93b2]">No credit card required for Free tier.</p>
      </div>
    </section>
  );
};
