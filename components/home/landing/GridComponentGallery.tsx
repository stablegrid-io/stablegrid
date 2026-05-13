import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface GridComponent {
  src: string;
  name: string;
  category: string;
  cost: number;
  chapter: string;
  blurb: string;
}

interface GridComponentGalleryProps {
  components: readonly GridComponent[];
}

/**
 * Landing-page asset gallery for the grid game. Hovering a card dims the
 * image and reveals the chapter it ties to plus a single-line blurb —
 * enough to land the "every component is a chapter" promise without
 * pushing the visitor into a separate reveal panel. Pure CSS hover (no
 * client state), so this stays a server component and ships less JS.
 */
export function GridComponentGallery({ components }: GridComponentGalleryProps) {
  return (
    <>
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-outline-variant border border-outline-variant">
        {components.map((c) => (
          <li key={c.src} className="bg-surface">
            <div className="group relative flex flex-col h-full focus-within:bg-surface-container-low">
              <div className="relative aspect-[4/3] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.src}
                  alt={c.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                {/* Category chip — always visible */}
                <span
                  className="absolute top-2 left-2 z-10 px-2 py-1 bg-surface font-data-mono uppercase text-on-surface transition-opacity duration-300 group-hover:opacity-0"
                  style={{ fontSize: '9px', letterSpacing: '0.18em' }}
                >
                  {c.category}
                </span>

                {/* Hover overlay — dim scrim + chapter ref + 1-line blurb.
                    Pointer-events disabled so cursor stays on the card.
                    Keyboard users get the same reveal via focus-within. */}
                <div
                  className="absolute inset-0 pointer-events-none flex flex-col justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(20,20,15,0.92) 0%, rgba(20,20,15,0.78) 55%, rgba(20,20,15,0.55) 100%)'
                  }}
                >
                  <span
                    className="font-data-mono uppercase text-primary mb-1.5"
                    style={{ fontSize: '9px', letterSpacing: '0.18em' }}
                  >
                    {c.chapter}
                  </span>
                  <p className="font-body text-[12px] leading-snug text-on-surface line-clamp-4">
                    {c.blurb}
                  </p>
                </div>
              </div>
              <div className="px-3 py-3 flex items-baseline justify-between gap-2">
                <span className="font-serif text-[13px] leading-tight text-on-surface truncate">
                  {c.name}
                </span>
                <span className="font-data-mono text-[10px] tabular-nums text-on-surface-variant whitespace-nowrap">
                  {c.cost} kWh
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 pt-6 border-t border-outline-variant flex flex-wrap items-center justify-between gap-4">
        <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
          EVERY COMPONENT TIES TO A CHAPTER YOU READ
        </span>
        <Link
          href="/grid"
          className="inline-flex items-center gap-2 font-data-mono uppercase text-[11px] tracking-wider text-on-surface hover:text-primary transition-colors border-b border-on-surface hover:border-primary pb-1"
        >
          Open the grid game <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </div>
    </>
  );
}
