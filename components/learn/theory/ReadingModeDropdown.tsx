'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Moon, Sun, BookOpen, Tablet, Eclipse, Maximize2, Minimize2 } from 'lucide-react';
import { useReadingModeStore, type ReadingMode } from '@/lib/stores/useReadingModeStore';

const MODE_OPTIONS: { id: ReadingMode; label: string; icon: typeof Moon }[] = [
  { id: 'dark', label: 'DARK', icon: Moon },
  { id: 'light', label: 'LIGHT', icon: Sun },
  { id: 'book', label: 'BOOK', icon: BookOpen },
  { id: 'kindle', label: 'KINDLE', icon: Tablet },
  { id: 'nightowl', label: 'NIGHT OWL', icon: Eclipse },
  { id: 'black', label: 'PITCH BLACK', icon: Moon },
];

export const ReadingModeDropdown = () => {
  const { mode, setMode } = useReadingModeStore();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState('');
  // Panel position — recomputed from the trigger's bounding rect so the
  // panel can be portaled to document.body and avoid being trapped in
  // any ancestor stacking context (e.g. a sticky toolbar at z-40 was
  // letting siblings outside the toolbar intercept clicks on the
  // panel's top edge).
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => { setOpen(false); setFocusedIndex(-1); }, []);

  useEffect(() => { setMounted(true); }, []);

  // Recompute panel position whenever it opens, on resize, and on
  // ancestor scroll. The panel is `position: fixed` in the portal, so
  // it must follow the trigger's viewport position.
  const recomputePos = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    recomputePos();
    const onResize = () => recomputePos();
    const onScroll = () => recomputePos();
    window.addEventListener('resize', onResize);
    // Capture phase so we catch scrolls on any ancestor scroll container
    // (the practice-runner content area uses overflow-y-auto).
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, recomputePos]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      if (panelRef.current && panelRef.current.contains(target)) return;
      close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, MODE_OPTIONS.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    }
    if ((e.key === 'Enter' || e.key === ' ') && focusedIndex >= 0) {
      e.preventDefault();
      const selected = MODE_OPTIONS[focusedIndex];
      setMode(selected.id);
      setAnnouncement(`Reading mode changed to ${selected.label}`);
    }
  };

  const handleModeClick = (id: ReadingMode, label: string) => {
    setMode(id);
    setAnnouncement(`Reading mode changed to ${label}`);
  };

  return (
    <div ref={ref} className="relative" data-reading-mode={mode}>
      <div className="sr-only" aria-live="polite" role="status">{announcement}</div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center transition-colors"
        style={{
          color: 'var(--rm-text-secondary)',
          backgroundColor: open ? 'var(--rm-bg)' : 'transparent',
          border: open ? '1px solid var(--rm-text)' : '1px solid transparent',
        }}
        aria-label="Appearance settings"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {(() => {
          const ActiveIcon = MODE_OPTIONS.find((o) => o.id === mode)?.icon ?? Palette;
          return <ActiveIcon className="h-4 w-4" strokeWidth={1.5} />;
        })()}
      </button>

      {open && mounted && panelPos && createPortal(
        <div
          ref={panelRef}
          data-reading-mode={mode}
          className="fixed z-[1000] w-60 overflow-hidden"
          style={{
            top: panelPos.top,
            right: panelPos.right,
            border: '1px solid var(--rm-text)',
            backgroundColor: 'var(--rm-bg-elevated)',
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Editorial header — section label + total-editions counter, the
              way a magazine masthead names the picker before the choices. */}
          <div
            className="flex items-baseline justify-between px-3 py-2 border-b"
            style={{
              borderColor: 'var(--rm-border)',
              backgroundColor: 'var(--rm-bg)',
            }}
          >
            <span
              className="font-data-mono uppercase text-[9px] tracking-[0.22em]"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              Edition
            </span>
            <span
              className="font-data-mono uppercase text-[9px] tracking-[0.18em] tabular-nums"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              {String(MODE_OPTIONS.findIndex((o) => o.id === mode) + 1).padStart(2, '0')}{' / '}
              {String(MODE_OPTIONS.length).padStart(2, '0')}
            </span>
          </div>

          <div role="radiogroup" aria-label="Reading mode" className="grid grid-cols-2">
            {MODE_OPTIONS.map((opt, index) => {
              const Icon = opt.icon;
              const isActive = mode === opt.id;
              const isFocused = focusedIndex === index;
              const isLeftCol = index % 2 === 0;
              const isTopRow = index < 2;
              const editionNumber = String(index + 1).padStart(2, '0');
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleModeClick(opt.id, opt.label)}
                  className="relative flex flex-col gap-2 px-3 py-2.5 text-left transition-colors"
                  style={{
                    borderTop: !isTopRow ? '1px solid var(--rm-border)' : 'none',
                    borderLeft: !isLeftCol ? '1px solid var(--rm-border)' : 'none',
                    backgroundColor: isActive || isFocused ? 'var(--rm-bg)' : 'transparent',
                  }}
                  role="radio"
                  aria-checked={isActive}
                  tabIndex={isFocused || (focusedIndex === -1 && isActive) ? 0 : -1}
                >
                  {/* Top row — edition number on the left, mini "page sample"
                      on the right. The swatch's data-reading-mode scopes the
                      --rm-* vars so each option previews itself. */}
                  <div className="flex items-center justify-between">
                    <span
                      className="font-data-mono uppercase text-[8px] tracking-[0.2em] tabular-nums leading-none"
                      style={{ color: 'var(--rm-text-secondary)' }}
                    >
                      {editionNumber}
                    </span>
                    <span
                      aria-hidden
                      className="relative flex h-6 w-6 shrink-0 items-center justify-center"
                      style={{
                        backgroundColor: 'var(--rm-bg)',
                        border: '1px solid var(--rm-text)',
                      }}
                    >
                      <Icon
                        className="h-3 w-3"
                        strokeWidth={1.6}
                        style={{ color: 'var(--rm-accent, var(--rm-text))' }}
                      />
                    </span>
                  </div>
                  {/* Label takes the full cell width on its own line so long
                      names like "Pitch black" don't get truncated. */}
                  <span
                    className="block font-ui-label uppercase text-[10px] tracking-wider truncate"
                    style={{ color: isActive ? 'var(--rm-text)' : 'var(--rm-text-secondary)' }}
                  >
                    {opt.label}
                  </span>
                  {/* Active marker — a 2px accent stripe along the bottom of
                      the cell, like the page-marker tab on a magazine cover. */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-0 right-0 bottom-0 h-0.5"
                      style={{ backgroundColor: 'var(--rm-accent, var(--rm-text))' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

        </div>,
        document.body,
      )}
    </div>
  );
};

/* ── Focus Mode Button (standalone, sits next to ReadingModeDropdown) ───────── */

export const FocusModeButton = () => {
  const { focusMode, toggleFocus } = useReadingModeStore();
  const Icon = focusMode ? Minimize2 : Maximize2;

  // Reading-mode-themed: previously the button used the site `on-surface`
  // token, so the icon vanished against any dark `--rm-bg` (Dark, Night Owl,
  // Pitch Black). Now it tracks `--rm-text*` so it stays legible in every
  // edition.
  return (
    <button
      type="button"
      onClick={toggleFocus}
      className="inline-flex h-8 w-8 items-center justify-center transition-colors"
      style={{
        color: focusMode ? 'var(--rm-text)' : 'var(--rm-text-secondary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--rm-text)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = focusMode
          ? 'var(--rm-text)'
          : 'var(--rm-text-secondary)';
      }}
      aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
      aria-pressed={focusMode}
      title={focusMode ? 'Exit focus mode' : 'Focus mode'}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
};
