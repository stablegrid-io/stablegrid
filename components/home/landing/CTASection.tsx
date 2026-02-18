import Link from 'next/link';

export const CTASection = () => {
  return (
    <section className="border-t border-[#1f1f1f] py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="mb-4 font-serif text-4xl font-bold">
          Stop Googling the same
          <br />
          PySpark functions.
        </h2>
        <p className="mb-8 text-lg text-[#a3a3a3]">
          Everything you need to understand and work with large-scale data —
          theory, reference, and practice in one place.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-8 py-4 text-lg font-medium text-white transition-all hover:bg-[#059669]"
        >
          Start for free
        </Link>
        <p className="mt-4 text-xs text-[#525252]">
          SQL and Python free forever. No credit card required.
        </p>
      </div>
    </section>
  );
};
