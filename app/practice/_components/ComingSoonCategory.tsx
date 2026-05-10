import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ComingSoonCategoryProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function ComingSoonCategory({
  eyebrow,
  title,
  description
}: ComingSoonCategoryProps) {
  return (
    <main className="bg-surface min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-12 lg:py-16">
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant hover:text-on-surface mb-12"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          Back to Practice
        </Link>
        <header className="mb-16">
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-3">
            {eyebrow}
          </span>
          <h1 className="font-h1 text-h1 text-on-surface mb-3">{title}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            {description}
          </p>
          <div className="border-b border-on-surface mt-8" />
        </header>
        <div className="border border-surface-dim p-12 max-w-3xl">
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
            Status
          </span>
          <p className="font-serif text-[24px] text-on-surface mt-2 mb-4 leading-snug">
            Coming soon.
          </p>
          <p className="font-body text-[15px] text-on-surface-variant leading-relaxed">
            Content for this category is being authored. In the meantime, the
            Module Practice track has the full PySpark practice library.
          </p>
        </div>
      </div>
    </main>
  );
}
