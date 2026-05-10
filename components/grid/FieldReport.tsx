'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GridComponent } from '@/types/grid';
import type { ComponentBriefing } from '@/lib/grid/briefings';
import { Portal } from './Portal';
import { CATEGORY_COLOR } from './tokens';

interface FieldReportProps {
  component: GridComponent;
  briefing: ComponentBriefing;
  onClose: () => void;
  /** Shows a NEW DEPLOYMENT stamp. Omit when re-reading from the Field Archive. */
  isNewDeployment?: boolean;
}

type PageKey = 'image' | 'briefing' | 'operating' | 'horizon';

const PAGES: { key: PageKey; label: string }[] = [
  { key: 'image', label: 'Field Image' },
  { key: 'briefing', label: 'Briefing' },
  { key: 'operating', label: 'Operating Principle' },
  { key: 'horizon', label: 'Horizon' }
];

export function FieldReport({
  component,
  briefing,
  onClose,
  isNewDeployment = false
}: FieldReportProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const proseRef = useRef<HTMLDivElement | null>(null);
  const color = CATEGORY_COLOR[component.category];
  const [pageIdx, setPageIdx] = useState(0);
  const page = PAGES[pageIdx];
  const isLast = pageIdx === PAGES.length - 1;
  const isFirst = pageIdx === 0;

  const go = (delta: number) => {
    setPageIdx((p) => Math.max(0, Math.min(PAGES.length - 1, p + delta)));
  };

  useEffect(() => {
    proseRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [pageIdx]);

  useEffect(() => {
    setPageIdx(0);
  }, [briefing]);

  useEffect(() => {
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 320);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <Portal>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-10 bg-on-surface/40 backdrop-blur-sm"
        style={{ animation: 'fieldreport-fade 320ms ease-out' }}
      >
        <article
          ref={articleRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fieldreport-title"
          onClick={(e) => e.stopPropagation()}
          className="relative bg-surface border border-on-surface max-w-[860px] w-full max-h-[90vh] flex flex-col px-4 py-6 sm:px-7 sm:py-8 lg:px-12 lg:py-12"
          style={{
            borderLeftWidth: 3,
            borderLeftColor: color,
            animation: 'fieldreport-lift 460ms cubic-bezier(.16,1,.3,1)'
          }}
        >
          <header className="mb-5 pb-4 border-b border-surface-dim relative flex-shrink-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {isNewDeployment && (
                <span
                  className="font-data-mono uppercase text-[11px] tracking-wider px-2.5 py-1 border bg-surface"
                  style={{ color, borderColor: color }}
                >
                  New Deployment
                </span>
              )}
              <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
                {component.name} · {component.districtName}
              </span>
            </div>

            <h2
              id="fieldreport-title"
              className="font-h2 text-on-surface pr-10"
            >
              {briefing.title}
            </h2>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close field report"
              className="absolute top-0 right-0 w-9 h-9 flex items-center justify-center text-[20px] leading-none text-on-surface-variant hover:text-on-surface transition-colors"
            >
              ×
            </button>
          </header>

          {/* Page content */}
          <div
            ref={proseRef}
            key={page.key}
            className="overflow-y-auto flex-1 min-h-0 pr-1"
            style={{ animation: 'fieldreport-page 280ms ease-out' }}
          >
            <section>
              {page.key !== 'image' && (
                <h3 className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant mb-4">
                  {page.label}
                </h3>
              )}

              {page.key === 'image' && (
                <HeroImage
                  slug={component.slug}
                  alt={component.name}
                  teaser={briefing.teaser}
                />
              )}
              {page.key === 'briefing' && <Prose text={briefing.briefing} />}
              {page.key === 'operating' &&
                briefing.operatingPrinciple.map((p, i) => <Prose key={i} text={p} />)}
              {page.key === 'horizon' && <Prose text={briefing.horizon} />}
            </section>
          </div>

          {/* Footer: pagination */}
          <footer className="mt-5 pt-4 border-t border-surface-dim flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={isFirst}
              aria-label="Previous section"
              className={`inline-flex items-center gap-1.5 font-data-mono uppercase text-[11px] tracking-wider px-4 py-2.5 border transition-colors ${
                isFirst
                  ? 'border-transparent text-on-surface-variant/40 cursor-not-allowed'
                  : 'border-surface-dim text-on-surface-variant hover:border-on-surface hover:text-on-surface'
              }`}
            >
              <ChevronLeft size={14} strokeWidth={1.75} /> Prev
            </button>

            <div className="flex items-center justify-center gap-2.5 order-first sm:order-none w-full sm:w-auto pb-2 sm:pb-0 border-b sm:border-b-0 border-surface-dim" aria-hidden>
              {PAGES.map((p, i) => {
                const active = i === pageIdx;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPageIdx(i)}
                    aria-label={`Jump to ${p.label}`}
                    className={`h-2 transition-all ${
                      active
                        ? 'w-6 bg-on-surface'
                        : 'w-2 bg-surface-dim hover:bg-on-surface-variant'
                    }`}
                  />
                );
              })}
              <span className="font-data-mono tabular-nums text-[11px] text-on-surface-variant ml-2">
                {pageIdx + 1} / {PAGES.length}
              </span>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={() => (isLast ? onClose() : go(1))}
              className={`inline-flex items-center gap-1.5 font-data-mono uppercase text-[11px] tracking-wider px-4 py-2.5 border transition-colors ${
                isLast
                  ? 'border-on-surface bg-on-surface text-on-primary hover:bg-on-surface/90'
                  : 'border-surface-dim text-on-surface-variant hover:border-on-surface hover:text-on-surface'
              }`}
            >
              {isLast ? (
                'Return to Terminal'
              ) : (
                <>
                  Next <ChevronRight size={14} strokeWidth={1.75} />
                </>
              )}
            </button>
          </footer>
        </article>

        <style jsx>{`
          @keyframes fieldreport-fade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fieldreport-lift {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fieldreport-page {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            article, div { animation: none !important; }
          }
        `}</style>
      </div>
    </Portal>
  );
}

function HeroImage({ slug, alt, teaser }: { slug: string; alt: string; teaser: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="mb-5">
      <div
        className="relative w-full overflow-hidden bg-surface-container-low border border-surface-dim"
        style={{ height: 'clamp(240px, 46vh, 460px)' }}
      >
        {!failed && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/grid/components/${slug}.jpg`}
            alt={alt}
            onError={() => setFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'saturate(0.6) contrast(0.95)' }}
          />
        )}
        {failed && (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant"
          >
            {alt}
          </div>
        )}
      </div>
      {teaser && (
        <p className="font-body text-[15px] italic text-on-surface-variant leading-relaxed mt-5">
          {teaser}
        </p>
      )}
    </div>
  );
}

function Prose({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <p className="font-body text-[16px] text-on-surface leading-relaxed mb-5">
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <em key={i} className="text-primary font-medium not-italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </p>
  );
}
