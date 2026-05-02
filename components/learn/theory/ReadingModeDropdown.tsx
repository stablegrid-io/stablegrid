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
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-all duration-200 hover:scale-105 hover:text-white/90 active:scale-95"
        style={{
          backgroundColor: open ? 'var(--rm-bg-elevated)' : 'transparent',
        }}
        aria-label="Appearance settings"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {(() => {
          const ActiveIcon = MODE_OPTIONS.find((o) => o.id === mode)?.icon ?? Palette;
          return <ActiveIcon className="h-4 w-4" />;
        })()}
      </button>

      {open && mounted && panelPos && createPortal(
        <div
          ref={panelRef}
          data-reading-mode={mode}
          className="fixed z-[1000] w-56 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden"
          style={{
            top: panelPos.top,
            right: panelPos.right,
            border: '1px solid color-mix(in srgb, var(--rm-border) 60%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--rm-bg-elevated) 85%, transparent)',
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
          }}
          onKeyDown={handleKeyDown}
        >
          <div className="px-3.5 pt-3 pb-1.5">
            <span
              className="text-[10px] font-mono font-bold tracking-wide uppercase"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              Appearance
            </span>
          </div>

          <div className="px-1.5 pb-1" role="radiogroup" aria-label="Reading mode">
            {MODE_OPTIONS.map((opt, index) => {
              const Icon = opt.icon;
              const isActive = mode === opt.id;
              const isFocused = focusedIndex === index;
              // Dividers between groups: after Light (idx 1), after Kindle (idx 3)
              const showDivider = index === 2 || index === 4;
              return (
                <div key={opt.id}>
                  {showDivider && (
                    <div className="mx-3 my-0.5 h-px" style={{ backgroundColor: 'var(--rm-border)' }} />
                  )}
                  <button
                    type="button"
                    onClick={() => handleModeClick(opt.id, opt.label)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150"
                    style={{
                      backgroundColor: isActive
                        ? 'var(--rm-bg)'
                        : isFocused
                          ? 'var(--rm-bg)'
                          : 'transparent',
                      color: isActive ? 'var(--rm-text)' : 'var(--rm-text-secondary)',
                    }}
                    role="radio"
                    aria-checked={isActive}
                    tabIndex={isFocused || (focusedIndex === -1 && isActive) ? 0 : -1}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-[11px] font-medium tracking-wide">
                      {opt.label.charAt(0) + opt.label.slice(1).toLowerCase()}
                    </span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--rm-text)' }} />
                    )}
                  </button>
                </div>
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

  return (
    <button
      type="button"
      onClick={toggleFocus}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 hover:text-white/90 active:scale-95 ${
        focusMode ? 'text-white/90' : 'text-white/70'
      }`}
      aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
      aria-pressed={focusMode}
      title={focusMode ? 'Exit focus mode' : 'Focus mode'}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};
