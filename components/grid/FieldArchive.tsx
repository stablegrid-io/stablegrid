'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { ComponentSlug } from '@/types/grid';
import { GRID_COMPONENTS } from '@/lib/grid/components';
import { BRIEFINGS } from '@/lib/grid/briefings';
import { Portal } from './Portal';
import { CATEGORY_COLOR } from './tokens';

interface FieldArchiveProps {
  deployedSlugs: readonly ComponentSlug[];
  onOpenBriefing: (slug: ComponentSlug) => void;
  onClose: () => void;
}

export function FieldArchive({ deployedSlugs, onOpenBriefing, onClose }: FieldArchiveProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const deployed = useMemo(() => new Set(deployedSlugs), [deployedSlugs]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows = useMemo(
    () => [...GRID_COMPONENTS].sort((a, b) => a.displayOrder - b.displayOrder),
    []
  );
  const readCount = rows.filter((c) => deployed.has(c.slug)).length;

  return (
    <Portal>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[115] flex items-stretch justify-end bg-on-surface/40 backdrop-blur-sm"
        style={{ animation: 'archive-fade 260ms ease-out' }}
      >
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-title"
          onClick={(e) => e.stopPropagation()}
          className="bg-surface border-l border-on-surface flex flex-col"
          style={{
            width: 'min(520px, 100%)',
            animation: 'archive-slide 340ms cubic-bezier(.16,1,.3,1)'
          }}
        >
          <header className="px-4 pt-5 pb-4 sm:px-7 sm:pt-7 sm:pb-5 border-b border-on-surface flex justify-between items-start gap-3">
            <div>
              <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-2">
                Field Archive
              </span>
              <h2 id="archive-title" className="font-h2 text-on-surface">
                Briefings on file
              </h2>
              <p className="font-data-mono tabular-nums text-[11px] text-on-surface-variant mt-2">
                {readCount} of 10 available to re-read
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close archive"
              className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center text-[22px] sm:text-[20px] leading-none text-on-surface-variant hover:text-on-surface transition-colors"
            >
              ×
            </button>
          </header>

          <div className="overflow-y-auto px-4 py-3 flex-1">
            {rows.map((c) => {
              const isDeployed = deployed.has(c.slug);
              const briefing = BRIEFINGS[c.slug];
              const color = CATEGORY_COLOR[c.category];
              return (
                <button
                  key={c.slug}
                  type="button"
                  disabled={!isDeployed}
                  onClick={() => isDeployed && onOpenBriefing(c.slug)}
                  className={`w-full text-left flex gap-4 items-start px-3 py-3 border border-transparent transition-colors ${
                    isDeployed
                      ? 'cursor-pointer hover:bg-surface-container-low hover:border-surface-dim'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <span
                    aria-hidden
                    className="flex-shrink-0 mt-1.5"
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: isDeployed ? color : 'transparent',
                      border: isDeployed ? 'none' : '1px solid var(--tw-color-surface-dim, #dddad1)'
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant block mb-1">
                      {c.category} · {c.districtName}
                    </span>
                    <div className="font-serif text-[16px] text-on-surface leading-snug mb-1">
                      {briefing.title}
                    </div>
                    <div className="font-body text-[13px] leading-relaxed text-on-surface-variant">
                      {isDeployed ? (
                        briefing.teaser
                      ) : (
                        <span className="italic">Locked until deployed.</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <style jsx>{`
          @keyframes archive-fade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes archive-slide {
            from { transform: translateX(40px); opacity: 0; }
            to   { transform: translateX(0); opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            aside { animation: none !important; }
          }
        `}</style>
      </div>
    </Portal>
  );
}
