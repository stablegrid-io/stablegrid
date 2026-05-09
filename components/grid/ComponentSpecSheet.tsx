'use client';

import { useEffect, useRef, useState } from 'react';
import type { GridComponent } from '@/types/grid';
import type { ComponentSpec } from '@/lib/grid/spec-sheets';
import { Portal } from './Portal';
import { CATEGORY_COLOR } from './tokens';

interface ComponentSpecSheetProps {
  component: GridComponent;
  spec: ComponentSpec;
  onClose: () => void;
}

export function ComponentSpecSheet({ component, spec, onClose }: ComponentSpecSheetProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const color = CATEGORY_COLOR[component.category];
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 320);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
        style={{ animation: 'specsheet-fade 280ms ease-out' }}
      >
        <article
          role="dialog"
          aria-modal="true"
          aria-labelledby="specsheet-title"
          onClick={(e) => e.stopPropagation()}
          className="relative bg-surface border border-on-surface w-full max-w-[860px] max-h-[92vh] flex flex-col overflow-hidden"
          style={{
            borderLeftWidth: 3,
            borderLeftColor: color,
            animation: 'specsheet-lift 360ms cubic-bezier(.16,1,.3,1)'
          }}
        >
          {/* Hero image */}
          <div className="relative w-full h-[220px] flex-shrink-0 overflow-hidden bg-surface-container-low border-b border-surface-dim">
            {!imageFailed && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`/grid/components/${component.slug}.jpg`}
                alt=""
                onError={() => setImageFailed(true)}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: 'saturate(0.6) contrast(0.95)' }}
              />
            )}
            <span className="absolute top-4 left-5 font-data-mono uppercase text-[10px] tracking-wider px-2.5 py-1 bg-surface border border-on-surface text-on-surface">
              {component.category}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close spec sheet"
              className="absolute top-3 right-3 w-9 h-9 inline-flex items-center justify-center bg-surface border border-on-surface text-on-surface text-[20px] leading-none hover:bg-surface-container-low transition-colors"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 min-h-0 p-6 sm:p-9">
            <header className="mb-6">
              <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-2">
                {component.districtName}
              </span>
              <h2 id="specsheet-title" className="font-h2 text-on-surface">
                {component.name}
              </h2>
            </header>

            <Section label="Description">
              <p className="font-body text-[15px] text-on-surface-variant leading-relaxed">
                {spec.description}
              </p>
            </Section>

            <Section label="Function">
              <p className="font-body text-[15px] text-on-surface-variant leading-relaxed">
                {spec.function}
              </p>
            </Section>

            <Section label="Parameters">
              <dl className="border border-surface-dim m-0">
                {spec.parameters.map((p, i) => (
                  <div
                    key={p.label}
                    className={`grid grid-cols-[1.1fr_1fr] ${
                      i === 0 ? '' : 'border-t border-surface-dim'
                    }`}
                  >
                    <dt className="px-4 py-3 font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant bg-surface-container-low">
                      {p.label}
                    </dt>
                    <dd className="px-4 py-3 m-0 font-data-mono tabular-nums text-[14px] text-on-surface">
                      {p.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Section>

            <div className="mt-8 pt-5 border-t border-surface-dim flex items-baseline justify-between gap-4">
              <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
                Deploy cost
              </span>
              <span className="font-data-mono tabular-nums text-[16px] text-on-surface">
                {component.costKwh.toLocaleString()}
                <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant ml-1.5">
                  kWh
                </span>
              </span>
            </div>
          </div>
        </article>

        <style jsx>{`
          @keyframes specsheet-fade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes specsheet-lift {
            from { opacity: 0; transform: translateY(14px); }
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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant mb-3">
        {label}
      </h3>
      {children}
    </section>
  );
}
